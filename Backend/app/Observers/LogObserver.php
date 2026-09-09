<?php

namespace App\Observers;

use App\Models\ModelLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LogObserver
{
    // define your columns in one place:
    protected array $logColumns = [
        'id'           => 'increments',
        'token'        => 'string',
        "connection"   => "string",
        "ulb_id"       => "unsignedBigInteger",
        'model_type'   => 'string',
        'model_table'  => 'string',
        'model_id'     => 'unsignedBigInteger',
        'action'       => 'string',
        'changes'      => 'json',
        'route_name'   => 'string',
        'payload'      => 'json',
        'user_id'      => 'unsignedBigInteger',
        'user_type'      => 'string',
        'url'          => 'string',
        'reference_id' => 'string',
        "ip_address"   => "string",
        'created_at'   => 'timestamp',
        'updated_at'   => 'timestamp',
        "is_revert"     =>"boolean",
        "response_body"=>"json",
    ];

    public function created($model)
    {
        $this->logChanges($model, 'created');
    }

    public function updated($model)
    {
        $this->logChanges($model, 'updated');
    }

    public function deleted($model)
    {
        $this->logChanges($model, 'deleted');
    }

    protected function logChanges($model, $action)
    {

        $connectionName = $model->getConnectionName();
        DB::connection($connectionName)->enableQueryLog();
        // ensure table structure
        $logModel = (new ModelLog());
        $this->ensureLogTableStructure($logModel->getConnectionName()? $logModel->getConnectionName():"");
        $user = Auth::user();
        $ulbId = App::has('CurrentUlbId') ? App::get('CurrentUlbId') : $user?->ulb_id;

        $data = [
            'token'        => app('requestToken'),
            "connection" => $connectionName,
            "ulb_id"   => $ulbId,
            'model_type'   => get_class($model),
            'model_table'  => $model->getTable(),
            'model_id'     => $model->getKey(),
            'action'       => $action,
            'changes'      => json_encode([
                'old' => $action === 'updated' ? $model->getOriginal() : null,
                'new' => $action !== 'deleted' ? $model->getDirty() : null,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'route_name'   => optional(Request::route())->getName(),
            'payload'      => json_encode(request()->all(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'user_id'      => $user?->id,
            'user_type'     => $user?->getTable(),
            'url'          => Request::fullUrl(),
            'reference_id' => (string) Str::uuid(),
            "ip_address" => request()->ip(),
            'created_at'   => now(),
            'updated_at'   => now(),
        ];

        $logModel->create($data);
    }

    protected function ensureLogTableStructure(string $connectionName=""): void
    {
        $schema = $connectionName ? Schema::connection($connectionName) : Schema::getFacadeRoot();

        if (!$schema->hasTable('model_logs')) {
            $schema->create('model_logs', function (Blueprint $table) {                
                $table->bigIncrements("id");
                foreach ($this->logColumns as $column => $type) {
                    if($column=="id"){
                        continue;
                    }
                    $this->addColumn($table, $column, $type);
                }
            });
        } else {
            $existingColumns = $schema->getColumnListing('model_logs');
            foreach ($this->logColumns as $column => $type) {
                if (!in_array($column, $existingColumns)) {
                    $schema->table('model_logs', function (Blueprint $table) use ($column, $type) {
                        $this->addColumn($table, $column, $type);
                    });
                }
            }
        }
    }

    protected function addColumn(Blueprint $table, string $column, string $type): void
    {
        switch ($type) {
            case 'increments':
                if (!Schema::hasColumn($table->getTable(), $column)) {
                    $table->bigIncrements($column);
                }
                break;
            case 'unsignedBigInteger':
                $table->unsignedBigInteger($column)->nullable();
                break;
            case 'string':
                $table->string($column)->nullable();
                break;
            case 'json':
                $table->json($column)->nullable();
                break;
            case 'timestamp':
                $table->timestamp($column)->nullable();
                break;
            case 'boolean':
                $table->boolean($column)->default(false);
                break;
            default:
                $table->string($column)->nullable();
                break;
        }
    }
}
