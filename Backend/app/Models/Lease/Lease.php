<?php

namespace App\Models\Lease;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Model;

class Lease extends ParamModel
{
    protected $fillable = [
        "ulb_id",
        "ward_mstr_id",
        "lease_no",
        "lease_reg_no",
        "property_detail_id",
        "holding_no",
        "uses_type_id",
        "area_id",
        "length",
        "width",
        "address",
        "pin_code",
        "lease_date",
        "lease_end_date",
        "lease_status_id",
        "apply_date",
        "current_rate_id",
        "user_id",
        "lock_status",
    ];

    public function getWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }

    public function getCurrentRent(){
        return $this->hasOne(LeaseRent::class,"id","current_rate_id")->where("lock_status",false);
    }

    public function getAllRent(){
        return $this->hasMany(LeaseRent::class,"id","current_rate_id")->where("lock_status",false)->get();
    }

    public function getDemand(){
        return $this->hasMany(LeaseDemand::class,"lease_id","id")->where("lock_status",false);
    }

    public function getOwners(){
        return $this->hasMany(LeaseOwner::class,"lease_id","id")->where("lock_status",false)->get();
    }

    public function getTrans(){
        return $this->hasMany(LeaseTransaction::class,"lease_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(LeaseTransaction::class,"lease_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getAllDemand(){
        return $this->hasMany(LeaseDemand::class,"lease_id","id")->where("lock_status",false);
    }
}
