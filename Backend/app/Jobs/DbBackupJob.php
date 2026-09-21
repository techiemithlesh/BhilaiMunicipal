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
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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
            // 1. Configure database connection target
            config(['backup.backup.source.databases' => [$this->conn]]);
            Config::set('database.default', $this->conn);

            DB::purge($this->conn);
            // 2. Run Spatie Backup command
            $exitCode = Artisan::call('backup:run', ['--only-db' => true]);

            $output = Artisan::output();
            $fatalKeywords = ['backup failed', 'dump failed', 'exception', 'fatal error'];
            foreach ($fatalKeywords as $keyword) {
                if (str_contains(strtolower($output), $keyword)) {
                    throw new Exception("Backup process output error: " . $output);
                }
            }

            // 3. Scan default app folder for generated files
            $disk = Storage::disk('local');
            $folderName = config('app.name');
            $files = $disk->allFiles($folderName);

            if (empty($files)) {
                throw new Exception("No files found in '{$folderName}' directory after running backup.");
            }

            // 4. Get the most recently created ZIP archive
            $latestFilePath = collect($files)
                ->filter(fn($file) => pathinfo($file, PATHINFO_EXTENSION) === 'zip')
                ->sortByDesc(fn($file) => $disk->lastModified($file))
                ->first();

            if (!$latestFilePath || !$disk->exists($latestFilePath)) {
                throw new Exception('Generated backup file could not be accessed.');
            }

            // 5. Optionally rename file to include connection & timestamp
            $fileName = basename($latestFilePath);
            
            // 6. Generate temporary download URL (30 min expiration)
            $downloadUrl = URL::temporarySignedRoute(
                'database.backups.download',
                now()->addMinutes(30),
                ['fileName' => $fileName]
            );

            // 7. Dispatch cleanup job delayed by 30 minutes
            DeleteExportFileJob::dispatch($latestFilePath)->delay(now()->addMinutes(30));

            // 8. Fire WebSocket event
            event(new DbBackupReady(
                $this->userId,
                $this->token,
                true,
                'File Ready: ' . $fileName,
                $fileName,
                $downloadUrl
            ));

            Log::info("DB BACKUP SUCCESS: connection = {$this->conn} fileName = {$fileName}, Path = {$latestFilePath}");

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