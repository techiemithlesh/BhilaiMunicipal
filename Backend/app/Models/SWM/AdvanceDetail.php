<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AdvanceDetail extends ParamModel
{
    use HasFactory;
    protected $fillable=[
        "consumer_id",
        "transaction_id",
        "amount",
        "reason",
        "remarks",
        "doc",
        "user_id",
        "lock_status",
    ];

    public function getConsumerAdvanceAmount($consumerId){
        return self::select(DB::raw("(COALESCE (SUM(advance_details.amount),0) - COALESCE (SUM(adjustment_details.amount),0)) AS advance_amount"))
                ->leftJoin("adjustment_details",function ($join) {
                    $join->on("adjustment_details.consumer_id", "advance_details.consumer_id")
                    ->where("adjustment_details.lock_status",false);
                })
                ->where("advance_details.lock_status",false)
                ->where("advance_details.consumer_id",$consumerId)
                ->first();
    }
}
