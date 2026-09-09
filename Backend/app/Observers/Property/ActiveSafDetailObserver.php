<?php

namespace App\Observers\Property;

use App\Models\Property\ActiveSafDetail;
use App\Models\Property\WardSafAssessmentTypeCounter;
use Illuminate\Support\Facades\DB;

class ActiveSafDetailObserver
{
    /**
     * Handle the ActiveSafDetail "created" event.
     */
    public function created(ActiveSafDetail $activeSafDetail): void
    {
        if(!$activeSafDetail->saf_no && $activeSafDetail->getTable()==(new ActiveSafDetail())->getTable()){
            $prifix = "SAF";
            if($activeSafDetail->is_gb_saf){
                $prifix = "GBSAF";
                if($activeSafDetail->colony_mstr_id){
                    $prifix = "CSAF";
                }
            }
            $oldWard = $activeSafDetail->getWardOldWardNo();
            $wardNo = $oldWard ? $oldWard->ward_no : "00";            
            $WardCount=WardSafAssessmentTypeCounter::where("ward_mstr_id",$activeSafDetail->ward_mstr_id)->first();
            if(!$WardCount){
                $WardCount = new WardSafAssessmentTypeCounter();
                $WardCount->ward_mstr_id = $activeSafDetail->ward_mstr_id;
                $WardCount->save();
            }
            if ( $activeSafDetail->has_previous_holding_no && !$activeSafDetail->is_owner_changed) {
                $assessmentId = "02";
                $count = $WardCount->re_assessment ;
            } elseif($activeSafDetail->has_previous_holding_no  && $activeSafDetail->is_owner_changed ) {
                $assessmentId = "03";                
                $count = $WardCount->mutation ;
            }
            else{         
                $assessmentId = "01";       
                $count = ($WardCount->new_assessment); 
            }
            $count = $count+1;
            $countStr = str_pad($count, 5, "0", STR_PAD_LEFT)."";
            $saf_no = $prifix."/".$assessmentId."/".str_pad($wardNo, 3, 0, STR_PAD_LEFT)."/".$countStr;
            $testSql=$this->makeTestSql($saf_no);
            while($test = DB::connection($activeSafDetail->getConnectionName())->select($testSql)[0]->count){
                $count = $count+$test;
                $countStr = str_pad($count, 5, "0", STR_PAD_LEFT)."";
                $saf_no = $prifix."/".$assessmentId."/".str_pad($wardNo, 3, 0, STR_PAD_LEFT)."/".$countStr;
                $testSql=$this->makeTestSql($saf_no);
            }
            if ( $assessmentId==2) {
                $WardCount->re_assessment = $count;
            } elseif($assessmentId==3 ) {
                $WardCount->mutation = $count;
            }
            else{                        
                $WardCount->new_assessment = $count;
            }            
            $WardCount->save();
            $activeSafDetail->saf_no = $saf_no;
        }
        $activeSafDetail->save();
    }

    /**
     * Handle the ActiveSafDetail "updated" event.
     */
    public function updated(ActiveSafDetail $activeSafDetail): void
    {
        //
    }

    /**
     * Handle the ActiveSafDetail "deleted" event.
     */
    public function deleted(ActiveSafDetail $activeSafDetail): void
    {
        //
    }

    /**
     * Handle the ActiveSafDetail "restored" event.
     */
    public function restored(ActiveSafDetail $activeSafDetail): void
    {
        //
    }

    /**
     * Handle the ActiveSafDetail "force deleted" event.
     */
    public function forceDeleted(ActiveSafDetail $activeSafDetail): void
    {
        //
    }


    private function makeTestSql($saf_no){
        return $testSql="select count(id)
                      from(
                        (
                        select id 
                        from active_saf_details
                        where saf_no = '$saf_no'
                      )
                      union all(
                        select id from rejected_saf_details
                        where saf_no = '$saf_no'
                      )
                      union all(
                        select id from saf_details
                        where saf_no = '$saf_no'
                      )
                    )";
    }
}
