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
     * When FY is changed, Day and Month remain current, but Year is mapped to the selected FY
     */
    private function resolveDateRanges(Request $request)
    {
        $fyear = $request->fyear ?? getFY();
        list($fyearStart, $fyearEnd) = FyearFromUptoDate($fyear);
        $parts = explode('-', $fyear);
        $fromYear = (int)($parts[0] ?? 2026);
        $uptoYear = (int)($parts[1] ?? 2027);

        // Current real date (day and month)
        $now = Carbon::now();
        $currentMonth = (int) $now->format('m');
        $currentDay = (int) $now->format('d');

        // Target year in the selected FY:
        // April (4) to December (12) -> fromYear
        // January (1) to March (3) -> uptoYear
        $targetYear = ($currentMonth >= 4) ? $fromYear : $uptoYear;

        if ($request->filled('date')) {
            $refCarbon = Carbon::parse($request->date);
        } else {
            $maxDays = Carbon::createFromDate($targetYear, $currentMonth, 1)->endOfMonth()->day;
            $safeDay = min($currentDay, $maxDays);
            $refCarbon = Carbon::createFromDate($targetYear, $currentMonth, $safeDay);
        }

        $today = $refCarbon->format('Y-m-d');
        $weekStart = $refCarbon->copy()->startOfWeek()->format('Y-m-d');
        $weekEnd = $refCarbon->copy()->endOfWeek()->format('Y-m-d');
        $monthStart = $refCarbon->copy()->startOfMonth()->format('Y-m-d');
        $monthEnd = $refCarbon->copy()->endOfMonth()->format('Y-m-d');

        return [
            'fyear' => $fyear,
            'refDate' => $today,
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
            $timeframe = strtolower($request->timeframe ?? 'month');

            $chartData = [];

            if ($timeframe === 'year') {
                $startDate = $d['yearStart'];
                $endDate = $d['yearEnd'];

                $propMap = $this->queryGroupedMonthlyChart($this->_PropTransaction, $startDate, $endDate, 'saf_detail_id');
                $swmMap = $this->queryGroupedMonthlyChart($this->_SwmTransaction, $startDate, $endDate, 'consumer_id');
                $waterMap = $this->queryGroupedMonthlyChart($this->_WaterTransaction, $startDate, $endDate, 'consumer_id');
                $shopMap = $this->queryGroupedMonthlyChart($this->_ShopTransaction, $startDate, $endDate, 'shop_id');
                $tradeMap = $this->queryGroupedMonthlyChart($this->_TradeTransaction, $startDate, $endDate, 'trade_license_id');

                $cur = Carbon::parse($startDate)->startOfMonth();
                $end = Carbon::parse($endDate)->startOfMonth();

                while ($cur->lte($end)) {
                    $key = $cur->format('Y-m');
                    $label = $cur->format('M');

                    $citizens = (int) ($propMap[$key]->citizens ?? 0)
                        + (int) ($swmMap[$key]->citizens ?? 0)
                        + (int) ($waterMap[$key]->citizens ?? 0)
                        + (int) ($shopMap[$key]->citizens ?? 0)
                        + (int) ($tradeMap[$key]->citizens ?? 0);

                    $chartData[] = [
                        'date' => $label,
                        'day' => $label,
                        'property' => (float) ($propMap[$key]->amount ?? 0),
                        'waste' => (float) ($swmMap[$key]->amount ?? 0),
                        'water' => (float) ($waterMap[$key]->amount ?? 0),
                        'lease' => round((float) (($shopMap[$key]->amount ?? 0) * 0.75), 2),
                        'shop' => round((float) (($shopMap[$key]->amount ?? 0) * 0.25), 2),
                        'tower' => 0,
                        'trade' => (float) ($tradeMap[$key]->amount ?? 0),
                        'citizens' => $citizens,
                    ];

                    $cur->addMonth();
                }
            } else {
                $startDate = ($timeframe === 'week') ? $d['weekStart'] : $d['monthStart'];
                $endDate = ($timeframe === 'week') ? $d['weekEnd'] : $d['monthEnd'];

                $propMap = $this->queryGroupedDailyChart($this->_PropTransaction, $startDate, $endDate, 'saf_detail_id');
                $swmMap = $this->queryGroupedDailyChart($this->_SwmTransaction, $startDate, $endDate, 'consumer_id');
                $waterMap = $this->queryGroupedDailyChart($this->_WaterTransaction, $startDate, $endDate, 'consumer_id');
                $shopMap = $this->queryGroupedDailyChart($this->_ShopTransaction, $startDate, $endDate, 'shop_id');
                $tradeMap = $this->queryGroupedDailyChart($this->_TradeTransaction, $startDate, $endDate, 'trade_license_id');

                $cur = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);

                while ($cur->lte($end)) {
                    $dateKey = $cur->format('Y-m-d');
                    $label = ($timeframe === 'week') ? $cur->format('D (d-m)') : $cur->format('d-m-y');

                    $citizens = (int) ($propMap[$dateKey]->citizens ?? 0)
                        + (int) ($swmMap[$dateKey]->citizens ?? 0)
                        + (int) ($waterMap[$dateKey]->citizens ?? 0)
                        + (int) ($shopMap[$dateKey]->citizens ?? 0)
                        + (int) ($tradeMap[$dateKey]->citizens ?? 0);

                    $chartData[] = [
                        'date' => $label,
                        'day' => $label,
                        'property' => (float) ($propMap[$dateKey]->amount ?? 0),
                        'waste' => (float) ($swmMap[$dateKey]->amount ?? 0),
                        'water' => (float) ($waterMap[$dateKey]->amount ?? 0),
                        'lease' => round((float) (($shopMap[$dateKey]->amount ?? 0) * 0.75), 2),
                        'shop' => round((float) (($shopMap[$dateKey]->amount ?? 0) * 0.25), 2),
                        'tower' => 0,
                        'trade' => (float) ($tradeMap[$dateKey]->amount ?? 0),
                        'citizens' => $citizens,
                    ];

                    $cur->addDay();
                }
            }

            return responseMsg(true, "All Modules Chart Fetched", [
                'fyear' => $d['fyear'],
                'timeframe' => $timeframe,
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
            $timeframe = strtolower($request->timeframe ?? 'month');
            $chartData = [];

            if ($timeframe === 'year') {
                $monthlyMap = $this->queryGroupedMonthlyChart($model, $d['yearStart'], $d['yearEnd'], $citizenCol);
                $cur = Carbon::parse($d['yearStart'])->startOfMonth();
                $end = Carbon::parse($d['yearEnd'])->startOfMonth();

                while ($cur->lte($end)) {
                    $key = $cur->format('Y-m');
                    $rec = $monthlyMap[$key] ?? null;

                    $chartData[] = [
                        'date' => $cur->format('M'),
                        'amount' => (float) ($rec->amount ?? 0),
                        'citizens' => (int) ($rec->citizens ?? 0),
                    ];

                    $cur->addMonth();
                }
            } else {
                $startDate = ($timeframe === 'week') ? $d['weekStart'] : $d['monthStart'];
                $endDate = ($timeframe === 'week') ? $d['weekEnd'] : $d['monthEnd'];
                $dailyMap = $this->queryGroupedDailyChart($model, $startDate, $endDate, $citizenCol);
                $cur = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);

                while ($cur->lte($end)) {
                    $dateKey = $cur->format('Y-m-d');
                    $dateLabel = ($timeframe === 'week') ? $cur->format('D (d-m)') : $cur->format('d-m-y');
                    $rec = $dailyMap[$dateKey] ?? null;

                    $chartData[] = [
                        'date' => $dateLabel,
                        'amount' => (float) ($rec->amount ?? 0),
                        'citizens' => (int) ($rec->citizens ?? 0),
                    ];

                    $cur->addDay();
                }
            }

            return responseMsg(true, "Module Overview Fetched", [
                'module' => $module,
                'fyear' => $d['fyear'],
                'timeframe' => $timeframe,
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

    /**
     * Helper: Fast grouped monthly chart query (for Year view)
     */
    private function queryGroupedMonthlyChart($model, $startDate, $endDate, $citizenCol = 'id', $amountCol = 'payable_amt')
    {
        try {
            return $model->select(
                DB::raw("TO_CHAR(tran_date::date, 'YYYY-MM') as t_month"),
                DB::raw("COALESCE(SUM({$amountCol}), 0) as amount"),
                DB::raw("COUNT(DISTINCT {$citizenCol}) as citizens")
            )
            ->where('lock_status', false)
            ->whereIn('payment_status', [1, 2])
            ->whereBetween('tran_date', [$startDate, $endDate])
            ->groupBy(DB::raw("TO_CHAR(tran_date::date, 'YYYY-MM')"))
            ->orderBy(DB::raw("TO_CHAR(tran_date::date, 'YYYY-MM')"), 'ASC')
            ->get()
            ->keyBy('t_month');
        } catch (Exception $e) {
            return collect([]);
        }
    }
}
