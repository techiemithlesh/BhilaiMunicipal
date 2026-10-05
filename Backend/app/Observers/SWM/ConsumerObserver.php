<?php

namespace App\Observers\SWM;

use App\Models\DBSystem\UlbMaster;
use App\Models\SWM\Consumer;
use Illuminate\Support\Facades\DB;

class ConsumerObserver
{
    /**
     * Handle the Consumer "created" event.
     */
    public function created(Consumer $consumer): void
    {
        if (!$consumer->consumer_no) {
            $ulbDtl = (new UlbMaster())->find($consumer->ulb_id);
            $prefix = $ulbDtl?->short_name;
            $oldWard = $consumer->getWardOldWardNo();
            $wardNo = $oldWard ? $oldWard->ward_no : "00";

            // Get or create counter row

            $count = $consumer->id;
            $wardStr = str_pad($wardNo, 3, "0", STR_PAD_LEFT);
            $countStr = str_pad($count, 7, "0", STR_PAD_LEFT);
            $consumer_no = "{$prefix}{$wardStr}{$countStr}";

            // Check for uniqueness across all relevant tables
            do {
                $duplicateCount = Consumer::where("consumer_no",$consumer_no)->count();

                if ($duplicateCount > 0) {
                    $count += $duplicateCount;
                    $countStr = str_pad($count, 5, "0", STR_PAD_LEFT);
                    $consumer_no = "{$prefix}{$wardStr}{$countStr}";
                }
            } while ($duplicateCount > 0);

            

            // Assign and save application number
            $consumer->consumer_no = $consumer_no;
            $consumer->save();
        }
    }

    /**
     * Handle the Consumer "updated" event.
     */
    public function updated(Consumer $consumer): void
    {
        //
    }

    /**
     * Handle the Consumer "deleted" event.
     */
    public function deleted(Consumer $consumer): void
    {
        //
    }

    /**
     * Handle the Consumer "restored" event.
     */
    public function restored(Consumer $consumer): void
    {
        //
    }

    /**
     * Handle the Consumer "force deleted" event.
     */
    public function forceDeleted(Consumer $consumer): void
    {
        //
    }
}
