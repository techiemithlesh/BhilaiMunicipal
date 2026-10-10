<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Redis;

class AreaMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'area_name',
        'ulb_id',
        'user_id',
        'lock_status',
    ];

    private $_cashKey = "SHOP_RENT_AREA_LIST";

    public function cashingData(){
        $areaList = self::where("lock_status",false)->get();
        Redis::set($this->_cashKey,$areaList);  
        return json_encode($areaList);
    }

    public function getAreaList(){
        $areaList  = json_decode(Redis::get($this->_cashKey));
        if(!$areaList){
            $areaList = json_decode($this->cashingData());            
        }
        return collect($areaList);
    }

}
