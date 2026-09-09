<?php

namespace App\Models\Water;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consumer extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_id",
        "consumer_no",
        "ulb_id",
        "connection_type_id",
        "property_type_id",
        "connection_through_id",
        "category",
        "pipeline_type_id",
        "ownership_type_id",
        "property_detail_id",
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
        "connection_date",
        "meter_status_id",
        "user_id",
        "citizen_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getOwners(){
        return $this->hasMany(ConsumerOwner::class,"consumer_id","id")->where("lock_status",false)->get();
    }
    public function getWardOldWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }
    public function getWardNewdWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"new_ward_mstr_id","id")->first();
    }

    public function getTrans(){
        return $this->hasMany(WaterTransaction::class,"consumer_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(WaterTransaction::class,"consumer_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getCurrentConnection(){
        return $this->hasOne(MeterStatus::class,"id","meter_status_id");
    }

    public function getDemand(){
        return $this->hasMany(ConsumerDemand::class,"consumer_id","id")->where("lock_status",false);
    }

}
