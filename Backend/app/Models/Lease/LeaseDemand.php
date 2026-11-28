<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;

class LeaseDemand extends ParamModel
{
    protected $fillable = [
        "lease_id",
        "lease_rent_id",
        "ulb_id",
        "ward_mstr_id",
        "fyear",
        "amount",
        "penalty",
        "balance",
        "due_penalty",
        "paid_status",
        "is_full_paid",
        "user_id",
        "lock_status",
    ];

    public function getDueDemand($leaseId){
        return self::where("lease_id",$leaseId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("fyear","ASC")
                ->get();
    }
}
