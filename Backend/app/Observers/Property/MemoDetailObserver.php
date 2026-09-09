<?php

namespace App\Observers\Property;

use App\Models\DBSystem\UlbWardMaster;
use App\Models\Property\MemoDetail;

class MemoDetailObserver
{
    /**
     * Handle the MemoDetail "created" event.
     */
    public function created(MemoDetail $memoDetail): void
    {
        if(!$memoDetail->memo_no){
            $ulbWardMaster = new UlbWardMaster();
            $prifix = $memoDetail->memo_type;
            $WardNo = $memoDetail->getWardNo()->ward_no??"00";
            $fyear = $memoDetail->fyear;
            $serial_no  = $memoDetail->memo_type=="SAM" ? $ulbWardMaster->WardSamCounter($memoDetail->ward_mstr_id)->counter : $ulbWardMaster->WardFamCounter($memoDetail->ward_mstr_id)->counter;
            $memo_no = $prifix."/". $WardNo . '/' . $memoDetail->id . $serial_no . '/' . $fyear;
            while(MemoDetail::where("memo_no",$memo_no)->count("id")>0){
                $serial_no  = $memoDetail->memo_type=="SAM" ? $ulbWardMaster->WardSamCounter($memoDetail->ward_mstr_id)->counter : $ulbWardMaster->WardFamCounter($memoDetail->ward_mstr_id)->counter;
                $memo_no = $prifix."/". $WardNo . '/' . $memoDetail->id . $serial_no . '/' . $fyear;
            }
            $memoDetail->memo_no = $memo_no;
        }
        $memoDetail->save();
    }

    /**
     * Handle the MemoDetail "updated" event.
     */
    public function updated(MemoDetail $memoDetail): void
    {
        //
    }

    /**
     * Handle the MemoDetail "deleted" event.
     */
    public function deleted(MemoDetail $memoDetail): void
    {
        //
    }

    /**
     * Handle the MemoDetail "restored" event.
     */
    public function restored(MemoDetail $memoDetail): void
    {
        //
    }

    /**
     * Handle the MemoDetail "force deleted" event.
     */
    public function forceDeleted(MemoDetail $memoDetail): void
    {
        //
    }
}
