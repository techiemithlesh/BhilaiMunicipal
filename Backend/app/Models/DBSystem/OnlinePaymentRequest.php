<?php

namespace App\Models\DBSystem;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlinePaymentRequest extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "gateway_type",
        "atom_token_id",
        "order_id",
        "merch_id",
        "status",
        "module_id",
        "sub_module_id",
        "payer_id",
        "payment_type",
        "amount",
        "success_url",
        "fail_url",
        "pay_url",
        "request_data",
        "payload",
        "payload_hash_value",
        "response",
        "response_hash_value",
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
