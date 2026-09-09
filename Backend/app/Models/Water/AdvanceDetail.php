<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AdvanceDetail extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "application_id",
        "consumer_id",
        "amount",
        "reason",
        "remarks",
        "doc",
        "transaction_id",
        "user_id",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

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
