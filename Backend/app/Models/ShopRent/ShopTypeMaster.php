<?php

namespace App\Models\ShopRent;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Redis;

class ShopTypeMaster extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'shop_type',
        'ulb_id',
        'user_id',
        'lock_status',
    ];

    public function cashingData(){
        $shopTypeList = self::where("lock_status",false)->get();
        Redis::set("SHOP_RENT_SHOP_TYPE_LIST",$shopTypeList);  
        return json_encode($shopTypeList);
    }

    public function getShopTypeList(){
        $shopTypeList  = json_decode(Redis::get("SHOP_RENT_SHOP_TYPE_LIST"));
        if(!$shopTypeList){
            $shopTypeList = json_decode($this->cashingData());            
        }
        return collect($shopTypeList);
    }
}
