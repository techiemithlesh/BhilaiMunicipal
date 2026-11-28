<?php

namespace App\Observers\Lease;

use App\Models\Lease\Lease;
use App\Models\Lease\LeaseRent;

class LeaseRentObserver
{
    /**
     * Handle the LeaseRent "created" event.
     */
    public function created(LeaseRent $leaseRent): void
    {
        $lease = Lease::find($leaseRent->lease_id);
        if($lease->current_rate_id != $leaseRent->id){         
            $lease->current_rate_id = $leaseRent->id;
            $lease->lease_date = $leaseRent->lease_date;
            $lease->lease_end_date = $leaseRent->lease_end_date;
        }
        $lease->save();
    }

    /**
     * Handle the LeaseRent "updated" event.
     */
    public function updated(LeaseRent $leaseRent): void
    {
        //
    }

    /**
     * Handle the LeaseRent "deleted" event.
     */
    public function deleted(LeaseRent $leaseRent): void
    {
        //
    }

    /**
     * Handle the LeaseRent "restored" event.
     */
    public function restored(LeaseRent $leaseRent): void
    {
        //
    }

    /**
     * Handle the LeaseRent "force deleted" event.
     */
    public function forceDeleted(LeaseRent $leaseRent): void
    {
        //
    }
}
