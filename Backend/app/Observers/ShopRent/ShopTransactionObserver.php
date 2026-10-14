<?php

namespace App\Observers\ShopRent;

use App\Models\ShopRent\ShopTransaction;
use Illuminate\Support\Carbon;

class ShopTransactionObserver
{
    /**
     * Handle the ShopTransaction "created" event.
     */
    public function created(ShopTransaction $shopTransaction): void
    {
        $now = Carbon::now();
        if(!$shopTransaction->tran_no){
            $tranNo = "";
            if($shopTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            elseif($shopTransaction->user_type=='TC' || $shopTransaction->user_type== 'TL'){
                $tranNo ='TRAN';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $shopTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $shopTransaction->tran_no = $tranNo;
        }
        $shopTransaction->save();
    }

    /**
     * Handle the ShopTransaction "updated" event.
     */
    public function updated(ShopTransaction $shopTransaction): void
    {
        //
    }

    /**
     * Handle the ShopTransaction "deleted" event.
     */
    public function deleted(ShopTransaction $shopTransaction): void
    {
        //
    }

    /**
     * Handle the ShopTransaction "restored" event.
     */
    public function restored(ShopTransaction $shopTransaction): void
    {
        //
    }

    /**
     * Handle the ShopTransaction "force deleted" event.
     */
    public function forceDeleted(ShopTransaction $shopTransaction): void
    {
        //
    }
}
