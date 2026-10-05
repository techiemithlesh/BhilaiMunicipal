<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumerTransaction extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "consumer_id",
        "ward_mstr_id",
        "charge_type",
        "tran_date",
        "tran_no",
        "payment_mode",
        "payable_amt",
        "demand_amt",
        "penalty_amt",
        "discount_amt",
        "request_demand_amount",
        "from_date",
        "upto_date",
        "remarks",
        "user_id",
        "user_type",
        "verification_status",
        "verified_by",
        "verify_date",
        "pay_gateway",
        "payment_status",
        "tran_type",
        "lock_status",
    ];

    public function getChequeDtl(){
        return $this->belongsTo(ChequeDetail::class,"id","transaction_id")->where("lock_status",false)->orderBy("id","DESC")->first();
    }
}
