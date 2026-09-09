<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropTransaction extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "ulb_id",
        "saf_detail_id",
        "property_detail_id",
        "ward_mstr_id",
        "notification_id",
        "tran_date",
        "tran_no",
        "payment_mode",
        "payable_amt",
        "demand_amt",
        "penalty_amt",
        "discount_amt",
        "from_fyear",
        "from_qtr",
        "upto_fyear",
        "upto_qtr",
        "remarks",
        "user_id",
        "user_type",
        "verification_status",
        "verified_by",
        "verify_date",
        "pay_gateway",
        "payment_status",
        "lock_status",
        "tran_type",
        "swm_paid_amount",
        "property_paid_amount",
        "water_paid_amount"
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function getChequeDtl(){
        return $this->belongsTo(ChequeDetail::class,"id","transaction_id")->where("lock_status",false)->orderBy("id","DESC")->first();
    }

    public function getSwmTrans(){
        return $this->hasMany(SwmConsumerTransaction::class,"prop_transaction_id","id")->where("lock_status",false)->orderBy("id","DESC")->get();
    }
}
