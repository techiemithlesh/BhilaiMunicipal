<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CategoryTypeMaster extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "category_type",
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

    public function getCategoryTypeList(){
        return self::where("lock_status",false)->orderBy("id","ASC")->get();
    }
}
