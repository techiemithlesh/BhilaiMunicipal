<?php

namespace App\Models\Property;

use App\Trait\Loggable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;

class ParamModel extends Model
{
    use HasFactory,Loggable;
    protected $guarded = [];
    protected $conn = "pgsql_property";
    protected $dbKey="property";

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

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }

}
