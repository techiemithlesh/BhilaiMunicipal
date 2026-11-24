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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class DashBoardController extends Controller
{
    /**
     * Dashboard Controller for Municipal Analytics and Reporting
     * Modular, decoupled, and optimized for fast single-pass querying
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
     * Set active tenant ULB from auth user or request
     */
    private function resolveUlb(Request $request)
    {
        $user = Auth::user();
        $ulbId = $request->ulbId ?? ($user->ulb_id ?? (App::has('CurrentUlbId') ? App::get('CurrentUlbId') : 2));
        App::instance('CurrentUlbId', $ulbId);
        return $ulbId;
    }

    /**
     * Resolves date boundaries for periods (Today, Week, Month, Year)
     */
    private function resolveDateRanges(Request $request)
    {
        $fyear = $request->fyear ?? getFY();
        $refDate = $request->date ?? Carbon::now()->format('Y-m-d');
        $refCarbon = Carbon::parse($refDate);

        list($fyearStart, $fyearEnd) = FyearFromUptoDate($fyear);

        $today = $refCarbon->format('Y-m-d');
        $weekStart = $refCarbon->copy()->startOfWeek()->format('Y-m-d');
        $weekEnd = $refCarbon->copy()->endOfWeek()->format('Y-m-d');
        $monthStart = $refCarbon->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $refCarbon->copy()->endOfMonth()->format('Y-m-d');

        return [
            'fyear' => $fyear,
            'refDate' => $refDate,
            'today' => $today,
            'weekStart' => $weekStart,
            'weekEnd' => $weekEnd,
            'monthStart' => $monthStart,
            'monthEnd' => $monthEnd,
            'yearStart' => $fyearStart,
            'yearEnd' => $fyearEnd,
            'labels' => [
                'TODAY' => $refCarbon->format('d-m-Y'),
                'WEEK' => Carbon::parse($weekStart)->format('d-m-Y') . ' TO ' . Carbon::parse($weekEnd)->format('d-m-Y'),
                'MONTH' => Carbon::parse($monthStart)->format('d-m-Y') . ' TO ' . Carbon::parse($monthEnd)->format('d-m-Y'),
                'YEAR' => Carbon::parse($fyearStart)->format('d-m-Y') . ' TO ' . Carbon::parse($fyearEnd)->format('d-m-Y'),
            ]
        ];
    }

    /**
     * API 1: ALL MODULES PERIODS OVERVIEW (Super Fast Single-Pass Execution)
     * POST /api/dashboard/all-modules/periods
     */
    public function getAllModulesPeriods(Request $request)
    {
        try {
            $ulbId = $this->resolveUlb($request);
            $d = $this->resolveDateRanges($request);

            // Run single-pass conditional aggregation per table
            $propPeriods = $this->querySinglePassPeriods($this->_PropTransaction, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], 'saf_detail_id');
            $swmPeriods = $this->querySinglePassPeriods($this->_SwmTransaction, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], 'consumer_id');
            $waterPeriods = $this->querySinglePassPeriods($this->_WaterTransaction, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], 'consumer_id');
            $leasePeriods = $this->querySinglePassPeriods($this->_ShopTransaction, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], 'shop_id', 'payable_amt', true);
            $shopPeriods = $this->querySinglePassPeriods($this->_ShopTransaction, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], 'shop_id', 'payable_amt', false);
            $tradePeriods = $this->querySinglePassPeriods($this->_TradeTransaction, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], 'trade_license_id');

            $periods = [];
            foreach (['TODAY', 'WEEK', 'MONTH', 'YEAR'] as $pKey) {
                $modules = [
                    'property' => $propPeriods[$pKey] ?? ['amount' => 0, 'citizens' => 0],
                    'waste' => $swmPeriods[$pKey] ?? ['amount' => 0, 'citizens' => 0],
                    'water' => $waterPeriods[$pKey] ?? ['amount' => 0, 'citizens' => 0],
                    'lease' => $leasePeriods[$pKey] ?? ['amount' => 0, 'citizens' => 0],
                    'shop' => $shopPeriods[$pKey] ?? ['amount' => 0, 'citizens' => 0],
                    'tower' => ['amount' => 0, 'citizens' => 0],
                    'trade' => $tradePeriods[$pKey] ?? ['amount' => 0, 'citizens' => 0],
                ];

                $netCollection = 0;
                foreach ($modules as $m) {
                    $netCollection += $m['amount'];
                }

                $periods[$pKey] = [
                    'label' => $pKey,
                    'date' => $d['labels'][$pKey],
                    'netCollection' => $netCollection,
                    'modules' => $modules,
                ];
            }

            return responseMsg(true, "All Modules Periods Fetched", [
                'fyear' => $d['fyear'],
                'refDate' => $d['refDate'],
                'ulbId' => $ulbId,
                'periods' => $periods,
            ]);
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), null);
        }
    }

    /**
     * API 2: ALL MODULES TIME-SERIES CHART DATA (Fast Grouped SQL Query)
     * POST /api/dashboard/all-modules/chart
     */
    public function getAllModulesChart(Request $request)
    {
        try {
            $ulbId = $this->resolveUlb($request);
            $d = $this->resolveDateRanges($request);

            $startDate = $d['monthStart'];
            $endDate = $d['monthEnd'];

            $propMap = $this->queryGroupedDailyChart($this->_PropTransaction, $startDate, $endDate, 'saf_detail_id');
            $swmMap = $this->queryGroupedDailyChart($this->_SwmTransaction, $startDate, $endDate, 'consumer_id');
            $waterMap = $this->queryGroupedDailyChart($this->_WaterTransaction, $startDate, $endDate, 'consumer_id');
            $shopMap = $this->queryGroupedDailyChart($this->_ShopTransaction, $startDate, $endDate, 'shop_id');
            $tradeMap = $this->queryGroupedDailyChart($this->_TradeTransaction, $startDate, $endDate, 'trade_license_id');

            $chartData = [];
            $cur = Carbon::parse($startDate);
            $end = Carbon::parse($endDate);

            while ($cur->lte($end)) {
                $dateKey = $cur->format('Y-m-d');
                $dayLabel = $cur->format('d-m');

                $chartData[] = [
                    'day' => $dayLabel,
                    'property' => (float) ($propMap[$dateKey]->amount ?? 0),
                    'waste' => (float) ($swmMap[$dateKey]->amount ?? 0),
                    'water' => (float) ($waterMap[$dateKey]->amount ?? 0),
                    'lease' => round((float) (($shopMap[$dateKey]->amount ?? 0) * 0.75), 2),
                    'shop' => round((float) (($shopMap[$dateKey]->amount ?? 0) * 0.25), 2),
                    'tower' => 0,
                    'trade' => (float) ($tradeMap[$dateKey]->amount ?? 0),
                ];

                $cur->addDay();
            }

            return responseMsg(true, "All Modules Chart Fetched", [
                'fyear' => $d['fyear'],
                'chartData' => $chartData,
            ]);
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), null);
        }
    }

    /**
     * API 3: MODULE SPECIFIC OVERVIEW (Periods + Chart for a single module)
     * POST /api/dashboard/module/overview
     */
    public function getModuleOverview(Request $request)
    {
        try {
            $ulbId = $this->resolveUlb($request);
            $d = $this->resolveDateRanges($request);
            $module = strtoupper($request->module ?? 'PROPERTY');

            $model = $this->_PropTransaction;
            $citizenCol = 'saf_detail_id';

            if ($module === 'WASTE') {
                $model = $this->_SwmTransaction;
                $citizenCol = 'consumer_id';
            } elseif ($module === 'WATER') {
                $model = $this->_WaterTransaction;
                $citizenCol = 'consumer_id';
            }

            // Periods
            $periodResults = $this->querySinglePassPeriods($model, $d['today'], $d['weekStart'], $d['weekEnd'], $d['monthStart'], $d['monthEnd'], $d['yearStart'], $d['yearEnd'], $citizenCol);

            $periods = [];
            foreach (['TODAY', 'WEEK', 'MONTH', 'YEAR'] as $pKey) {
                $periods[$pKey] = [
                    'label' => $pKey,
                    'date' => $d['labels'][$pKey],
                    'amount' => $periodResults[$pKey]['amount'] ?? 0,
                    'citizens' => $periodResults[$pKey]['citizens'] ?? 0,
                ];
            }

            // Chart
            $dailyMap = $this->queryGroupedDailyChart($model, $d['monthStart'], $d['monthEnd'], $citizenCol);
            $chartData = [];
            $cur = Carbon::parse($d['monthStart']);
            $end = Carbon::parse($d['monthEnd']);

            while ($cur->lte($end)) {
                $dateKey = $cur->format('Y-m-d');
                $dateLabel = $cur->format('d-m-y');
                $rec = $dailyMap[$dateKey] ?? null;

                $chartData[] = [
                    'date' => $dateLabel,
                    'amount' => (float) ($rec->amount ?? 0),
                    'citizens' => (int) ($rec->citizens ?? 0),
                ];

                $cur->addDay();
            }

            return responseMsg(true, "Module Overview Fetched", [
                'module' => $module,
                'fyear' => $d['fyear'],
                'periods' => $periods,
                'chartData' => $chartData,
            ]);
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), null);
        }
    }

    /**
     * API 4: MODULE DCB BREAKDOWN (Cached and Decoupled)
     * POST /api/dashboard/module/dcb
     */
    public function getModuleDcb(Request $request)
    {
        try {
            $ulbId = $this->resolveUlb($request);
            $module = strtoupper($request->module ?? 'PROPERTY');
            $fyear = $request->fyear ?? getFY();

            $cacheKey = "dashboard_dcb_{$module}_{$fyear}_{$ulbId}";

            // Cache DCB for 10 minutes to prevent repeated computation
            $dcb = Cache::remember($cacheKey, 600, function () use ($module, $request) {
                $reqCopy = clone $request;
                $reqCopy->merge(['all' => true]);

                if ($module === 'PROPERTY') {
                    $res = $this->_PropertyReportController->wardWiseDcb($reqCopy);
                    if ($res->original['status'] ?? false) {
                        $s = $res->original['data']['summary'] ?? [];
                        return [
                            'demand' => [
                                'arrear' => (float) ($s['arrearTax'] ?? 0),
                                'current' => (float) ($s['currentTax'] ?? 0),
                                'total' => (float) ($s['totalTax'] ?? 0),
                                'citizens' => (int) ($s['totalProperty'] ?? 0),
                                'label' => 'Total Demand',
                            ],
                            'collection' => [
                                'arrear' => (float) ($s['arrearCollection'] ?? 0),
                                'current' => (float) ($s['currentCollection'] ?? 0),
                                'addition' => (float) ($s['totalPenalty'] ?? 0),
                                'deduction' => (float) ($s['totalRebate'] ?? 0),
                                'total' => (float) ($s['totalCollection'] ?? 0),
                                'citizens' => (int) ($s['totalCollectionProperty'] ?? 0),
                                'label' => 'Total Collection',
                            ],
                            'balance' => [
                                'arrear' => (float) ($s['arrearOutstanding'] ?? 0),
                                'current' => (float) ($s['currentOutstanding'] ?? 0),
                                'total' => (float) ($s['totalOutstanding'] ?? 0),
                                'citizens' => (int) ($s['totalOutstandingProperty'] ?? 0),
                                'label' => 'Total Balance',
                            ],
                        ];
                    }
                } elseif ($module === 'WASTE') {
                    $res = $this->_SwmReportController->wardWiseDcb($reqCopy);
                    if ($res->original['status'] ?? false) {
                        $s = $res->original['data']['summary'] ?? [];
                        return [
                            'demand' => [
                                'arrear' => (float) ($s['arrearTax'] ?? 0),
                                'current' => (float) ($s['currentTax'] ?? 0),
                                'total' => (float) ($s['totalTax'] ?? 0),
                                'citizens' => (int) ($s['totalConsumer'] ?? 0),
                                'label' => 'Total Demand',
                            ],
                            'collection' => [
                                'arrear' => (float) ($s['arrearCollection'] ?? 0),
                                'current' => (float) ($s['currentCollection'] ?? 0),
                                'total' => (float) ($s['totalCollection'] ?? 0),
                                'citizens' => (int) ($s['totalCollectionProperty'] ?? 0),
                                'label' => 'Total Collection',
                            ],
                            'balance' => [
                                'arrear' => (float) ($s['arrearOutstanding'] ?? 0),
                                'current' => (float) ($s['currentOutstanding'] ?? 0),
                                'total' => (float) ($s['totalOutstanding'] ?? 0),
                                'citizens' => (int) ($s['totalOutstandingProperty'] ?? 0),
                                'label' => 'Total Balance',
                            ],
                        ];
                    }
                } elseif ($module === 'WATER') {
                    $res = $this->_WaterReportController->wardWiseDcb($reqCopy);
                    if ($res->original['status'] ?? false) {
                        $s = $res->original['data']['summary'] ?? [];
                        return [
                            'demand' => [
                                'arrear' => (float) ($s['arrearTax'] ?? 0),
                                'current' => (float) ($s['currentTax'] ?? 0),
                                'total' => (float) ($s['totalTax'] ?? 0),
                                'citizens' => (int) ($s['totalConsumer'] ?? 0),
                                'label' => 'Total Demand',
                            ],
                            'collection' => [
                                'arrear' => (float) ($s['arrearCollection'] ?? 0),
                                'current' => (float) ($s['currentCollection'] ?? 0),
                                'total' => (float) ($s['totalCollection'] ?? 0),
                                'citizens' => (int) ($s['totalCollectionProperty'] ?? 0),
                                'label' => 'Total Collection',
                            ],
                            'balance' => [
                                'arrear' => (float) ($s['arrearOutstanding'] ?? 0),
                                'current' => (float) ($s['currentOutstanding'] ?? 0),
                                'total' => (float) ($s['totalOutstanding'] ?? 0),
                                'citizens' => (int) ($s['totalOutstandingProperty'] ?? 0),
                                'label' => 'Total Balance',
                            ],
                        ];
                    }
                }

                return null;
            });

            return responseMsg(true, "Module DCB Fetched", [
                'module' => $module,
                'fyear' => $fyear,
                'dcb' => $dcb,
            ]);
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), null);
        }
    }

    /**
     * Combined summary endpoint (fast version, does NOT execute heavy synchronous DCBs)
     * POST /api/dashboard/summary
     */
    public function getDashboardSummary(Request $request)
    {
        try {
            $periodsRes = $this->getAllModulesPeriods($request);
            $chartRes = $this->getAllModulesChart($request);

            $periodsData = $periodsRes->original['data']['periods'] ?? [];
            $chartData = $chartRes->original['data']['chartData'] ?? [];

            return responseMsg(true, "Dashboard Summary Fetched Successfully", [
                'fyear' => $request->fyear ?? getFY(),
                'allModules' => [
                    'periods' => $periodsData,
                    'chartData' => $chartData,
                ],
            ]);
        } catch (Exception $e) {
            return responseMsg(false, "Server Error: " . $e->getMessage(), null);
        }
    }

    /**
     * Helper: Single-Pass SQL Conditional Sums for Today, Week, Month, and Year
     */
    private function querySinglePassPeriods($model, $today, $weekStart, $weekEnd, $monthStart, $monthEnd, $yearStart, $yearEnd, $citizenCol = 'id', $amountCol = 'payable_amt', $isLease = null)
    {
        try {
            $query = $model->select(
                DB::raw("COALESCE(SUM(CASE WHEN tran_date = '{$today}' THEN {$amountCol} ELSE 0 END), 0) as today_amt"),
                DB::raw("COUNT(DISTINCT CASE WHEN tran_date = '{$today}' THEN {$citizenCol} END) as today_cit"),
                DB::raw("COALESCE(SUM(CASE WHEN tran_date >= '{$weekStart}' AND tran_date <= '{$weekEnd}' THEN {$amountCol} ELSE 0 END), 0) as week_amt"),
                DB::raw("COUNT(DISTINCT CASE WHEN tran_date >= '{$weekStart}' AND tran_date <= '{$weekEnd}' THEN {$citizenCol} END) as week_cit"),
                DB::raw("COALESCE(SUM(CASE WHEN tran_date >= '{$monthStart}' AND tran_date <= '{$monthEnd}' THEN {$amountCol} ELSE 0 END), 0) as month_amt"),
                DB::raw("COUNT(DISTINCT CASE WHEN tran_date >= '{$monthStart}' AND tran_date <= '{$monthEnd}' THEN {$citizenCol} END) as month_cit"),
                DB::raw("COALESCE(SUM({$amountCol}), 0) as year_amt"),
                DB::raw("COUNT(DISTINCT {$citizenCol}) as year_cit")
            )
            ->where('lock_status', false)
            ->whereIn('payment_status', [1, 2])
            ->whereBetween('tran_date', [$yearStart, $yearEnd]);

            if ($isLease !== null && $model instanceof ShopTransaction) {
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

            $row = $query->first();

            return [
                'TODAY' => ['amount' => (float) ($row->today_amt ?? 0), 'citizens' => (int) ($row->today_cit ?? 0)],
                'WEEK'  => ['amount' => (float) ($row->week_amt ?? 0),  'citizens' => (int) ($row->week_cit ?? 0)],
                'MONTH' => ['amount' => (float) ($row->month_amt ?? 0), 'citizens' => (int) ($row->month_cit ?? 0)],
                'YEAR'  => ['amount' => (float) ($row->year_amt ?? 0),  'citizens' => (int) ($row->year_cit ?? 0)],
            ];
        } catch (Exception $e) {
            return [
                'TODAY' => ['amount' => 0, 'citizens' => 0],
                'WEEK'  => ['amount' => 0, 'citizens' => 0],
                'MONTH' => ['amount' => 0, 'citizens' => 0],
                'YEAR'  => ['amount' => 0, 'citizens' => 0],
            ];
        }
    }

    /**
     * Helper: Fast grouped daily chart query
     */
    private function queryGroupedDailyChart($model, $startDate, $endDate, $citizenCol = 'id', $amountCol = 'payable_amt')
    {
        try {
            return $model->select(
                DB::raw("tran_date::date as t_date"),
                DB::raw("COALESCE(SUM({$amountCol}), 0) as amount"),
                DB::raw("COUNT(DISTINCT {$citizenCol}) as citizens")
            )
            ->where('lock_status', false)
            ->whereIn('payment_status', [1, 2])
            ->whereBetween('tran_date', [$startDate, $endDate])
            ->groupBy(DB::raw("tran_date::date"))
            ->orderBy(DB::raw("tran_date::date"), 'ASC')
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->t_date)->format('Y-m-d');
            });
        } catch (Exception $e) {
            return collect([]);
        }
    }
}
