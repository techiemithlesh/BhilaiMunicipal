<?php

namespace App\Models\SWM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class RateMaster extends ParamModel
{
    use HasFactory;
    protected $fillable = [
        "sub_category_type_master_id",
        "rate_per_month",
        "restaurant_rate_per_month",
        "garden_rate_per_month",
        "banquet_hall_rate_per_month",
        "composting_machine_rate",
        "is_percent_composting_machine_rate",
        "effective_from",
        "effective_upto",
        "lock_status",
    ];

    private $_cashKey = "SWM_RATE_LIST";

    private function cashingData(){
        $rateList = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$rateList);  
        return json_encode($rateList);
    }

    public function store($request){
        $inputs = snakeCase($request);
        $this->cashingData();
        return self::create($inputs->all())->id;
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

    public function getRateList(){
        $rateList  = json_decode(Redis::get($this->_cashKey));
        if(!$rateList){
            $rateList = json_decode($this->cashingData());            
        }
        return collect($rateList);
    }
}
