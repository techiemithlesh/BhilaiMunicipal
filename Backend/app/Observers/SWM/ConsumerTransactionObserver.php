<?php

namespace App\Observers\SWM;

use App\Models\SWM\ConsumerTransaction;
use Carbon\Carbon;

class ConsumerTransactionObserver
{
    /**
     * Handle the ConsumerTransaction "created" event.
     */
    public function created(ConsumerTransaction $consumerTransaction): void
    {
        $now = Carbon::now();
        if(!$consumerTransaction->tran_no){
            $tranNo = "";
            if($consumerTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            elseif($consumerTransaction->user_type=='TC' || $consumerTransaction->user_type== 'TL'){
                $tranNo ='TRAN';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $consumerTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $consumerTransaction->tran_no = $tranNo;
        }
        $consumerTransaction->save();
    }

    /**
     * Handle the ConsumerTransaction "updated" event.
     */
    public function updated(ConsumerTransaction $consumerTransaction): void
    {
        //
    }

    /**
     * Handle the ConsumerTransaction "deleted" event.
     */
    public function deleted(ConsumerTransaction $consumerTransaction): void
    {
        //
    }

    /**
     * Handle the ConsumerTransaction "restored" event.
     */
    public function restored(ConsumerTransaction $consumerTransaction): void
    {
        //
    }

    /**
     * Handle the ConsumerTransaction "force deleted" event.
     */
    public function forceDeleted(ConsumerTransaction $consumerTransaction): void
    {
        //
    }
}
