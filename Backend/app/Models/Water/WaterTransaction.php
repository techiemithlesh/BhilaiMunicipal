<?php

namespace App\Models\Water;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaterTransaction extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_id",
        "application_id",
        "consumer_id",
        "charge_type",
        "ward_mstr_id",
        "tran_date",
        "tran_no",
        "payment_mode",
        "payable_amt",
        "request_demand_amount",
        "demand_amt",
        "penalty_amt",
        "discount_amt",
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

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getChequeDtl(){
        return $this->belongsTo(ChequeDetail::class,"id","transaction_id")->where("lock_status",false)->orderBy("id","DESC")->first();
    }
}
