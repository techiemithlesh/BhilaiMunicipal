<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwmConsumerTransaction extends ParamModel
{
    use HasFactory;

    protected $fillable=[
        "prop_transaction_id",
        "consumer_id",
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

    public function store($request){
        $inputs = snakeCase($request);
        $id= self::create($inputs->all())->id;
        return $id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }
}
