<?php

namespace App\Models\DBSystem;

use App\Bll\Common;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class WorkflowMaster extends ParamModel
{
    use HasFactory; 
    protected $fillable = [
        "module_id",
        "workflow_name",
        "lock_status",
        "lock_status",
    ];
    private function cashingData($wfMaterId){
        $user = Auth()->user();
        $obj = new Common();
        $obj->destroyCashing($user->ulb_id,$wfMaterId);
    }

    public function getWorkFlowRoles(){
        return $this->hasMany(WorkflowUlbRoleMap::class,"workflow_id","id")->where("lock_status",false);
    }

    public function store(Request $request){
        $inputs = snakeCase($request);
        $data= self::create($inputs->all());
        $this->cashingData($data->id);
        return $data->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        $this->cashingData($model->id);
        return $returnData;
    }
}
