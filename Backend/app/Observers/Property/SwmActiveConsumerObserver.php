<?php

namespace App\Observers\Property;

use App\Models\Property\SwmActiveConsumer;
use Illuminate\Support\Facades\DB;

class SwmActiveConsumerObserver
{
    /**
     * Handle the SwmActiveConsumer "created" event.
     */
    public function created(SwmActiveConsumer $swmActiveConsumer): void
    {
        if (!$swmActiveConsumer->consumer_no && $swmActiveConsumer->getTable() === (new SwmActiveConsumer())->getTable()) {

            $prefix = "SWM";
            $count = 1;
            $countStr = str_pad($count, 3, "0", STR_PAD_LEFT)."";
            $idStr = str_pad($swmActiveConsumer->id, 5, "0", STR_PAD_LEFT);
            $consumer_no = "{$prefix}/{$countStr}/{$idStr}";

            $testSql=$this->makeTestSql($consumer_no);
            while($test = DB::connection($swmActiveConsumer->getConnectionName())->select($testSql)[0]->count){
                $count = $count+$test;
                $countStr = str_pad($count, 3, "0", STR_PAD_LEFT)."";
                $consumer_no = "{$prefix}/{$countStr}/{$idStr}";
                $testSql=$this->makeTestSql($consumer_no);
            };
            // Assign and save application number
            $swmActiveConsumer->consumer_no = $consumer_no;
            $swmActiveConsumer->save();
        }
    }

    /**
     * Handle the SwmActiveConsumer "updated" event.
     */
    public function updated(SwmActiveConsumer $swmActiveConsumer): void
    {
        //
    }

    /**
     * Handle the SwmActiveConsumer "deleted" event.
     */
    public function deleted(SwmActiveConsumer $swmActiveConsumer): void
    {
        //
    }

    /**
     * Handle the SwmActiveConsumer "restored" event.
     */
    public function restored(SwmActiveConsumer $swmActiveConsumer): void
    {
        //
    }

    /**
     * Handle the SwmActiveConsumer "force deleted" event.
     */
    public function forceDeleted(SwmActiveConsumer $swmActiveConsumer): void
    {
        //
    }

    private function makeTestSql($consumer_no){
        return $testSql="SELECT COUNT(id) as count FROM (
                            SELECT id FROM swm_active_consumers WHERE consumer_no = '$consumer_no'
                            UNION ALL
                            SELECT id FROM swm_rejected_consumers WHERE consumer_no = '$consumer_no'
                            UNION ALL
                            SELECT id FROM swm_consumers WHERE consumer_no = '$consumer_no'
                        ) as all_results
        ";
    }
}
