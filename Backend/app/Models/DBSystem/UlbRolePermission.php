<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class UlbRolePermission extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "ulb_id",
        "module_id",
        "role_id",
        "can_doc_upload",
        "can_doc_verify",
        "can_add",
        "can_app_edit",
        "can_app_lock",
        "can_app_unlock",
        "can_take_payment",
        "can_generate_notice",
        "can_notice_approved",
        "can_generate_demand",
        "can_meter_change",
        "can_cash_verify",
        "can_tran_deactivate",
        "can_cheque_status_verify",
        "can_payment_mode_update",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        $test = self::where("ulb_id",($inputs["ulb_id"]))
                ->where("role_id",($inputs["role_id"]))
                ->where("module_id",($inputs["module_id"]))
                ->first();
        if($test){
            $newRequest = new Request(["id"=>$test->id,"lockStatus"=>false]);
            $this->edit($newRequest);
            return $test->id;
        }
        $role= self::create($inputs->all());
        return $role->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        return $returnData;
    }


    public function getRole(){
        return $this->belongsTo(RoleTypeMstr::class,"role_id","id");
    }
    public function getModule(){
        return $this->belongsTo(ModuleMaster::class,"module_id","id");
    }
    public function getUlb(){
        return $this->belongsTo(UlbMaster::class,"ulb_id","id");
    }
}
