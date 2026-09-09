<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VacantArvRateMaster extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "ulb_type_id",
        "road_type_id",
        "rate",
        "effective_from",
        "effective_upto",
        "lock_status",
    ];

    public function store($request){
        $inputs = snakeCase($request);
        return self::create($inputs->all())->id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        return $return;
    }

    public function getRate(){
        return self::where("lock_status",false)->get();
    }
}
