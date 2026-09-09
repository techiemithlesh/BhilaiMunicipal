<?php

namespace App\Models\DBSystem;

use App\Bll\Common;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class WorkflowUlbRoleMap extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "workflow_id",
        "role_id",
        "forward_role_id",
        "backward_role_id",
        "serial_no",
        "is_initiator",
        "is_finisher",
        "can_doc_upload",
        "can_doc_verify",
        "can_sam_generate",
        "can_fam_generate",
        "can_field_verify",
        "can_backward",
        "can_btc",
        "can_forward",
        "can_app_edit",
        "can_geotag",
        "can_app_approved",
        "can_app_reject",
        "can_take_payment",
        "has_full_permission",
        "lock_status",
    ];
    private function cashingData($ulbId,$wfMaterId){
        $obj = new Common();
        $obj->destroyCashing($ulbId,$wfMaterId);
    }

    public function store(Request $request){
        $inputs = snakeCase($request);
        $data= self::create($inputs->all());
        $this->cashingData($data->ulb_id,$data->workflow_id);
        return $data->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        $this->cashingData($model->ulb_id,$model->workflow_id);
        return $returnData;
    }
}
