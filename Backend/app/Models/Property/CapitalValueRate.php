<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class CapitalValueRate extends ParamModel
{
    use HasFactory;

    private $_cashKey = "CAPITAL_VALUE_RATE";

    private function cashingData(){
        $list = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$list);
        Redis::expire($this->_cashKey, 18000);  
        return json_encode($list);
    }

    public function getRate(){
        $data = Redis::get($this->_cashKey);
        if(!$data){
            $data = ($this->cashingData());
        }
        return collect(json_decode($data));
    }
}
