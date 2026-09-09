<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class OccupancyTypeMaster extends ParamModel
{
    use HasFactory;

    private $_cashKey = "OCCUPANCY_TYPE";
    protected $fillable = [
        "occupancy_name",
        "mult_factor",
        "lock_status",
    ];

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

    public function getOccupancyTypeList(){
        $data = Redis::get($this->_cashKey);
        if(!$data){
            $data = $this->cashingData();
        }
        return collect(json_decode($data));
    }
}
