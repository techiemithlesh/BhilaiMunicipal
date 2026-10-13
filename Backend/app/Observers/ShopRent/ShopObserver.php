<?php

namespace App\Observers\ShopRent;

use App\Models\DBSystem\UlbMaster;
use App\Models\ShopRent\Shop;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ShopObserver
{
    /**
     * Handle the Shop "created" event.
     */
    public function created(Shop $shop): void
    {
        if(!$shop->consumer_no){
            $prifix = (UlbMaster::find($shop->ulb_id)->short_name ??"SOP")."S";
            $oldWard = $shop->getWardNo();
            $wardNo = $oldWard ? $oldWard->ward_no : "00";            
            $count=Shop::where("apply_date",$shop->apply_date)->count();            
            $count = $count+1;
            $countStr = str_pad($count, 4, "0", STR_PAD_LEFT);
            $applyDateYear = Carbon::parse($shop->apply_date)->format("y");
            $year = str_pad($applyDateYear, 2, "0", STR_PAD_LEFT);
            $wardNo = str_pad($wardNo, 2, "0", STR_PAD_LEFT);
            $counsumerNo = $prifix.$wardNo.$year.$countStr;
            $testSql=$this->makeTestSql($counsumerNo);
            while($test = DB::connection($shop->getConnectionName())->select($testSql)[0]->count){
                $count = $count+$test;
                $countStr = str_pad($count, 4, "0", STR_PAD_LEFT)."";
                $counsumerNo = $prifix.$wardNo.$year.$countStr;
                $testSql=$this->makeTestSql($counsumerNo);
            }            
            $shop->consumer_no = $counsumerNo;
        }
        $shop->save();
    }

    /**
     * Handle the Shop "updated" event.
     */
    public function updated(Shop $shop): void
    {
        //
    }

    /**
     * Handle the Shop "deleted" event.
     */
    public function deleted(Shop $shop): void
    {
        //
    }

    /**
     * Handle the Shop "restored" event.
     */
    public function restored(Shop $shop): void
    {
        //
    }

    /**
     * Handle the Shop "force deleted" event.
     */
    public function forceDeleted(Shop $shop): void
    {
        //
    }

    private function makeTestSql($counsumerNo){
        return $testSql="select count(id)
                        from shops
                        where consumer_no = '$counsumerNo'";
    }
}
