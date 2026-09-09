<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwmChequeDetail extends ParamModel
{
    use HasFactory;

    protected $fillable=[
        "transaction_id",
        "cheque_no",
        "cheque_date",
        "bank_name",
        "branch_name",
        "cheque_status",
        "clear_bounce_date",
        "remarks",
        "bounce_amount",
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
