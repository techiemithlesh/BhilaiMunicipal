<?php

namespace App\Models\Water;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterActiveApplication extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_no",
        "ulb_id",
        "connection_type_id",
        "property_type_id",
        "connection_through_id",
        "category",
        "pipeline_type_id",
        "ownership_type_id",
        "property_detail_id",
        "saf_detail_id",
        "ward_mstr_id",
        "new_ward_mstr_id",
        "area_sqft",
        "address",
        "landmark",
        "pin_code",
        "elect_consumer_no",
        "elect_acc_no",
        "elect_bind_book_no",
        "elect_cons_category",
        "is_doc_upload",
        "is_doc_verify",
        "doc_verify_date",
        "doc_verify_user_id",
        "payment_status",
        "pending_status",
        "approved_date",
        "approved_user_id",
        "is_field_verify",
        "field_verify_date",
        "field_verify_user_id",
        "is_utc_field_verify",
        "utc_field_verify_date",
        "utc_field_verify_user_id",
        "workflow_id",
        "current_role_id",
        "initiator_role_id",
        "finisher_role_id",
        "max_level_attempt",
        "is_btc",
        "apply_date",
        "user_id",
        "citizen_id",
        "lock_status",
    ];

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

    public function getOwners(){
        return $this->hasMany(WaterActiveApplicationOwner::class,"application_id","id")->where("lock_status",false)->get();
    }

    public function getAllOwners(){
        return $this->hasMany(WaterActiveApplicationOwner::class,"application_id","id")->get();
    }

    public function getWardOldWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
    public function getWardNewdWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"new_ward_mstr_id","id")->first();
    }

    public function getTrans(){
        return $this->hasMany(WaterTransaction::class,"application_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(WaterTransaction::class,"application_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getDocList(){
        return $this->hasMany(WaterApplicationDocDetail::class,"application_id","id")->where("lock_status",false);
    }

    public function getLevelRemarks(){
        return $this->hasMany(LevelRemark::class,"application_id","id")->where("lock_status",false);
    }

    public function getVerification(){
        return $this->hasMany(WaterApplicationFiledVerification::class,"application_id","id")->where("lock_status",false); 
    }
}
