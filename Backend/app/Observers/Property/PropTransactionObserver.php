<?php

namespace App\Observers\Property;

use App\Models\Property\PropTransaction;
use Carbon\Carbon;

class PropTransactionObserver
{
    /**
     * Handle the PropTransaction "created" event.
     */
    public function created(PropTransaction $propTransaction): void
    {
        $now = Carbon::now();
        if(!$propTransaction->tran_no){
            $tranNo = "";
            if($propTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            elseif($propTransaction->user_type=='TC' || $propTransaction->user_type== 'TL'){
                $tranNo ='TRAN';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $propTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $propTransaction->tran_no = $tranNo;
        }
        $propTransaction->save();
    }

    /**
     * Handle the PropTransaction "updated" event.
     */
    public function updated(PropTransaction $propTransaction): void
    {
        //
    }

    /**
     * Handle the PropTransaction "deleted" event.
     */
    public function deleted(PropTransaction $propTransaction): void
    {
        //
    }

    /**
     * Handle the PropTransaction "restored" event.
     */
    public function restored(PropTransaction $propTransaction): void
    {
        //
    }

    /**
     * Handle the PropTransaction "force deleted" event.
     */
    public function forceDeleted(PropTransaction $propTransaction): void
    {
        //
    }
}
