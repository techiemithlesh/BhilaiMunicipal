<?php

namespace App\Observers\Property;

use App\Models\Property\PropTransaction;
use App\Models\Property\SwmConsumerTransaction;
use Carbon\Carbon;

class SwmConsumerTransactionObserver
{
    /**
     * Handle the SwmConsumerTransaction "created" event.
     */
    public function created(SwmConsumerTransaction $swmConsumerTransaction): void
    {
        $now = Carbon::now();
        if(!$swmConsumerTransaction->tran_no && $swmConsumerTransaction->prop_transaction_id){
            $tranNo = PropTransaction::find($swmConsumerTransaction->prop_transaction_id)->tran_no;
            $counter = SwmConsumerTransaction::where("prop_transaction_id",$swmConsumerTransaction->prop_transaction_id)->count();
            $swmConsumerTransaction->tran_no = $tranNo."/".$counter;
            
        }elseif(!$swmConsumerTransaction->tran_no){
            $tranNo = "";
            if($swmConsumerTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            elseif($swmConsumerTransaction->user_type=='TC' || $swmConsumerTransaction->user_type== 'TL'){
                $tranNo ='TRAN';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $swmConsumerTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $swmConsumerTransaction->tran_no = $tranNo;
        }
        $swmConsumerTransaction->save();
    }

    /**
     * Handle the SwmConsumerTransaction "updated" event.
     */
    public function updated(SwmConsumerTransaction $swmConsumerTransaction): void
    {
        //
    }

    /**
     * Handle the SwmConsumerTransaction "deleted" event.
     */
    public function deleted(SwmConsumerTransaction $swmConsumerTransaction): void
    {
        //
    }

    /**
     * Handle the SwmConsumerTransaction "restored" event.
     */
    public function restored(SwmConsumerTransaction $swmConsumerTransaction): void
    {
        //
    }

    /**
     * Handle the SwmConsumerTransaction "force deleted" event.
     */
    public function forceDeleted(SwmConsumerTransaction $swmConsumerTransaction): void
    {
        //
    }
}
