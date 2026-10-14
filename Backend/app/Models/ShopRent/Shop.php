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

    public function getAllRent(){
        return $this->hasMany(ShopRent::class,"id","current_rate_id")->where("lock_status",false)->get();
    }

    public function getDemand(){
        return $this->hasMany(ShopDemand::class,"shop_id","id")->where("lock_status",false);
    }

    public function getOwners(){
        return $this->hasMany(ShopOwner::class,"shop_id","id")->where("lock_status",false)->get();
    }

    public function getTrans(){
        return $this->hasMany(ShopTransaction::class,"shop_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","ASC")
            ->orderBy("id","ASC")
            ->get();
    }

    public function getLastTran(){
        return $this->hasMany(ShopTransaction::class,"shop_id","id")
            ->where("lock_status",false)
            ->whereIn("payment_status",[1,2])
            ->orderBy("tran_date","DESC")
            ->orderBy("id","DESC")
            ->first();
    }

    public function getAllDemand(){
        return $this->hasMany(ShopDemand::class,"shop_id","id")->where("lock_status",false);
    }
}
