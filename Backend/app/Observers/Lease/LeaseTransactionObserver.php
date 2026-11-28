<?php

namespace App\Observers\Lease;

use App\Models\Lease\LeaseTransaction;
use Illuminate\Support\Carbon;

class LeaseTransactionObserver
{
    /**
     * Handle the LeaseTransaction "created" event.
     */
    public function created(LeaseTransaction $leaseTransaction): void
    {
        $now = Carbon::now();
        if(!$leaseTransaction->tran_no){
            $tranNo = "";
            if($leaseTransaction->user_type=='ONLINE'){
                $tranNo = 'OLP';
            }
            else{
                $tranNo ='CNT';
            }
            $tranNo = $tranNo.$now->format("d"). $leaseTransaction->id . $now->format("Y") . $now->format("mm").$now->format("ii");
            $leaseTransaction->tran_no = $tranNo;
        }
        $leaseTransaction->save();
    }

    /**
     * Handle the LeaseTransaction "updated" event.
     */
    public function updated(LeaseTransaction $leaseTransaction): void
    {
        //
    }

    /**
     * Handle the LeaseTransaction "deleted" event.
     */
    public function deleted(LeaseTransaction $leaseTransaction): void
    {
        //
    }

    /**
     * Handle the LeaseTransaction "restored" event.
     */
    public function restored(LeaseTransaction $leaseTransaction): void
    {
        //
    }

    /**
     * Handle the LeaseTransaction "force deleted" event.
     */
    public function forceDeleted(LeaseTransaction $leaseTransaction): void
    {
        //
    }
}
