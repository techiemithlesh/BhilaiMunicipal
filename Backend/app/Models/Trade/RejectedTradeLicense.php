<?php

namespace App\Models\Trade;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RejectedTradeLicense extends ActiveTradeLicense
{
    use HasFactory;

    public function getOwners(){
        return $this->hasMany(RejectedTradeLicenseOwnerDetail::class,"trade_license_id","id")->where("lock_status",false)->get();
    }
    public function getTradeItems(){
        return $this->hasManyThrough(TradeItemTypeMaster::class ,RejectedTradeLicenseNatureOfBusiness::class,"trade_license_id","id","id","trade_item_type_id")->where((new RejectedTradeLicenseNatureOfBusiness())->getTable().".lock_status",false);
    }
}
