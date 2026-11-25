import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import {
  getFyearListApi,
  newDashboardAllPeriodsApi,
  newDashboardAllChartApi,
  newDashboardModuleOverviewApi,
  newDashboardModuleDcbApi,
  newDashboardAuthAllPeriodsApi,
  newDashboardAuthAllChartApi,
  newDashboardAuthModuleOverviewApi,
  newDashboardAuthModuleDcbApi,
} from "../../api/endpoints";
import {
  FaBuilding,
  FaTrashAlt,
  FaWater,
  FaFileContract,
  FaStore,
  FaBroadcastTower,
  FaBriefcase,
  FaUsers,
  FaRupeeSign,
  FaCalendarAlt,
  FaSyncAlt,
  FaChartLine,
  FaChartBar,
  FaTable,
  FaCheckCircle,
  FaClock,
  FaLayerGroup,
  FaArrowUp,
  FaPercent,
  FaFileDownload,
  FaBalanceScale,
  FaReceipt,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import AdminLayout from "../../layout/AdminLayout";
import {
  FINANCIAL_YEARS,
  ALL_MODULES_DATA,
  MODULE_SPECIFIC_DATA,
  MODULE_ITEMS_DEF,
  formatIndianCurrency,
  formatCitizens,
  mergeAllModulesPeriods,
  mergeAllModulesChart,
  mergeSingleModuleOverview,
  mergeSingleModuleDcb,
  calculateDateRangesForFyear,
} from "./newDashboardData";

// Icon resolver for module items
const getModuleIcon = (iconName) => {
  switch (iconName) {
    case "FaBuilding":
      return <FaBuilding className="text-blue-500 text-lg" />;
    case "FaTrashAlt":
      return <FaTrashAlt className="text-emerald-500 text-lg" />;
    case "FaWater":
      return <FaWater className="text-cyan-500 text-lg" />;
    case "FaFileContract":
      return <FaFileContract className="text-purple-500 text-lg" />;
    case "FaStore":
      return <FaStore className="text-amber-500 text-lg" />;
    case "FaBroadcastTower":
      return <FaBroadcastTower className="text-pink-500 text-lg" />;
    case "FaBriefcase":
      return <FaBriefcase className="text-slate-500 text-lg" />;
    default:
      return <FaBuilding className="text-gray-500 text-lg" />;
  }
};

// Custom Tooltip for Area Charts (Property / Waste / Water)
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white text-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 text-xs space-y-1.5 min-w-[170px]">
        <p className="font-semibold text-slate-600 border-b border-slate-100 pb-1 flex items-center gap-1.5">
          <FaCalendarAlt className="text-blue-600" />
          {label}
        </p>
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-slate-500 font-medium">Collection:</span>
          <span className="font-bold text-blue-600 text-sm">
            {formatIndianCurrency(data.collection)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium">Citizens:</span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <FaUsers className="text-slate-400" /> {formatCitizens(data.citizens)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for 7-Line All-Module Graph
const CustomMultiLineTooltip = ({ active, payload, label, focusedModule }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = data.collection || data.total || 0;

    return (
      <div className="bg-white text-slate-800 p-3.5 rounded-xl shadow-2xl border border-slate-200 text-xs min-w-[240px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <FaCalendarAlt className="text-blue-600" /> {label}
          </span>
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
            {focusedModule
              ? `${MODULE_ITEMS_DEF.find((m) => m.key === focusedModule)?.name} Focused`
              : "All 7 Modules"}
          </span>
        </div>

        <div className="space-y-1 pt-0.5">
          {MODULE_ITEMS_DEF.map((mod) => {
            const val = data[mod.key] || 0;
            const isTarget = focusedModule === mod.key;
            const isDimmed = focusedModule && !isTarget;

            return (
              <div
                key={mod.key}
                className={`flex items-center justify-between gap-3 text-xs px-2 py-1 rounded-md transition-colors ${
                  isTarget
                    ? "bg-blue-50/70 font-extrabold text-slate-900 border border-blue-200"
                    : isDimmed
                    ? "opacity-35 text-slate-400"
                    : "text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: mod.color }}
                  />
                  <span className={isTarget ? "font-bold text-slate-900" : "font-medium"}>
                    {mod.name}
                  </span>
                </div>
                <span className={isTarget ? "font-extrabold text-blue-700 text-xs" : "font-semibold"}>
                  {formatIndianCurrency(val)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-xs">
          <span className="text-slate-700">Net Collection:</span>
          <span className="text-blue-700 text-sm">{formatIndianCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function NewDashboard() {
  const [selectedTab, setSelectedTab] = useState("ALL_MODULE");
  const [financialYears, setFinancialYears] = useState(FINANCIAL_YEARS);
  const [selectedYear, setSelectedYear] = useState(FINANCIAL_YEARS[0]);
  const [chartTimeframe, setChartTimeframe] = useState("month"); // 'week' | 'month' | 'year'
  const [chartViewMode, setChartViewMode] = useState("chart"); // 'chart' | 'table'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [focusedModule, setFocusedModule] = useState(null); // null means all normal, 'property' means property bold and others light
  const [allModulesData, setAllModulesData] = useState(ALL_MODULES_DATA);
  const [moduleSpecificData, setModuleSpecificData] = useState(MODULE_SPECIFIC_DATA);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking"); // 'connected' | 'fallback' | 'checking'

  const handleModuleFocus = (key) => {
    setFocusedModule((prev) => (prev === key ? null : key));
  };

  const tabs = [
    { id: "ALL_MODULE", label: "ALL MODULE", icon: <FaLayerGroup /> },
    { id: "PROPERTY", label: "PROPERTY", icon: <FaBuilding /> },
    { id: "WASTE", label: "WASTE", icon: <FaTrashAlt /> },
    { id: "WATER", label: "WATER", icon: <FaWater /> },
  ];

  // 1. Fetch dynamic financial years from server API (getFyearListApi)
  useEffect(() => {
    let isMounted = true;
    const fetchFyears = async () => {
      try {
        const response = await axios.get(getFyearListApi, {
          headers: { Accept: "application/json" },
          // timeout: 5000,
        });
        if (
          response?.data?.status &&
          Array.isArray(response.data.data) &&
          response.data.data.length > 0 &&
          isMounted
        ) {
          const list = response.data.data;
          setFinancialYears(list);
          setSelectedYear((prev) => (list.includes(prev) ? prev : list[0]));
        }
      } catch (err) {
        console.warn("Failed to fetch fyear list from server, using fallback:", err.message);
      }
    };
    fetchFyears();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Computed date boundaries for selected FY (Today date/month mapped into selected FY year)
  const computedDates = useMemo(() => {
    return calculateDateRangesForFyear(selectedYear);
  }, [selectedYear]);

  // Synchronize period date labels immediately when FY changes
  useEffect(() => {
    if (!computedDates) return;

    setAllModulesData((prev) => {
      const newPeriods = { ...prev.periods };
      Object.keys(newPeriods).forEach((k) => {
        if (newPeriods[k] && computedDates.labels[k]) {
          newPeriods[k] = { ...newPeriods[k], dateRange: computedDates.labels[k] };
        }
      });
      return { ...prev, periods: newPeriods };
    });

    setModuleSpecificData((prev) => {
      const next = { ...prev };
      ["PROPERTY", "WASTE", "WATER"].forEach((mod) => {
        if (next[mod]?.periodCards) {
          const p = { ...next[mod].periodCards };
          Object.keys(p).forEach((k) => {
            if (p[k] && computedDates.labels[k]) {
              p[k] = { ...p[k], dateRange: computedDates.labels[k] };
            }
          });
          next[mod] = { ...next[mod], periodCards: p };
        }
      });
      return next;
    });
  }, [computedDates]);

  // 3. Fetch live dashboard data modularly from Laravel backend
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchModularDashboard = async () => {
      setIsFetchingApi(true);
      try {
        const token = getToken();
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const axiosConfig = {
          headers,
          // timeout: 6000,
          signal: abortController.signal,
        };

        const datePayload = {
          fyear: selectedYear,
          date: computedDates.refDate,
        };

        if (selectedTab === "ALL_MODULE") {
          // Parallel fast queries for All Modules (Periods + Chart)
          const periodsUrl = token ? newDashboardAuthAllPeriodsApi : newDashboardAllPeriodsApi;
          const chartUrl = token ? newDashboardAuthAllChartApi : newDashboardAllChartApi;

          const [periodsRes, chartRes] = await Promise.allSettled([
            axios.post(periodsUrl, datePayload, axiosConfig),
            axios.post(chartUrl, { ...datePayload, timeframe: chartTimeframe }, axiosConfig),
          ]);

          if (isMounted) {
            let hasSuccess = false;
            if (periodsRes.status === "fulfilled" && periodsRes.value?.data?.status) {
              const pData = periodsRes.value.data.data?.periods;
              if (pData) {
                setAllModulesData((prev) => mergeAllModulesPeriods(prev, pData));
                hasSuccess = true;
              }
            }
            if (chartRes.status === "fulfilled" && chartRes.value?.data?.status) {
              const cData = chartRes.value.data.data?.chartData;
              if (cData) {
                setAllModulesData((prev) => mergeAllModulesChart(prev, cData, chartTimeframe));
                hasSuccess = true;
              }
            }
            setApiStatus(hasSuccess ? "connected" : "fallback");
          }
        } else {
          // Tab is PROPERTY, WASTE, or WATER
          const overviewUrl = token ? newDashboardAuthModuleOverviewApi : newDashboardModuleOverviewApi;
          const dcbUrl = token ? newDashboardAuthModuleDcbApi : newDashboardModuleDcbApi;

          // Step 1: Immediate fetch for Overview (Periods + Chart)
          const overviewPromise = axios.post(
            overviewUrl,
            { module: selectedTab, ...datePayload, timeframe: chartTimeframe },
            axiosConfig
          );

          // Step 2: Parallel fetch for DCB
          const dcbPromise = axios.post(
            dcbUrl,
            { module: selectedTab, fyear: selectedYear },
            axiosConfig
          );

          const [overviewRes, dcbRes] = await Promise.allSettled([overviewPromise, dcbPromise]);

          if (isMounted) {
            let hasSuccess = false;
            if (overviewRes.status === "fulfilled" && overviewRes.value?.data?.status) {
              const oData = overviewRes.value.data.data;
              if (oData) {
                setModuleSpecificData((prev) =>
                  mergeSingleModuleOverview(prev, selectedTab, oData, chartTimeframe)
                );
                hasSuccess = true;
              }
            }
            if (dcbRes.status === "fulfilled" && dcbRes.value?.data?.status) {
              const dData = dcbRes.value.data.data?.dcb;
              if (dData) {
                setModuleSpecificData((prev) => mergeSingleModuleDcb(prev, selectedTab, dData));
                hasSuccess = true;
              }
            }
            setApiStatus(hasSuccess ? "connected" : "fallback");
          }
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.warn("Live Dashboard API fallback:", err.message);
          if (isMounted) {
            setApiStatus("fallback");
          }
        }
      } finally {
        if (isMounted) {
          setIsFetchingApi(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchModularDashboard();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [selectedYear, selectedTab, chartTimeframe, isRefreshing, computedDates]);

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  // Get active module specific data if tab is PROPERTY, WASTE, or WATER
  const currentModuleData =
    selectedTab !== "ALL_MODULE" ? moduleSpecificData[selectedTab] : null;

  // Active chart dataset
  const activeChartData = useMemo(() => {
    if (selectedTab === "ALL_MODULE") {
      return allModulesData.chart[chartTimeframe] || [];
    }
    if (!currentModuleData) return [];
    return currentModuleData.chart[chartTimeframe] || [];
  }, [selectedTab, currentModuleData, chartTimeframe, allModulesData]);

  // Calculations for chart summary stats
  const chartStats = useMemo(() => {
    if (!activeChartData.length) return { total: 0, max: 0, peakDate: "N/A", citizens: 0 };
    let total = 0;
    let max = 0;
    let peakDate = "N/A";
    let citizens = 0;

    activeChartData.forEach((item) => {
      total += item.collection || 0;
      citizens += item.citizens || 0;
      if (item.collection > max) {
        max = item.collection;
        peakDate = item.date;
      }
    });

    return { total, max, peakDate, citizens };
  }, [activeChartData]);

  // Module comparison chart data for ALL MODULE tab
  const allModuleComparisonData = useMemo(() => {
    const monthItems = allModulesData.periods.MONTH.items;
    return monthItems.map((item) => ({
      name: item.name,
      amount: item.amount,
      citizens: item.citizens,
      color: item.color,
    }));
  }, [allModulesData]);

  return (
    <AdminLayout allowAnonymous={true}>
      <div className="min-h-screen bg-slate-50 text-slate-800 p-3 sm:p-5 lg:p-6 space-y-6">
        {/* --- Top Header & Controls --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Bhilai Municipal Corporation
              </span>
              {apiStatus === "connected" ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Live Server Data
                </span>
              ) : isFetchingApi ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                  <FaSyncAlt className="mr-1.5 animate-spin text-xs" />
                  Syncing Server...
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                  Reference Baseline
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Municipal Revenue Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Department-wise revenue realization, active demand, collections, and citizen payments
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Financial Year Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <span className="text-xs font-medium text-slate-600 px-2 flex items-center gap-1.5">
                <FaCalendarAlt className="text-slate-400" /> FY:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-md border-0 py-1.5 px-3 shadow-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {financialYears.map((fy) => (
                  <option key={fy} value={fy}>
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              title="Refresh Data"
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FaSyncAlt className={`${isRefreshing || isFetchingApi ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span className={isActive ? "text-white" : "text-slate-400"}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ALL MODULE VIEW                                                   */}
        {/* ========================================================================= */}
        {selectedTab === "ALL_MODULE" && (
          <div className="space-y-6">
            {/* Top 4 Period Summary Cards for All Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Today Card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    TODAY
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {allModulesData.periods.TODAY.dateRange}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatIndianCurrency(allModulesData.periods.TODAY.netCollection)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                    <FaUsers className="text-slate-400" />
                    <span>{formatCitizens(allModulesData.periods.TODAY.totalCitizens)} Citizens Paid</span>
                  </div>
                </div>
              </div>

              {/* Week Card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    WEEK
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {allModulesData.periods.WEEK.dateRange}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatIndianCurrency(allModulesData.periods.WEEK.netCollection)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                    <FaUsers className="text-slate-400" />
                    <span>{formatCitizens(allModulesData.periods.WEEK.totalCitizens)} Citizens Paid</span>
                  </div>
                </div>
              </div>

              {/* Month Card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-600"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">
                    MONTH
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {allModulesData.periods.MONTH.dateRange}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatIndianCurrency(allModulesData.periods.MONTH.netCollection)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                    <FaUsers className="text-slate-400" />
                    <span>{formatCitizens(allModulesData.periods.MONTH.totalCitizens)} Citizens Paid</span>
                  </div>
                </div>
              </div>

              {/* Year Card */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    YEAR
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {allModulesData.periods.YEAR.dateRange}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-slate-900">
                    {formatIndianCurrency(allModulesData.periods.YEAR.netCollection)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                    <FaUsers className="text-slate-400" />
                    <span>{formatCitizens(allModulesData.periods.YEAR.totalCitizens)} Citizens Paid</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Period Columns Module-Wise Breakdown (as shown in user image 4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Object.entries(allModulesData.periods).map(([periodKey, periodData]) => {
                const badgeColor =
                  periodKey === "TODAY"
                    ? "bg-emerald-500"
                    : periodKey === "WEEK"
                    ? "bg-blue-600"
                    : periodKey === "MONTH"
                    ? "bg-cyan-600"
                    : "bg-amber-500";

                return (
                  <div
                    key={periodKey}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                  >
                    {/* Period Header */}
                    <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-col items-center text-center">
                      <span
                        className={`text-xs font-bold text-white px-3 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}
                      >
                        {periodKey}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-1">
                        {periodData.dateRange}
                      </span>
                    </div>

                    {/* Module Rows */}
                    <div className="divide-y divide-slate-100 flex-1">
                      {periodData.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              {getModuleIcon(item.icon)}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">
                              {item.name}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">
                              {formatIndianCurrency(item.amount)}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                              <FaUsers className="text-[10px]" />
                              <span>{formatCitizens(item.citizens)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Net Collection Footer */}
                    <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        Net Collection
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatIndianCurrency(periodData.netCollection)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ALL MODULE COLLECTION OVERVIEW Graph (7 Distinct Lines) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    ALL MODULE COLLECTION OVERVIEW (7-DEPARTMENT TREND)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comparative multi-line graph of all 7 municipal revenue streams over time
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode (Line Chart vs Bar Chart vs Table) */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setChartViewMode("chart")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        chartViewMode === "chart"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FaChartLine /> Line
                    </button>
                    <button
                      onClick={() => setChartViewMode("bar")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        chartViewMode === "bar"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FaChartBar /> Bar
                    </button>
                    <button
                      onClick={() => setChartViewMode("table")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        chartViewMode === "table"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FaTable /> Table
                    </button>
                  </div>

                  {/* Timeframe Selector (W, M, Y) */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[
                      { key: "week", label: "W", fullLabel: "Week" },
                      { key: "month", label: "M", fullLabel: "Month" },
                      { key: "year", label: "Y", fullLabel: "Year" },
                    ].map((tf) => (
                      <button
                        key={tf.key}
                        onClick={() => setChartTimeframe(tf.key)}
                        title={`View ${tf.fullLabel}`}
                        className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                          chartTimeframe === tf.key
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Module Highlight Selector */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Highlight Module:
                </span>

                {/* Show All / Reset button */}
                <button
                  onClick={() => setFocusedModule(null)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    focusedModule === null
                      ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  All (Normal)
                </button>

                {MODULE_ITEMS_DEF.map((mod) => {
                  const isFocused = focusedModule === mod.key;
                  const isDimmed = focusedModule !== null && !isFocused;

                  return (
                    <button
                      key={mod.key}
                      onClick={() => handleModuleFocus(mod.key)}
                      title={
                        isFocused
                          ? `Click to unhighlight ${mod.name}`
                          : `Click to highlight ${mod.name} (make bold, dim others)`
                      }
                      style={
                        isFocused
                          ? {
                              borderColor: mod.color,
                              boxShadow: `0 0 0 1px ${mod.color}`,
                            }
                          : {}
                      }
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isFocused
                          ? "bg-white text-slate-900 font-extrabold shadow-sm scale-105"
                          : isDimmed
                          ? "bg-slate-100/60 text-slate-400 border-slate-200 opacity-60 hover:opacity-100 hover:bg-white"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                        style={{
                          backgroundColor: mod.color,
                          transform: isFocused ? "scale(1.25)" : "scale(1)",
                        }}
                      />
                      <span>{mod.name}</span>
                      {/* {isFocused && (
                        <span
                          className="text-[10px] px-1 rounded font-bold text-white ml-0.5"
                          style={{ backgroundColor: mod.color }}
                        >
                          BOLD
                        </span>
                      )} */}
                    </button>
                  );
                })}
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/40 p-3 rounded-lg border border-blue-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total Net Collection:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatIndianCurrency(chartStats.total)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Peak Day Collection:</span>
                  <span className="font-bold text-blue-700 text-sm">
                    {formatIndianCurrency(chartStats.max)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Peak Date:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {chartStats.peakDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Active Paying Citizens:</span>
                  <span className="font-bold text-blue-700 text-sm flex items-center gap-1">
                    <FaUsers /> {formatCitizens(chartStats.citizens)}
                  </span>
                </div>
              </div>

              {/* Chart View (7 Lines with Dynamic Bold & Dim Focus) */}
              {activeChartData.length === 0 && chartViewMode !== "table" ? (
                <div className="h-80 w-full flex flex-col items-center justify-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200 text-slate-500 text-sm gap-2">
                  {isFetchingApi ? (
                    <>
                      <FaSyncAlt className="animate-spin text-blue-600 text-xl" />
                      <span>Loading chart data from server...</span>
                    </>
                  ) : (
                    <>
                      <FaChartLine className="text-slate-300 text-2xl" />
                      <span>No chart data available for this period</span>
                    </>
                  )}
                </div>
              ) : chartViewMode === "chart" ? (
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height={310} minWidth={0}>
                    <LineChart
                      data={activeChartData}
                      margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                        interval={chartTimeframe === "month" ? 1 : 0}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis
                        tickFormatter={(val) => {
                          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                          if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
                          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
                          return `₹${val}`;
                        }}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                      />
                      <Tooltip content={<CustomMultiLineTooltip focusedModule={focusedModule} />} />
                      {MODULE_ITEMS_DEF.map((mod) => {
                        const isFocused = focusedModule === mod.key;
                        const hasFocus = focusedModule !== null;
                        const strokeOpacity = !hasFocus ? 1 : isFocused ? 1 : 0.18;
                        const strokeWidth = isFocused ? 4 : hasFocus ? 1.5 : 2.5;
                        const dotRadius = isFocused ? 4.5 : hasFocus ? 1.5 : 2.5;

                        return (
                          <Line
                            key={mod.key}
                            type="monotone"
                            dataKey={mod.key}
                            name={mod.name}
                            stroke={mod.color}
                            strokeWidth={strokeWidth}
                            strokeOpacity={strokeOpacity}
                            dot={{
                              r: dotRadius,
                              fill: mod.color,
                              fillOpacity: strokeOpacity,
                            }}
                            activeDot={{
                              r: isFocused ? 8 : 6,
                              fill: mod.color,
                              stroke: "#FFFFFF",
                              strokeWidth: 2,
                            }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : chartViewMode === "bar" ? (
                /* Bar Chart View (7-Department Clustered Bars) */
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height={310} minWidth={0}>
                    <BarChart
                      data={activeChartData}
                      margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                        interval={chartTimeframe === "month" ? 1 : 0}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis
                        tickFormatter={(val) => {
                          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                          if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
                          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
                          return `₹${val}`;
                        }}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                      />
                      <Tooltip
                        content={<CustomMultiLineTooltip focusedModule={focusedModule} />}
                        cursor={{ fill: "#F1F5F9" }}
                      />
                      {MODULE_ITEMS_DEF.map((mod) => {
                        const isFocused = focusedModule === mod.key;
                        const hasFocus = focusedModule !== null;
                        const fillOpacity = !hasFocus ? 1 : isFocused ? 1 : 0.2;

                        return (
                          <Bar
                            key={mod.key}
                            dataKey={mod.key}
                            name={mod.name}
                            fill={mod.color}
                            fillOpacity={fillOpacity}
                            radius={[3, 3, 0, 0]}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Table View (All 7 modules + Total with focus highlight) */
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        {MODULE_ITEMS_DEF.map((mod) => {
                          const isFocused = focusedModule === mod.key;
                          return (
                            <th
                              key={mod.key}
                              className={`py-2.5 px-3 ${
                                isFocused
                                  ? "bg-blue-100 text-slate-900 font-bold"
                                  : "text-slate-700"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: mod.color }}
                                />
                                {mod.name}
                              </span>
                            </th>
                          );
                        })}
                        <th className="py-2.5 px-3 font-bold text-slate-900 bg-slate-200/60">
                          Net Collection
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeChartData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-slate-800">{row.date}</td>
                          {MODULE_ITEMS_DEF.map((mod) => {
                            const isFocused = focusedModule === mod.key;
                            return (
                              <td
                                key={mod.key}
                                className={`py-2 px-3 ${
                                  isFocused
                                    ? "bg-blue-50/70 font-bold text-slate-900"
                                    : "text-slate-700"
                                }`}
                              >
                                {formatIndianCurrency(row[mod.key] || 0)}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 font-bold text-blue-700 bg-blue-50/40">
                            {formatIndianCurrency(row.collection || row.total || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABS 2, 3, 4: MODULE SPECIFIC VIEW (PROPERTY / WASTE / WATER)             */}
        {/* ========================================================================= */}
        {selectedTab !== "ALL_MODULE" && currentModuleData && (
          <div className="space-y-6">
            {/* 4 Period Cards (Today, Week, Month, Year) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(currentModuleData.periodCards).map(([periodKey, card]) => {
                const periodBadge =
                  periodKey === "TODAY"
                    ? { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-500" }
                    : periodKey === "WEEK"
                    ? { bg: "bg-blue-600", text: "text-blue-700", border: "border-blue-600" }
                    : periodKey === "MONTH"
                    ? { bg: "bg-cyan-600", text: "text-cyan-700", border: "border-cyan-600" }
                    : { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-500" };

                return (
                  <div
                    key={periodKey}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${periodBadge.bg}`}></div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold text-white px-2.5 py-0.5 rounded-full ${periodBadge.bg}`}>
                        {card.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {card.dateRange}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="text-2xl font-bold text-slate-900">
                        {formatIndianCurrency(card.amount)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-medium">
                        <FaUsers className="text-slate-400" />
                        <span>{formatCitizens(card.citizens)} Citizens</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3 Metric Cards: Demand, Collection, Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Demand Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaReceipt className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">Demand</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Gross Assessment</span>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-medium text-slate-500">Arrear</div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatIndianCurrency(currentModuleData.demand.arrear)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-medium text-slate-500">Current</div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatIndianCurrency(currentModuleData.demand.current)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <FaUsers className="text-slate-400" />
                      <span>{formatCitizens(currentModuleData.demand.totalCitizens)} Total Demand</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Demand</span>
                      <span className="text-sm sm:text-base font-extrabold text-blue-700">
                        {formatIndianCurrency(currentModuleData.demand.totalDemand)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collection Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">Collection</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {(currentModuleData.demand.totalDemand > 0
                      ? (currentModuleData.collection.totalCollection /
                          currentModuleData.demand.totalDemand) *
                        100
                      : 0
                    ).toFixed(1)}
                    % Realized
                  </span>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-medium text-slate-500">Arrear</div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatIndianCurrency(currentModuleData.collection.arrear)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-medium text-slate-500">Current</div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatIndianCurrency(currentModuleData.collection.current)}
                      </div>
                    </div>
                  </div>

                  {/* Show Addition & Deduction if present (e.g. Property tax) */}
                  {(currentModuleData.collection.addition > 0 ||
                    currentModuleData.collection.deduction > 0) && (
                    <div className="grid grid-cols-2 gap-3 text-xs text-center">
                      <div className="text-slate-500">
                        Addition:{" "}
                        <span className="font-semibold text-emerald-600">
                          {formatIndianCurrency(currentModuleData.collection.addition)}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Deduction:{" "}
                        <span className="font-semibold text-rose-600">
                          {formatIndianCurrency(currentModuleData.collection.deduction)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <FaUsers className="text-slate-400" />
                      <span>{formatCitizens(currentModuleData.collection.totalCitizens)} Paid</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Collection</span>
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700">
                        {formatIndianCurrency(currentModuleData.collection.totalCollection)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaBalanceScale className="text-amber-600" />
                    <span className="text-sm font-bold text-slate-800">Balance</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">Outstanding</span>
                </div>

                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-medium text-slate-500">Arrear</div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatIndianCurrency(currentModuleData.balance.arrear)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-xs font-medium text-slate-500">Current</div>
                      <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatIndianCurrency(currentModuleData.balance.current)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <FaUsers className="text-slate-400" />
                      <span>{formatCitizens(currentModuleData.balance.totalCitizens)} Pending</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Balance</span>
                      <span className="text-sm sm:text-base font-extrabold text-amber-700">
                        {formatIndianCurrency(currentModuleData.balance.totalBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Overview Chart Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                    {selectedTab} COLLECTION OVERVIEW
                  </h3>
                  <p className="text-xs text-slate-500">
                    Day-to-day revenue trend and number of paying citizens
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode (Line Chart vs Bar Chart vs Table) */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setChartViewMode("chart")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        chartViewMode === "chart"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FaChartLine /> Line
                    </button>
                    <button
                      onClick={() => setChartViewMode("bar")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        chartViewMode === "bar"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FaChartBar /> Bar
                    </button>
                    <button
                      onClick={() => setChartViewMode("table")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                        chartViewMode === "table"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <FaTable /> Table
                    </button>
                  </div>

                  {/* Timeframe Selector (W, M, Y) */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {[
                      { key: "week", label: "W", fullLabel: "Week" },
                      { key: "month", label: "M", fullLabel: "Month" },
                      { key: "year", label: "Y", fullLabel: "Year" },
                    ].map((tf) => (
                      <button
                        key={tf.key}
                        onClick={() => setChartTimeframe(tf.key)}
                        title={`View ${tf.fullLabel}`}
                        className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-all cursor-pointer ${
                          chartTimeframe === tf.key
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block">Total In Period:</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatIndianCurrency(chartStats.total)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Peak Collection:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatIndianCurrency(chartStats.max)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Peak Date:</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {chartStats.peakDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Paying Citizens:</span>
                  <span className="font-bold text-blue-600 text-sm flex items-center gap-1">
                    <FaUsers /> {formatCitizens(chartStats.citizens)}
                  </span>
                </div>
              </div>

              {/* Chart View */}
              {activeChartData.length === 0 && chartViewMode !== "table" ? (
                <div className="h-80 w-full flex flex-col items-center justify-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200 text-slate-500 text-sm gap-2">
                  {isFetchingApi ? (
                    <>
                      <FaSyncAlt className="animate-spin text-blue-600 text-xl" />
                      <span>Loading chart data from server...</span>
                    </>
                  ) : (
                    <>
                      <FaChartLine className="text-slate-300 text-2xl" />
                      <span>No chart data available for this period</span>
                    </>
                  )}
                </div>
              ) : chartViewMode === "chart" ? (
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height={310} minWidth={0}>
                    <AreaChart
                      data={activeChartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                        interval={chartTimeframe === "month" ? 1 : 0}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis
                        tickFormatter={(val) => {
                          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                          if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
                          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
                          return `₹${val}`;
                        }}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="collection"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorCollection)"
                        activeDot={{ r: 6, fill: "#1D4ED8", stroke: "#FFFFFF", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : chartViewMode === "bar" ? (
                /* Bar Chart View for Single Module */
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height={310} minWidth={0}>
                    <BarChart
                      data={activeChartData}
                      margin={{ top: 10, right: 15, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                        interval={chartTimeframe === "month" ? 1 : 0}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis
                        tickFormatter={(val) => {
                          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                          if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
                          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
                          return `₹${val}`;
                        }}
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#CBD5E1" }}
                      />
                      <Tooltip content={<CustomChartTooltip />} cursor={{ fill: "#F1F5F9" }} />
                      <Bar
                        dataKey="collection"
                        fill={
                          selectedTab === "WASTE"
                            ? "#059669"
                            : selectedTab === "WATER"
                            ? "#0284C7"
                            : "#2563EB"
                        }
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                /* Table View */
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Collection Amount</th>
                        <th className="py-2.5 px-3">Paying Citizens</th>
                        <th className="py-2.5 px-3">Avg per Citizen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeChartData.map((row, idx) => {
                        const avg =
                          row.citizens > 0 ? Math.round(row.collection / row.citizens) : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 font-medium text-slate-800">{row.date}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {formatIndianCurrency(row.collection)}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {formatCitizens(row.citizens)}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {formatIndianCurrency(avg)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
