<?php

namespace App\Observers\Water;

use App\Models\Water\WardWaterApplicationTypeCounter;
use App\Models\Water\WaterActiveApplication;
use Illuminate\Support\Facades\DB;

class WaterActiveApplicationObserver
{
    /**
     * Handle the WaterActiveApplication "created" event.
     */
    public function created(WaterActiveApplication $waterActiveApplication): void
    {
        if (!$waterActiveApplication->application_no && $waterActiveApplication->getTable() === (new WaterActiveApplication())->getTable()) {

            $prefix = "APN";
            $oldWard = $waterActiveApplication->getWardOldWardNo();
            $wardNo = $oldWard ? $oldWard->ward_no : "00";

            // Get or create counter row
            $WardCount = WardWaterApplicationTypeCounter::firstOrCreate(
                ['ward_mstr_id' => $waterActiveApplication->ward_mstr_id]
            );

            // Determine application type and current count
            switch ((int) $waterActiveApplication->connection_type_id) {
                case 2:
                    $assessmentId = "02";
                    $count = $WardCount->realization_connection;
                    break;
                default:
                    $assessmentId = "01";
                    $count = $WardCount->new_connection;
                    break;
            }

            $count++;
            $wardStr = str_pad($wardNo, 3, "0", STR_PAD_LEFT);
            $countStr = str_pad($count, 5, "0", STR_PAD_LEFT);
            $saf_no = "{$prefix}/{$assessmentId}/{$wardStr}/{$countStr}";

            // Check for uniqueness across all relevant tables
            do {
                $duplicateCount = DB::connection($waterActiveApplication->getConnectionName())
                    ->selectOne("
                        SELECT COUNT(id) as count FROM (
                            SELECT id FROM water_active_applications WHERE application_no = ?
                            UNION ALL
                            SELECT id FROM water_rejected_applications WHERE application_no = ?
                            UNION ALL
                            SELECT id FROM water_applications WHERE application_no = ?
                        ) as all_results
                    ", [$saf_no, $saf_no, $saf_no])->count;

                if ($duplicateCount > 0) {
                    $count += $duplicateCount;
                    $countStr = str_pad($count, 5, "0", STR_PAD_LEFT);
                    $saf_no = "{$prefix}/{$assessmentId}/{$wardStr}/{$countStr}";
                }
            } while ($duplicateCount > 0);

            // Update counter table
            switch ($assessmentId) {
                case "02":
                    $WardCount->realization_connection = $count;
                    break;
                default:
                    $WardCount->new_connection = $count;
                    break;
            }

            $WardCount->save();

            // Assign and save application number
            $waterActiveApplication->application_no = $saf_no;
            $waterActiveApplication->save();
        }
    }

    /**
     * Handle the WaterActiveApplication "updated" event.
     */
    public function updated(WaterActiveApplication $waterActiveApplication): void
    {
        //
    }

    /**
     * Handle the WaterActiveApplication "deleted" event.
     */
    public function deleted(WaterActiveApplication $waterActiveApplication): void
    {
        //
    }

    /**
     * Handle the WaterActiveApplication "restored" event.
     */
    public function restored(WaterActiveApplication $waterActiveApplication): void
    {
        //
    }

    /**
     * Handle the WaterActiveApplication "force deleted" event.
     */
    public function forceDeleted(WaterActiveApplication $waterActiveApplication): void
    {
        //
    }
}
