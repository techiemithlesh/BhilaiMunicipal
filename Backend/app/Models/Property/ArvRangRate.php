<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class ArvRangRate extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        "ulb_id",
        "from_date",
        "upto_date",
        "from_arv",
        "upto_arv",
        "rate_percent",
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

    public function getArvRangeTypeList(){
        return self::where("lock_status",false)->get();
    }
}
