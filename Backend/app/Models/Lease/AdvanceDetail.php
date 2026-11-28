<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AdvanceDetail extends ParamModel
{
    protected $fillable = [
        "lease_id",
        "transaction_id",
        "amount",
        "reason",
        "remarks",
        "doc",
        "user_id",
        "lock_status",
    ];

    public function getConsumerAdvanceAmount($leaseId){
        return self::select(DB::raw("(COALESCE (SUM(advance_details.amount),0) - COALESCE (SUM(adjustment_details.amount),0)) AS advance_amount"))
                ->leftJoin("adjustment_details",function ($join) {
                    $join->on("adjustment_details.lease_id", "advance_details.lease_id")
                    ->where("adjustment_details.lock_status",false);
                })
                ->where("advance_details.lock_status",false)
                ->where("advance_details.lease_id",$leaseId)
                ->first();
    }
}
