<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AdvanceDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "saf_detail_id",
        "property_detail_id",
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

    public function getSafAdvanceAmount($safId){
        return self::select(DB::raw("(COALESCE (SUM(advance_details.amount),0) - COALESCE (SUM(adjustment_details.amount),0)) AS advance_amount"))
                ->leftJoin("adjustment_details",function ($join) {
                    $join->on("adjustment_details.saf_detail_id", "advance_details.saf_detail_id")
                    ->where("adjustment_details.lock_status",false);
                })
                ->where("advance_details.lock_status",false)
                ->where("advance_details.saf_detail_id",$safId)
                ->first();
    }
    public function getPropAdvanceAmount($propId){
        return self::select(DB::raw("(COALESCE (SUM(advance_details.amount),0) - COALESCE (SUM(adjustment_details.amount),0)) AS advance_amount"))
                ->leftJoin("adjustment_details",function ($join) {
                    $join->on("adjustment_details.property_detail_id", "advance_details.property_detail_id")
                    ->where("adjustment_details.lock_status",false);
                })
                ->where("advance_details.lock_status",false)
                ->where("advance_details.property_detail_id",$propId)
                ->first();
    }
}
