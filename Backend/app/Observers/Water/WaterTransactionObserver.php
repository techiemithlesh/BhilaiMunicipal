<?php

namespace App\Observers\Water;

use App\Models\Water\WaterTransaction;
use Carbon\Carbon;

class WaterTransactionObserver
{
    /**
     * Handle the WaterTransaction "created" event.
     */
    public function created(WaterTransaction $waterTransaction): void
    {
        $now = Carbon::now();
        if(!$waterTransaction->tran_no){
            $tranNo = "";
            if($waterTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            elseif($waterTransaction->user_type=='TC' || $waterTransaction->user_type== 'TL'){
                $tranNo ='TRAN';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $waterTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $waterTransaction->tran_no = $tranNo;
        }
        $waterTransaction->save();
    }

    /**
     * Handle the WaterTransaction "updated" event.
     */
    public function updated(WaterTransaction $waterTransaction): void
    {
        //
    }

    /**
     * Handle the WaterTransaction "deleted" event.
     */
    public function deleted(WaterTransaction $waterTransaction): void
    {
        //
    }

    /**
     * Handle the WaterTransaction "restored" event.
     */
    public function restored(WaterTransaction $waterTransaction): void
    {
        //
    }

    /**
     * Handle the WaterTransaction "force deleted" event.
     */
    public function forceDeleted(WaterTransaction $waterTransaction): void
    {
        //
    }
}
