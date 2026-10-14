<?php

namespace App\Trait\ShopRent;

use App\Models\DBSystem\UlbMaster;
use App\Models\DBSystem\UlbWardMaster;
use App\Models\ShopRent\AreaMaster;
use App\Models\ShopRent\SamitiMaster;
use App\Models\ShopRent\ShopTypeMaster;
use App\Models\ShopRent\YojnaMaster;

trait ShopTrait
{
    //

    public function adjustShopValue($shop){
        if(!$shop){
            return $shop;
        }
        $ulbDtl = UlbMaster::find($shop?->ulb_id);
        $oldWard = UlbWardMaster::find($shop?->ward_mstr_id);
        $yojnaTypeMaster = YojnaMaster::find($shop?->yojna_id);
        $samitiMaster = SamitiMaster::find($shop?->samiti_id);
        $shopTypeMater = ShopTypeMaster::find($shop?->shop_type_id);
        $areaMaster = AreaMaster::find($shop?->area_id);
        
        $shop->ulb_name = $ulbDtl?->ulb_name??"";
        $shop->ward_no = $oldWard->ward_no??"";
        $shop->yojna_name = $yojnaTypeMaster?->yojna_name;
        $shop->samiti_name = $samitiMaster->samiti_name??"";
        $shop->shop_type = $shopTypeMater->shop_type??"";
        $shop->area_name = $areaMaster->area_name??"";
        return $shop;
    }
}
