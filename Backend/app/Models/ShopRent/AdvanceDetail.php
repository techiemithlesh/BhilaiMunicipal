<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class AdvanceDetail extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_id',
        'transaction_id',
        'amount',
        'remarks',
        'reason',
        'doc',
        'user_id',
        'lock_status',
    ];

    public function getConsumerAdvanceAmount($shopId){
        return self::select(DB::raw("(COALESCE (SUM(advance_details.amount),0) - COALESCE (SUM(adjustment_details.amount),0)) AS advance_amount"))
                ->leftJoin("adjustment_details",function ($join) {
                    $join->on("adjustment_details.shop_id", "advance_details.shop_id")
                    ->where("adjustment_details.lock_status",false);
                })
                ->where("advance_details.lock_status",false)
                ->where("advance_details.shop_id",$shopId)
                ->first();
    }
}
