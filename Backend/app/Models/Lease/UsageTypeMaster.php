<?php

namespace App\Models\Lease;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class UsageTypeMaster extends ParamModel
{
    protected $fillable = [
        "usage_type",
        "lock_status"
    ];

    private $_cashKey = "LEASE_USAGE_TYPE_LIST";

    public function cashingData(){
        $areaList = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$areaList);  
        return json_encode($areaList);
    }

    public function store($request){
        $inputs = snakeCase($request);
        $role= self::create($inputs->all());
        $this->cashingData();
        return $role->id;
    }

    public function edit($request){
        $inputs= snakeCase($request)->filter(function($val,$index){
            return (in_array($index,$this->fillable));
        });
        $model = self::find($request->id);
        $returnData= $model->update($inputs->all());
        $this->cashingData();
        return $returnData;
    }

    public function getUsageList(){
        $areaList  = json_decode(Redis::get($this->_cashKey));
        if(!$areaList){
            $areaList = json_decode($this->cashingData());            
        }
        return collect($areaList);
    }
}
