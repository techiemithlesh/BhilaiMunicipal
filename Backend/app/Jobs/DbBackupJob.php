<?php

namespace App\Jobs;

use App\Events\DbBackupReady;
use App\Jobs\Middleware\DeferIfServerBusy;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\Process\Process;

class DbBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 10;

    protected $userId;
    protected $token;
    protected $conn;

    /**
     * Create a new job instance.
     */
    public function __construct($userId, $token, $conn)
    {
        $this->userId = $userId;
        $this->token  = $token;
        $this->conn   = $conn;
    }

    public function middleware(): array
    {
        return [new DeferIfServerBusy(70.0, 180)];
    }

    public function handle(): void
    {
        try {
            // 1. Fetch database name and credentials from config connection
            $dbConfig = Config::get("database.connections.{$this->conn}");

            if (!$dbConfig) {
                throw new Exception("Database connection '{$this->conn}' is not defined in config/database.php.");
            }

            $dbName     = $dbConfig['database'] ?? $this->conn;
            $dbUser     = $dbConfig['username'] ?? 'postgres';
            $dbPass     = $dbConfig['password'] ?? '';
            $remotePort = (string)($dbConfig['port'] ?? 5432);
            $host       = $dbConfig['host'] ?? '127.0.0.1';

            // 2. Setup Backup Directory & Filename
            $folderName = config('app.name', 'backups');
            $timestamp  = Carbon::now()->format('Ymd_His');

            $fileName     = "{$dbName}_{$timestamp}.bak";
            $relativePath = "{$folderName}/{$fileName}";

            $disk = Storage::disk('local');
            $fullDirPath = $disk->path("{$folderName}");

            if (!file_exists($fullDirPath)) {
                mkdir($fullDirPath, 0755, true);
            }

            $absoluteFilePath = $disk->path($relativePath);

            // 3. Configure dump binary path (fallback to raw binary if path isn't defined)
            // Get binary path from config, or default to system env
            $dumpBinaryFolder = $dbConfig['dump']['dump_binary_path'] ?? env('DB_DUMP_BINARY_PATH', '');

            // Handle trailing slash / backslash properly across OS platforms
            if (!empty($dumpBinaryFolder)) {
                $dumpBinaryFolder = rtrim($dumpBinaryFolder, '/\\') . DIRECTORY_SEPARATOR;
            }

            $pgDumpBinary = $dumpBinaryFolder . 'pg_dump';

            $dumpCommand = [
                $pgDumpBinary,
                '-h', $host,
                '-p', $remotePort,
                '-U', $dbUser,
                '-F', 'c',   // Custom format (.bak)
                '-b',        // Include large objects
                '-v',        // Verbose output
                '-f', $absoluteFilePath,
                $dbName
            ];

            // 4. Run Process
            $dumpProcess = new Process($dumpCommand);
            $dumpProcess->setEnv(['PGPASSWORD' => $dbPass]);
            $dumpProcess->setTimeout(1800); // 30 minutes timeout
            $dumpProcess->run();

            // 5. Verify export success
            if (!$dumpProcess->isSuccessful()) {
                throw new Exception("pg_dump failed: " . $dumpProcess->getErrorOutput());
            }

            if (!file_exists($absoluteFilePath) || filesize($absoluteFilePath) === 0) {
                throw new Exception("pg_dump executed, but generated an empty file.");
            }

            // 6. Create Temporary Signed Download URL (30 min expiration)
            $downloadUrl = URL::temporarySignedRoute(
                'database.backups.download',
                now()->addMinutes(30),
                ['fileName' => urlencode($fileName)]
            );
            Log::info("downloadUrl= {$downloadUrl}");

            // Schedule delayed cleanup job
            DeleteExportFileJob::dispatch($relativePath)->delay(now()->addMinutes(30));

            // 7. Fire WebSocket completion event
            event(new DbBackupReady(
                $this->userId,
                $this->token,
                true,
                'Backup completed: ' . $fileName,
                $fileName,
                $downloadUrl
            ));

            Log::info("DB BACKUP SUCCESS: connection = {$this->conn}, path = {$relativePath}");

        } catch (Exception $e) {
            event(new DbBackupReady(
                $this->userId,
                $this->token,
                false,
                'Job failed: ' . $e->getMessage(),
                '',
                ''
            ));

            Log::error("DB BACKUP ERROR: {$e->getMessage()} in {$e->getFile()}:{$e->getLine()}");
        } 
    }
}