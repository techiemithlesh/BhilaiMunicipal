<?php

namespace App\Observers\Property;

use App\Models\Property\PropertyNotice;

class PropertyNoticeObserver
{
    /**
     * Handle the PropertyNotice "created" event.
     */
    public function created(PropertyNotice $propertyNotice): void
    {
        if(!$propertyNotice->memo_no){
            $prifix = "NOTICE";
            $id = $propertyNotice->id;
            $counter = 1;
            $serial_no  = PropertyNotice::where("property_detail_id",$propertyNotice->property_detail_id)
                        ->where("lock_status",false)
                        ->where("is_clear",false)
                        ->where("id","<>",$propertyNotice->id)
                        ->where("notice_type",$propertyNotice->notice_type)
                        ->count()+1;
            $privNoticeId = PropertyNotice::where("property_detail_id",$propertyNotice->property_detail_id)
                        ->where("lock_status",false)
                        ->where("id","<>",$propertyNotice->id)
                        ->where("notice_type",$propertyNotice->notice_type)
                        ->where("serial_no",$serial_no-1)
                        ->orderBy("id","DESC")
                        ->first();
            $notice_no = $prifix."/".str_pad($counter, 5, "0", STR_PAD_LEFT)."-". $id . '/' .$serial_no ;
            while(PropertyNotice::where("notice_no",$notice_no)->count("id")>0){
                $counter+1;
                $notice_no = $prifix."/".str_pad($counter, 5, "0", STR_PAD_LEFT)."-". $id . '/' .$serial_no ;
            }
            $propertyNotice->prev_notice_id = $privNoticeId?->id;
            $propertyNotice->serial_no = $serial_no;
            $propertyNotice->notice_no = $notice_no;
        }
        $propertyNotice->save();
    }

    /**
     * Handle the PropertyNotice "updated" event.
     */
    public function updated(PropertyNotice $propertyNotice): void
    {
        //
    }

    /**
     * Handle the PropertyNotice "deleted" event.
     */
    public function deleted(PropertyNotice $propertyNotice): void
    {
        //
    }

    /**
     * Handle the PropertyNotice "restored" event.
     */
    public function restored(PropertyNotice $propertyNotice): void
    {
        //
    }

    /**
     * Handle the PropertyNotice "force deleted" event.
     */
    public function forceDeleted(PropertyNotice $propertyNotice): void
    {
        //
    }
}
