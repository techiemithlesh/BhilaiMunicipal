<?php

namespace App\Observers\ShopRent;

use App\Models\ShopRent\Shop;
use App\Models\ShopRent\ShopRent;

class ShopRentObserver
{
    /**
     * Handle the ShopRent "created" event.
     */
    public function created(ShopRent $shopRent): void
    {
        $shop = Shop::find($shopRent->shop_id);
        if($shop->current_rate_id != $shopRent->id){         
            $shop->current_rate_id = $shopRent->id;
        }
        $shop->save();
    }

    /**
     * Handle the ShopRent "updated" event.
     */
    public function updated(ShopRent $shopRent): void
    {
        //
    }

    /**
     * Handle the ShopRent "deleted" event.
     */
    public function deleted(ShopRent $shopRent): void
    {
        //
    }

    /**
     * Handle the ShopRent "restored" event.
     */
    public function restored(ShopRent $shopRent): void
    {
        //
    }

    /**
     * Handle the ShopRent "force deleted" event.
     */
    public function forceDeleted(ShopRent $shopRent): void
    {
        //
    }
}
