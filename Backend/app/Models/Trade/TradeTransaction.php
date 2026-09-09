<?php

namespace App\Models\Trade;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TradeTransaction extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "trade_license_id",
        "ward_mstr_id",
        "notification_id",
        "tran_date",
        "tran_no",
        "payment_mode",
        "payable_amt",
        "demand_amt",
        "penalty_amt",
        "discount_amt",
        "rate",
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

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getChequeDtl(){
        return $this->belongsTo(ChequeDetail::class,"id","transaction_id")->where("lock_status",false)->orderBy("id","DESC")->first();
    }
}
