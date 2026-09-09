<?php

namespace App\Models\Water;

use App\Trait\Loggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;

class ParamModel extends Model
{
    use HasFactory,Loggable;
    protected $guarded = [];
    protected $conn = "pgsql_water";
    protected $dbKey="water";

    public function __construct()
    {
        parent::__construct();
        // Set dynamic connection here during object creation
        $this->setConnection($this->resolveDynamicConnection() ?? $this->conn);
    }

    public function resolveDynamicConnection()
    {
        $ulbId = App::has('CurrentUlbId') ? App::get('CurrentUlbId') : null;
        return $ulbId ? Config::get("SystemConstant.ULB-DB.".$ulbId.".".$this->dbKey) : $this->conn;
    }

    public static function readConnection()
    {
        $self = new static; //OBJECT INSTANTIATION
        return $self->setConnection($self->conn."::read");
    }

    public static function editDirty($request)
    {
        $model = new static;
        $inputs = snakeCase($request)->only($model->getFillable())->toArray(); // use getFillable() safely
        $model->fill($inputs);
        return $model; // caller will decide when to save

    }
}
