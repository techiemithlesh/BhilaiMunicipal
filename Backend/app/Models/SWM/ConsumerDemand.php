<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerDemand extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "consumer_id",
        "tax_detail_id",
        "rate",
        "generation_date",
        "demand_from",
        "demand_upto",
        "amount",
        "balance",
        "paid_status",
        "is_full_paid",
        "user_id",
        "lock_status",
    ];

    public function getDueDemand($consumerId){
        return self::where("consumer_id",$consumerId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("demand_upto","ASC")
                ->get();
    }
}
