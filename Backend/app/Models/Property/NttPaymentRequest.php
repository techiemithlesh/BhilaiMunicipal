<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NttPaymentRequest extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "atom_token_id",
        "order_id",
        "merch_id",
        "status",
        "module",
        "app_id",
        "payment_type",
        "demand_amt",
        "penalty_amt",
        "discount",
        "payable_amt",
        "user_id",
        "user_type",
        "demand_data",
        "request_data",
        "payload",
        "payload_hash_value",
        "response",
        "response_hash_value",
        "tran_id",
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
