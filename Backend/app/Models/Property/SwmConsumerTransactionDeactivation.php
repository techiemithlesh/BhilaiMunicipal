<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwmConsumerTransactionDeactivation extends ParamModel
{
    use HasFactory;
    protected $fillable=[
        "transaction_id",
        "remarks",
        "doc_path",
        "ref_unique_no",
        "user_id",
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
