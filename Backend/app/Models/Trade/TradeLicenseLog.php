<?php

namespace App\Models\Trade;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TradeLicenseLog extends ActiveTradeLicense
{
    use HasFactory;

    public function getOwners(){
        return $this->hasMany(TradeLicenseOwnerDetailsLog::class,"trade_license_id","id")->where("lock_status",false)->get();
    }
    public function getTradeItems(){
        return $this->hasManyThrough(TradeItemTypeMaster::class ,TradeLicenseNatureOfBusinessLog::class,"trade_license_id","id","id","trade_item_type_id")->where((new TradeLicenseNatureOfBusinessLog())->getTable().".lock_status",false);
    }
}
