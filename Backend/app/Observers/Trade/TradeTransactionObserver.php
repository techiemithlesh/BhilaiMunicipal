<?php

namespace App\Observers\Trade;

use App\Models\Trade\TradeTransaction;
use Carbon\Carbon;

class TradeTransactionObserver
{
    /**
     * Handle the TradeTransaction "created" event.
     */
    public function created(TradeTransaction $tradeTransaction): void
    {
        $now = Carbon::now();
        if(!$tradeTransaction->tran_no){
            $tranNo = "";
            if($tradeTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            elseif($tradeTransaction->user_type=='TC' || $tradeTransaction->user_type== 'TL'){
                $tranNo ='TRAN';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $tradeTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $tradeTransaction->tran_no = $tranNo;
        }
        $tradeTransaction->save();
    }

    /**
     * Handle the TradeTransaction "updated" event.
     */
    public function updated(TradeTransaction $tradeTransaction): void
    {
        //
    }

    /**
     * Handle the TradeTransaction "deleted" event.
     */
    public function deleted(TradeTransaction $tradeTransaction): void
    {
        //
    }

    /**
     * Handle the TradeTransaction "restored" event.
     */
    public function restored(TradeTransaction $tradeTransaction): void
    {
        //
    }

    /**
     * Handle the TradeTransaction "force deleted" event.
     */
    public function forceDeleted(TradeTransaction $tradeTransaction): void
    {
        //
    }
}
