<?php

namespace App\Models\ShopRent;

use App\Models\DBSystem\UlbWardMaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends ParamModel
{
    use HasFactory;

    protected $fillable = [
        'ulb_id',
        'ward_mstr_id',
        'consumer_no',
        'shop_no',
        'reg_no',
        'holding_no',
        'property_detail_id',
        'yojna_id',
        'samiti_id',
        'shop_type_id',
        'area_id',
        'premium_amt',
        'address',
        'pin_code',
        'allotment_date',
        'apply_date',
        'current_rate_id',
        'citizen_id',
        'user_id',
        'lock_status',
    ];

    public function getWardNo(){
        return $this->belongsTo(UlbWardMaster::class,"ward_mstr_id","id")->first();
    }

    public function getCurrentRent(){
        return $this->hasOne(ShopRent::class,"id","current_rate_id")->where("lock_status",false);
    }

    public function getDemand(){
        return $this->hasMany(ShopDemand::class,"shop_id","id")->where("lock_status",false);
    }
}
