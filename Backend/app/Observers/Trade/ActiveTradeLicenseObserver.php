<?php

namespace App\Observers\Trade;

use App\Models\Trade\ActiveTradeLicense;
use App\Models\Trade\WardTradeApplicationTypeCounter;
use Illuminate\Support\Facades\DB;

class ActiveTradeLicenseObserver
{
    /**
     * Handle the ActiveTradeLicense "created" event.
     */
    public function created(ActiveTradeLicense $activeTradeLicense): void
    {
        if (!$activeTradeLicense->application_no && $activeTradeLicense->getTable() === (new ActiveTradeLicense())->getTable()) {

            $prefix = "TL";
            $oldWard = $activeTradeLicense->getWardOldWardNo();
            $wardNo = $oldWard ? $oldWard->ward_no : "00";

            // Get or create counter row
            $WardCount = WardTradeApplicationTypeCounter::firstOrCreate(
                ['ward_mstr_id' => $activeTradeLicense->ward_mstr_id]
            );

            // Determine application type and current count
            switch ((int) $activeTradeLicense->application_type_id) {
                case 2:
                    $assessmentId = "02";
                    $count = $WardCount->renewal_license;
                    break;
                case 3:
                    $assessmentId = "03";
                    $count = $WardCount->amendment_license;
                    break;
                case 4:
                    $assessmentId = "04";
                    $count = $WardCount->surrender_license;
                    break;
                default:
                    $assessmentId = "01";
                    $count = $WardCount->new_license;
                    break;
            }

            $count++;
            $wardStr = str_pad($wardNo, 3, "0", STR_PAD_LEFT);
            $countStr = str_pad($count, 5, "0", STR_PAD_LEFT);
            $saf_no = "{$prefix}/{$assessmentId}/{$wardStr}/{$countStr}";

            // Check for uniqueness across all relevant tables
            do {
                $duplicateCount = DB::connection($activeTradeLicense->getConnectionName())
                    ->selectOne("
                        SELECT COUNT(id) as count FROM (
                            SELECT id FROM active_trade_licenses WHERE application_no = ?
                            UNION ALL
                            SELECT id FROM rejected_trade_licenses WHERE application_no = ?
                            UNION ALL
                            SELECT id FROM trade_licenses WHERE application_no = ?
                            UNION ALL
                            SELECT id FROM trade_license_logs WHERE application_no = ?
                        ) as all_results
                    ", [$saf_no, $saf_no, $saf_no, $saf_no])->count;

                if ($duplicateCount > 0) {
                    $count += $duplicateCount;
                    $countStr = str_pad($count, 5, "0", STR_PAD_LEFT);
                    $saf_no = "{$prefix}/{$assessmentId}/{$wardStr}/{$countStr}";
                }
            } while ($duplicateCount > 0);

            // Update counter table
            switch ($assessmentId) {
                case "02":
                    $WardCount->renewal_license = $count;
                    break;
                case "03":
                    $WardCount->amendment_license = $count;
                    break;
                case "04":
                    $WardCount->surrender_license = $count;
                    break;
                default:
                    $WardCount->new_license = $count;
                    break;
            }

            $WardCount->save();

            // Assign and save application number
            $activeTradeLicense->application_no = $saf_no;
            $activeTradeLicense->save();
        }
    }


    /**
     * Handle the ActiveTradeLicense "updated" event.
     */
    public function updated(ActiveTradeLicense $activeTradeLicense): void
    {
        //
    }

    /**
     * Handle the ActiveTradeLicense "deleted" event.
     */
    public function deleted(ActiveTradeLicense $activeTradeLicense): void
    {
        //
    }

    /**
     * Handle the ActiveTradeLicense "restored" event.
     */
    public function restored(ActiveTradeLicense $activeTradeLicense): void
    {
        //
    }

    /**
     * Handle the ActiveTradeLicense "force deleted" event.
     */
    public function forceDeleted(ActiveTradeLicense $activeTradeLicense): void
    {
        //
    }
}
