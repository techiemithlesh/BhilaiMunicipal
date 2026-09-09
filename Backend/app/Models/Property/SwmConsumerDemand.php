<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SwmConsumerDemand extends ParamModel
{
    use HasFactory;

    protected $fillable=[
        "consumer_id",
        "tax_detail_id",
        "generation_date",
        "demand_from",
        "demand_upto",
        "amount",
        "balance",
        "paid_status",
        "is_full_paid",
        "rate",
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

    public function getDueDemand($swmId){
        return self::where("consumer_id",$swmId)
                ->where("lock_status",false)
                ->where("is_full_paid",false)
                ->orderBy("demand_from","ASC")
                ->get();
    }
}
