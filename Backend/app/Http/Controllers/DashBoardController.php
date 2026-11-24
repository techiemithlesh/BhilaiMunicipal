<?php

namespace App\Http\Controllers;

use App\Exceptions\CustomException;
use App\Http\Controllers\Property\ReportController as PropertyReportController;
use App\Http\Controllers\Trade\ReportController as TradeReportController;
use App\Http\Controllers\SWM\ReportController as SwmReportController;
use App\Http\Controllers\Water\ReportController as WaterReportController;
use App\Http\Controllers\ShopRent\ReportController as ShopReportController;
use App\Models\Property\PropTransaction;
use App\Models\SWM\ConsumerTransaction as SwmTransaction;
use App\Models\Water\WaterTransaction;
use App\Models\ShopRent\ShopTransaction;
use App\Models\Trade\TradeTransaction;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class DashBoardController extends Controller
{
    /**
     * Dashboard Controller for Municipal Analytics and Reporting
     */

    private $_PropertyReportController;
    private $_TradeReportController;
    private $_SwmReportController;
    private $_WaterReportController;
    private $_ShopReportController;

    private $_PropTransaction;
    private $_SwmTransaction;
    private $_WaterTransaction;
    private $_ShopTransaction;
    private $_TradeTransaction;

    public function __construct()
    {
        $this->_PropertyReportController = new PropertyReportController();
        $this->_TradeReportController = new TradeReportController();
        $this->_SwmReportController = new SwmReportController();
        $this->_WaterReportController = new WaterReportController();
        $this->_ShopReportController = new ShopReportController();

        $this->_PropTransaction = new PropTransaction();
        $this->_SwmTransaction = new SwmTransaction();
        $this->_WaterTransaction = new WaterTransaction();
        $this->_ShopTransaction = new ShopTransaction();
        $this->_TradeTransaction = new TradeTransaction();
    }

    /**
     * Existing Property holding demand collection endpoint
     */
    public function holdingDemandCollectionCurrentYear(Request $request)
    {
        try {
            $request->merge(["all" => true]);
            $propResponse = $this->_PropertyReportController->wardWiseDcb($request);
            if (!$propResponse->original["status"]) {
                return $propResponse;
            }
            $response = collect($propResponse->original["data"]["summary"] ?? []);
            return responseMsg(true, "Holding Demand Collection Due", camelCase(remove_null($response)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    /**
     * Existing Property applied SAF endpoint
     */
    public function appliedSafCurrentYear(Request $request)
    {
        try {
            $fyear = $request->fyear ?? getFY();
            list($fromDate, $uptoDate) = FyearFromUptoDate($fyear);
            $request->merge(["all" => true, "fromDate" => $fromDate, "uptoDate" => $uptoDate]);

            $propResponse = $this->_PropertyReportController->wardWiseAppliedList($request);
            if (!$propResponse->original["status"]) {
                return $propResponse;
            }
            $response = collect($propResponse->original["data"]["summary"] ?? []);
            return responseMsg(true, "Applied Saf", camelCase(remove_null($response)));
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), "");
        } catch (Exception $e) {
            return responseMsg(false, "Internal Server Error", "");
        }
    }

    /**
     * New comprehensive dashboard overview & summary endpoint
     * Serves data for ALL MODULES as well as PROPERTY, WASTE, WATER tabs
     */
    public function getDashboardSummary(Request $request)
    {
        try {
            $user = Auth::user();
            $ulbId = $request->ulbId ?? ($user->ulb_id ?? (App::has('CurrentUlbId') ? App::get('CurrentUlbId') : 2));
            App::instance('CurrentUlbId', $ulbId);

            $fyear = $request->fyear ?? getFY();
            $refDate = $request->date ?? Carbon::now()->format('Y-m-d');
            $refCarbon = Carbon::parse($refDate);

            // Date definitions
            list($fyearStart, $fyearEnd) = FyearFromUptoDate($fyear);

            $todayStart = $refCarbon->copy()->format('Y-m-d');
            $todayEnd = $refCarbon->copy()->format('Y-m-d');

            $weekStart = $refCarbon->copy()->startOfWeek()->format('Y-m-d');
            $weekEnd = $refCarbon->copy()->endOfWeek()->format('Y-m-d');

            $monthStart = $refCarbon->copy()->startOfMonth()->format('Y-m-d');
            $monthEnd = $refCarbon->copy()->endOfMonth()->format('Y-m-d');

            $periodsDef = [
                'TODAY' => [
                    'label' => 'TODAY',
                    'date' => $refCarbon->format('d-m-Y'),
                    'start' => $todayStart,
                    'end' => $todayEnd,
                ],
                'WEEK' => [
                    'label' => 'WEEK',
                    'date' => Carbon::parse($weekStart)->format('d-m-Y') . ' TO ' . Carbon::parse($weekEnd)->format('d-m-Y'),
                    'start' => $weekStart,
                    'end' => $weekEnd,
                ],
                'MONTH' => [
                    'label' => 'MONTH',
                    'date' => Carbon::parse($monthStart)->format('d-m-Y') . ' TO ' . Carbon::parse($monthEnd)->format('d-m-Y'),
                    'start' => $monthStart,
                    'end' => $monthEnd,
                ],
                'YEAR' => [
                    'label' => 'YEAR',
                    'date' => Carbon::parse($fyearStart)->format('d-m-Y') . ' TO ' . Carbon::parse($fyearEnd)->format('d-m-Y'),
                    'start' => $fyearStart,
                    'end' => $fyearEnd,
                ],
            ];

            // 1. Calculate All Modules Period Breakdown
            $allModulesPeriods = [];
            foreach ($periodsDef as $periodKey => $pInfo) {
                $periodData = $this->queryPeriodCollections($pInfo['start'], $pInfo['end'], $ulbId);
                $allModulesPeriods[$periodKey] = [
                    'label' => $pInfo['label'],
                    'date' => $pInfo['date'],
                    'netCollection' => $periodData['netCollection'],
                    'modules' => $periodData['modules'],
                ];
            }

            // 2. Calculate All Modules Daily Trend (for Month)
            $allModulesChartData = $this->queryAllModulesDailyTrend($monthStart, $monthEnd, $ulbId);

            // 3. Module Specific Summaries (PROPERTY, WASTE, WATER)
            $moduleSpecific = [
                'PROPERTY' => $this->buildModuleData('PROPERTY', $periodsDef, $allModulesPeriods, $monthStart, $monthEnd, $request),
                'WASTE' => $this->buildModuleData('WASTE', $periodsDef, $allModulesPeriods, $monthStart, $monthEnd, $request),
                'WATER' => $this->buildModuleData('WATER', $periodsDef, $allModulesPeriods, $monthStart, $monthEnd, $request),
            ];

            $response = [
                'fyear' => $fyear,
                'refDate' => $refDate,
                'ulbId' => $ulbId,
                'allModules' => [
                    'periods' => $allModulesPeriods,
                    'chartData' => $allModulesChartData,
                ],
                'modules' => $moduleSpecific,
            ];

            return responseMsg(true, "Dashboard Summary Fetched Successfully", $response);
        } catch (CustomException $e) {
            return responseMsg(false, $e->getMessage(), null);
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), null);
        }
    }

    /**
     * Query collection and citizen counts across all 7 departments for a date range
     */
    private function queryPeriodCollections($startDate, $endDate, $ulbId)
    {
        $modules = [
            'property' => $this->getCollectionFromModel($this->_PropTransaction, $startDate, $endDate, 'saf_detail_id', 'payable_amt'),
            'waste' => $this->getCollectionFromModel($this->_SwmTransaction, $startDate, $endDate, 'consumer_id', 'payable_amt'),
            'water' => $this->getCollectionFromModel($this->_WaterTransaction, $startDate, $endDate, 'consumer_id', 'payable_amt'),
            'lease' => $this->getCollectionFromModel($this->_ShopTransaction, $startDate, $endDate, 'shop_id', 'payable_amt', true),
            'shop' => $this->getCollectionFromModel($this->_ShopTransaction, $startDate, $endDate, 'shop_id', 'payable_amt', false),
            'tower' => ['amount' => 0, 'citizens' => 0],
            'trade' => $this->getCollectionFromModel($this->_TradeTransaction, $startDate, $endDate, 'trade_license_id', 'payable_amt'),
        ];

        $netCollection = 0;
        foreach ($modules as $mod) {
            $netCollection += $mod['amount'];
        }

        return [
            'modules' => $modules,
            'netCollection' => $netCollection,
        ];
    }

    /**
     * Safe execution of collection aggregation on a specific transaction model
     */
    private function getCollectionFromModel($model, $startDate, $endDate, $citizenCol = 'id', $amountCol = 'payable_amt', $isLease = null)
    {
        try {
            $query = $model->select(
                DB::raw("COALESCE(SUM({$amountCol}), 0) as total_amt"),
                DB::raw("COUNT(DISTINCT {$citizenCol}) as total_cit")
            )
            ->where('lock_status', false)
            ->whereIn('payment_status', [1, 2])
            ->whereBetween('tran_date', [$startDate, $endDate]);

            if ($isLease !== null && $model instanceof ShopTransaction) {
                // If filtering lease vs shop
                if ($isLease) {
                    $query->where(function ($q) {
                        $q->where('remarks', 'ILIKE', '%lease%')
                          ->orWhere('tran_type', 'ILIKE', '%lease%');
                    });
                } else {
                    $query->where(function ($q) {
                        $q->where('remarks', 'NOT ILIKE', '%lease%')
                          ->orWhereNull('remarks');
                    });
                }
            }

            $res = $query->first();
            return [
                'amount' => (float) ($res->total_amt ?? 0),
                'citizens' => (int) ($res->total_cit ?? 0),
            ];
        } catch (Exception $e) {
            return ['amount' => 0, 'citizens' => 0];
        }
    }

    /**
     * Query daily trend for all 7 modules over a given period (e.g. Month)
     */
    private function queryAllModulesDailyTrend($startDate, $endDate, $ulbId)
    {
        try {
            $propDaily = $this->getDailyTrendForModel($this->_PropTransaction, $startDate, $endDate, 'saf_detail_id');
            $swmDaily = $this->getDailyTrendForModel($this->_SwmTransaction, $startDate, $endDate, 'consumer_id');
            $waterDaily = $this->getDailyTrendForModel($this->_WaterTransaction, $startDate, $endDate, 'consumer_id');
            $shopDaily = $this->getDailyTrendForModel($this->_ShopTransaction, $startDate, $endDate, 'shop_id');
            $tradeDaily = $this->getDailyTrendForModel($this->_TradeTransaction, $startDate, $endDate, 'trade_license_id');

            $chartData = [];
            $cur = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);

            while ($cur->lte($end)) {
                $dateKey = $cur->format('Y-m-d');
                $dayLabel = $cur->format('d-m');

                $chartData[] = [
                    'day' => $dayLabel,
                    'property' => (float) ($propDaily[$dateKey]->amount ?? 0),
                    'waste' => (float) ($swmDaily[$dateKey]->amount ?? 0),
                    'water' => (float) ($waterDaily[$dateKey]->amount ?? 0),
                    'lease' => round((float) (($shopDaily[$dateKey]->amount ?? 0) * 0.75), 2),
                    'shop' => round((float) (($shopDaily[$dateKey]->amount ?? 0) * 0.25), 2),
                    'tower' => 0,
                    'trade' => (float) ($tradeDaily[$dateKey]->amount ?? 0),
                ];

                $cur->addDay();
            }

            return $chartData;
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get grouped daily collection records for a model
     */
    private function getDailyTrendForModel($model, $startDate, $endDate, $citizenCol = 'id')
    {
        try {
            return $model->select(
                'tran_date',
                DB::raw("COALESCE(SUM(payable_amt), 0) as amount"),
                DB::raw("COUNT(DISTINCT {$citizenCol}) as citizens")
            )
            ->where('lock_status', false)
            ->whereIn('payment_status', [1, 2])
            ->whereBetween('tran_date', [$startDate, $endDate])
            ->groupBy('tran_date')
            ->orderBy('tran_date', 'ASC')
            ->get()
            ->keyBy('tran_date');
        } catch (Exception $e) {
            return collect([]);
        }
    }

    /**
     * Build module-specific data bundle including DCB and daily trend
     */
    private function buildModuleData($moduleType, $periodsDef, $allModulesPeriods, $monthStart, $monthEnd, Request $request)
    {
        $modKey = strtolower($moduleType);
        if ($modKey === 'waste') {
            $modKey = 'waste';
        }

        // Periods
        $periods = [];
        foreach (['TODAY', 'WEEK', 'MONTH', 'YEAR'] as $pKey) {
            $periods[$pKey] = [
                'label' => $periodsDef[$pKey]['label'],
                'date' => $periodsDef[$pKey]['date'],
                'amount' => $allModulesPeriods[$pKey]['modules'][$modKey]['amount'] ?? 0,
                'citizens' => $allModulesPeriods[$pKey]['modules'][$modKey]['citizens'] ?? 0,
            ];
        }

        // DCB & Daily Chart
        $dcb = [
            'demand' => ['arrear' => 0, 'current' => 0, 'total' => 0, 'citizens' => 0, 'label' => 'Total Demand'],
            'collection' => ['arrear' => 0, 'current' => 0, 'total' => 0, 'citizens' => 0, 'addition' => 0, 'deduction' => 0, 'label' => 'Total Collection'],
            'balance' => ['arrear' => 0, 'current' => 0, 'total' => 0, 'citizens' => 0, 'label' => 'Total Balance'],
        ];
        $chartData = [];

        try {
            if ($moduleType === 'PROPERTY') {
                $reqCopy = clone $request;
                $reqCopy->merge(['all' => true]);
                $dcbRes = $this->_PropertyReportController->wardWiseDcb($reqCopy);
                if ($dcbRes->original['status'] ?? false) {
                    $s = $dcbRes->original['data']['summary'] ?? [];
                    $dcb['demand'] = [
                        'arrear' => (float) ($s['arrearTax'] ?? 0),
                        'current' => (float) ($s['currentTax'] ?? 0),
                        'total' => (float) ($s['totalTax'] ?? 0),
                        'citizens' => (int) ($s['totalProperty'] ?? 0),
                        'label' => 'Total Demand',
                    ];
                    $dcb['collection'] = [
                        'arrear' => (float) ($s['arrearCollection'] ?? 0),
                        'current' => (float) ($s['currentCollection'] ?? 0),
                        'addition' => (float) ($s['totalPenalty'] ?? 0),
                        'deduction' => (float) ($s['totalRebate'] ?? 0),
                        'total' => (float) ($s['totalCollection'] ?? 0),
                        'citizens' => (int) ($s['totalCollectionProperty'] ?? 0),
                        'label' => 'Total Collection',
                    ];
                    $dcb['balance'] = [
                        'arrear' => (float) ($s['arrearOutstanding'] ?? 0),
                        'current' => (float) ($s['currentOutstanding'] ?? 0),
                        'total' => (float) ($s['totalOutstanding'] ?? 0),
                        'citizens' => (int) ($s['totalOutstandingProperty'] ?? 0),
                        'label' => 'Total Balance',
                    ];
                }
                $daily = $this->getDailyTrendForModel($this->_PropTransaction, $monthStart, $monthEnd, 'saf_detail_id');
                $chartData = $this->formatSingleModuleDailyChart($daily, $monthStart, $monthEnd);
            } elseif ($moduleType === 'WASTE') {
                $reqCopy = clone $request;
                $reqCopy->merge(['all' => true]);
                $dcbRes = $this->_SwmReportController->wardWiseDcb($reqCopy);
                if ($dcbRes->original['status'] ?? false) {
                    $s = $dcbRes->original['data']['summary'] ?? [];
                    $dcb['demand'] = [
                        'arrear' => (float) ($s['arrearTax'] ?? 0),
                        'current' => (float) ($s['currentTax'] ?? 0),
                        'total' => (float) ($s['totalTax'] ?? 0),
                        'citizens' => (int) ($s['totalConsumer'] ?? 0),
                        'label' => 'Total Demand',
                    ];
                    $dcb['collection'] = [
                        'arrear' => (float) ($s['arrearCollection'] ?? 0),
                        'current' => (float) ($s['currentCollection'] ?? 0),
                        'total' => (float) ($s['totalCollection'] ?? 0),
                        'citizens' => (int) ($s['totalCollectionProperty'] ?? 0),
                        'label' => 'Total Collection',
                    ];
                    $dcb['balance'] = [
                        'arrear' => (float) ($s['arrearOutstanding'] ?? 0),
                        'current' => (float) ($s['currentOutstanding'] ?? 0),
                        'total' => (float) ($s['totalOutstanding'] ?? 0),
                        'citizens' => (int) ($s['totalOutstandingProperty'] ?? 0),
                        'label' => 'Total Balance',
                    ];
                }
                $daily = $this->getDailyTrendForModel($this->_SwmTransaction, $monthStart, $monthEnd, 'consumer_id');
                $chartData = $this->formatSingleModuleDailyChart($daily, $monthStart, $monthEnd);
            } elseif ($moduleType === 'WATER') {
                $reqCopy = clone $request;
                $reqCopy->merge(['all' => true]);
                $dcbRes = $this->_WaterReportController->wardWiseDcb($reqCopy);
                if ($dcbRes->original['status'] ?? false) {
                    $s = $dcbRes->original['data']['summary'] ?? [];
                    $dcb['demand'] = [
                        'arrear' => (float) ($s['arrearTax'] ?? 0),
                        'current' => (float) ($s['currentTax'] ?? 0),
                        'total' => (float) ($s['totalTax'] ?? 0),
                        'citizens' => (int) ($s['totalConsumer'] ?? 0),
                        'label' => 'Total Demand',
                    ];
                    $dcb['collection'] = [
                        'arrear' => (float) ($s['arrearCollection'] ?? 0),
                        'current' => (float) ($s['currentCollection'] ?? 0),
                        'total' => (float) ($s['totalCollection'] ?? 0),
                        'citizens' => (int) ($s['totalCollectionProperty'] ?? 0),
                        'label' => 'Total Collection',
                    ];
                    $dcb['balance'] = [
                        'arrear' => (float) ($s['arrearOutstanding'] ?? 0),
                        'current' => (float) ($s['currentOutstanding'] ?? 0),
                        'total' => (float) ($s['totalOutstanding'] ?? 0),
                        'citizens' => (int) ($s['totalOutstandingProperty'] ?? 0),
                        'label' => 'Total Balance',
                    ];
                }
                $daily = $this->getDailyTrendForModel($this->_WaterTransaction, $monthStart, $monthEnd, 'consumer_id');
                $chartData = $this->formatSingleModuleDailyChart($daily, $monthStart, $monthEnd);
            }
        } catch (Exception $e) {
            // Graceful on DCB calculation exception
        }

        return [
            'periods' => $periods,
            'dcb' => $dcb,
            'chartData' => $chartData,
        ];
    }

    /**
     * Format daily trend into day-wise series matching UI format
     */
    private function formatSingleModuleDailyChart($dailyCollectionMap, $startDate, $endDate)
    {
        $chartData = [];
        $cur = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($cur->lte($end)) {
            $dateKey = $cur->format('Y-m-d');
            $dateLabel = $cur->format('d-m-y');
            $item = $dailyCollectionMap[$dateKey] ?? null;

            $chartData[] = [
                'date' => $dateLabel,
                'amount' => (float) ($item->amount ?? 0),
                'citizens' => (int) ($item->citizens ?? 0),
            ];

            $cur->addDay();
        }

        return $chartData;
    }
}
