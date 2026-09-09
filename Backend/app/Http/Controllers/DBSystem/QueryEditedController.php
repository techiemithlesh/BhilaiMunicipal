<?php

namespace App\Http\Controllers\DBSystem;

use App\Exceptions\CustomException;
use App\Http\Controllers\Controller;
use App\Models\DBSystem\ParamModel;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class QueryEditedController extends Controller
{
    private $conn;
    private $dbList = [
        [
            "label" => "system",
            "value" => null,
        ],
        [
            "label" => "property",
            "value" => "property",
        ],
        [
            "label" => "water",
            "value" => "water",
        ],
        [
            "label" => "trade",
            "value" => "trade",
        ],
    ];

    public function __construct()
    {
        $this->conn = (new ParamModel())->getConnectionName();
    }

    /**
     * Resolves the runtime configuration string for the database matrix.
     */
    private function resolveDynamicConnection($dbKey = "")
    {
        $ulbId = App::has('CurrentUlbId') ? App::get('CurrentUlbId') : null;
        if ($dbKey) {
            // Overrides $this->conn with the configured database instance key
            $this->conn = $ulbId ? Config::get("SystemConstant.ULB-DB." . $ulbId . "." . $dbKey) : $this->conn;
        }
    }

    /**
     * Verifies that the acting client is a root administrator.
     */
    private function checkAdminPermission()
    {
        $user = auth()->user();
        if (!$user) {
            throw new CustomException("Unauthorized access.");
        }
        
        $roles = $user->getRoleDetailsByUserId()->get()->first();
        if (!$roles || $roles->id != 1 || $user->getTable() != "users") {
            throw new CustomException("Permission Denial");
        }
    }

    public function getDbList(Request $request)
    {
        try {
            return responseMsg(true, "DB List", remove_null($this->dbList));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Server Error", "");
        }
    }

    public function getTableList(Request $request)
    {
        try {
            $rules = [
                "conn" => "nullable|in:" . collect($this->dbList)->pluck("value")->implode(","),
            ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return validationError($validator);
            }
            
            $this->resolveDynamicConnection($request->conn);
            
            $data = DB::connection($this->conn)->select("
                SELECT c.relname AS name,
                       c.relkind,
                       CASE WHEN c.relkind='r' THEN 'table'
                            WHEN c.relkind='v' THEN 'view'
                            WHEN c.relkind='m' THEN 'materialized view'
                            WHEN c.relkind='f' THEN 'foreign table'
                            ELSE 'other'
                       END AS table_type
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' 
                  AND c.relkind IN ('r','v','m','f')
                ORDER BY c.relkind, name
            ");
            
            return responseMsg(true, "Table List", remove_null($data));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Server Error", "");
        }
    }

    public function QueryExecute(Request $request)
    {
        try {
            $rules = [
                "conn" => "nullable|in:" . collect($this->dbList)->pluck("value")->implode(","),
                "statement" => "required|string",
            ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return validationError($validator);
            }

            // Enforce Super Admin Check
            $this->checkAdminPermission();
            $this->resolveDynamicConnection($request->conn);

            // Sanitize query statement against multiple instructions (SQLSTATE[42601])
            $sql = trim($request->statement);
            if (str_contains($sql, ';')) {
                $commands = collect(explode(';', $sql))
                    ->map(fn($cmd) => trim($cmd))
                    ->filter()
                    ->values();
                $sql = $commands->first() ?? '';
            }

            if (empty($sql)) {
                throw new CustomException("Invalid execution command context.");
            }

            $data = null;
            if (preg_match('/update |insert |delete |alter |create |drop |truncate |call |lock |commit |rollback /i', $sql)) {
                $affectedRows = DB::connection($this->conn)->affectingStatement($sql);
                $data = "UPDATE " . $affectedRows . " record(s) affected";
            } else {                
                $results = DB::connection($this->conn)->select($sql);                
                if (empty($results)) {
                    $data = "No data";
                } else {
                    $firstRow = $results[0] ?? [];
                    $data["headers"] = array_keys((array) $firstRow);
                    $data["data"] = $results;
                }
            }
            
            return responseMsg(true, "Execute Successfully", $data);
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, $e->getMessage(), ""); 
        }
    }

    public function downloadBackup(Request $request)
    {       
        try {
            $rules = [
                "conn" => "nullable|in:" . collect($this->dbList)->pluck("value")->implode(","),
            ];
            $validator = Validator::make($request->all(), $rules);
            if ($validator->fails()) {
                return validationError($validator);
            }

            // 1. Enforce Super Admin Security Check for Backups
            $this->checkAdminPermission();

            // 2. Resolve target connection
            $this->resolveDynamicConnection($request->conn);

            // 3. Inform Spatie Backup of the *resolved configuration name*, not the input label
            config(['backup.backup.source.databases' => [$this->conn]]);

            // 4. Run backup execution framework context
            Artisan::call('backup:run', ['--only-db' => true]);
            // ADD THIS TEMPORARILY TO DEBUG:
            $output = Artisan::output();
            if (str_contains(strtolower($output), 'failed') || str_contains(strtolower($output), 'error')) {
                throw new CustomException("Backup binary failed: " . $output);
            }

            // 5. Track down the storage target folder
            $disk = Storage::disk('local');
            $backupFolder = "database-backups"; 
            $files = $disk->allFiles($backupFolder);

            if (empty($files)) {
                throw new CustomException('Backup file was generated but could not be located on disk.');
            }

            // Filter down to locate the newest generated file wrapper
            $latestFile = collect($files)
                ->filter(fn($file) => pathinfo($file, PATHINFO_EXTENSION) === 'zip')
                ->last();

            $absolutePath = $disk->path($latestFile);

            // // 6. Push down binary stream to React and auto-delete file off system after push
            // return response()->download($absolutePath)->deleteFileAfterSend(true);

            // 6. Convert the file to a base64 string blob
            if (!file_exists($absolutePath)) {
                throw new CustomException('Target backup file could not be accessed.');
            }

            $fileContents = file_get_contents($absolutePath);
            $base64Blob = base64_encode($fileContents);
            $fileName = basename($absolutePath);

            // 7. Delete the file off the server immediately since it's safely stored in memory
            unlink($absolutePath);

            // 8. Return JSON payload containing the encoded base64 blob string
            return responseMsg(true, 
                    "Backup generated and removed from storage folder successfully.", 
                    [
                        "file_name" => $fileName,
                        "file_blob" => $base64Blob, // This is your raw base64 string data stream
                        "mime_type" => "application/zip"
                    ]
                );

        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), ""); 
        } catch (Exception $e) {
            return responseMsg(false, $e->getMessage(), ""); 
        }
    }
}