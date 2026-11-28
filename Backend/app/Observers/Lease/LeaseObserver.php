<?php

namespace App\Observers\Lease;

use App\Models\DBSystem\UlbMaster;
use App\Models\Lease\Lease;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class LeaseObserver
{
    /**
     * Handle the Lease "created" event.
     */
    public function created(Lease $lease): void
    {
        if(!$lease->lease_no){
            $prifix = (UlbMaster::find($lease->ulb_id)->short_name ??"LES")."S";
            $oldWard = $lease->getWardNo();
            $wardNo = $oldWard ? $oldWard->ward_no : "00";            
            $count=Lease::where("apply_date",$lease->apply_date)->count();            
            $count = $count+1;
            $countStr = str_pad($count, 4, "0", STR_PAD_LEFT);
            $applyDateYear = Carbon::parse($lease->apply_date)->format("y");
            $year = str_pad($applyDateYear, 2, "0", STR_PAD_LEFT);
            $wardNo = str_pad($wardNo, 2, "0", STR_PAD_LEFT);
            $counsumerNo = $prifix.$wardNo.$year.$countStr;
            $testSql=$this->makeTestSql($counsumerNo);
            while($test = DB::connection($lease->getConnectionName())->select($testSql)[0]->count){
                $count = $count+$test;
                $countStr = str_pad($count, 4, "0", STR_PAD_LEFT)."";
                $counsumerNo = $prifix.$wardNo.$year.$countStr;
                $testSql=$this->makeTestSql($counsumerNo);
            }            
            $lease->lease_no = $counsumerNo;
        }
        $lease->save();
    }

    /**
     * Handle the Lease "updated" event.
     */
    public function updated(Lease $lease): void
    {
        //
    }

    /**
     * Handle the Lease "deleted" event.
     */
    public function deleted(Lease $lease): void
    {
        //
    }

    /**
     * Handle the Lease "restored" event.
     */
    public function restored(Lease $lease): void
    {
        //
    }

    /**
     * Handle the Lease "force deleted" event.
     */
    public function forceDeleted(Lease $lease): void
    {
        //
    }

    private function makeTestSql($leaseNo){
        return $testSql="select count(id)
                        from leases
                        where lease_no = '$leaseNo'";
    }
}
