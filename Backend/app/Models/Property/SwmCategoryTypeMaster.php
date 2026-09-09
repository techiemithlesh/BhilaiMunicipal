<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class SwmCategoryTypeMaster extends ParamModel
{
    use HasFactory;
    protected $fillable=[
        "category_type",
        "lock_status"
    ];

    private $_cashKey = "SWM_CATEGORY_TYPE";

    private function cashingData(){
        $list = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$list);
        Redis::expire($this->_cashKey, 18000);  
        return json_encode($list);
    }

    public function store($request){
        $inputs = snakeCase($request);
        $id= self::create($inputs->all())->id;
        $this->cashingData();
        return $id;
    }

    public function edit($request){
        $inputs = snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $return= $model->update($inputs->all());
        $this->cashingData();
        return $return;
    }

    public function getCategoryTypeList(){
        $data = Redis::get($this->_cashKey);
        if(!$data){
            $data = $this->cashingData();
        }
        return collect(json_decode($data));
    }

    public function getSubCategoryList(){
        return $this->hasMany(SwmSubCategoryTypeMaster::class,"category_type_master_id","id")->where("lock_status",false)->get();
    }

}
