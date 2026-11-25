
export const FINANCIAL_YEARS = ["2026-2027"];

export const MODULE_ITEMS_DEF = [
  { id: "property", key: "property", name: "Property", color: "#2563EB", strokeWidth: 2.5, icon: "FaBuilding", iconColor: "#3B82F6" },
  { id: "waste", key: "waste", name: "Waste", color: "#059669", strokeWidth: 2.5, icon: "FaTrashAlt", iconColor: "#10B981" },
  { id: "water", key: "water", name: "Water", color: "#0284C7", strokeWidth: 2.5, icon: "FaWater", iconColor: "#06B6D4" },
  { id: "lease", key: "lease", name: "Lease", color: "#7C3AED", strokeWidth: 2.5, icon: "FaFileContract", iconColor: "#8B5CF6" },
  { id: "shop", key: "shop", name: "Shop", color: "#D97706", strokeWidth: 2.5, icon: "FaStore", iconColor: "#F59E0B" },
  { id: "tower", key: "tower", name: "Tower", color: "#DB2777", strokeWidth: 2.5, icon: "FaBroadcastTower", iconColor: "#EC4899" },
  { id: "trade", key: "trade", name: "Trade", color: "#475569", strokeWidth: 2.5, icon: "FaBriefcase", iconColor: "#64748B" },
];

// Computes date boundaries for a selected financial year (e.g. 2024-2025)
// Day and month are kept current, but year is mapped into the selected FY
export const calculateDateRangesForFyear = (fyear, customDate = null) => {
  const parts = (fyear || "2026-2027").split("-");
  const fromYear = parseInt(parts[0], 10) || 2026;
  const uptoYear = parseInt(parts[1], 10) || 2027;

  const now = customDate ? new Date(customDate) : new Date();
  const currentMonth = now.getMonth() + 1; // 1 to 12
  const currentDay = now.getDate();

  // Target year in selected FY:
  // April (4) to Dec (12) -> fromYear
  // Jan (1) to Mar (3) -> uptoYear
  const targetYear = currentMonth >= 4 ? fromYear : uptoYear;

  const pad = (n) => String(n).padStart(2, "0");
  const maxDays = new Date(targetYear, currentMonth, 0).getDate();
  const safeDay = Math.min(currentDay, maxDays);

  const refDateStr = `${targetYear}-${pad(currentMonth)}-${pad(safeDay)}`;
  const refDate = new Date(targetYear, currentMonth - 1, safeDay);

  const todayLabel = `${pad(safeDay)}-${pad(currentMonth)}-${targetYear}`;

  // Week calculation (Monday to Sunday)
  const dayOfWeek = refDate.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(refDate);
  mon.setDate(refDate.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const weekLabel = `${pad(mon.getDate())}-${pad(mon.getMonth() + 1)}-${mon.getFullYear()} TO ${pad(sun.getDate())}-${pad(sun.getMonth() + 1)}-${sun.getFullYear()}`;

  // Month calculation (1st to last of current month)
  const monthLabel = `01-${pad(currentMonth)}-${targetYear} TO ${pad(maxDays)}-${pad(currentMonth)}-${targetYear}`;

  // Year calculation (01-04-fromYear to 31-03-uptoYear)
  const yearLabel = `01-04-${fromYear} TO 31-03-${uptoYear}`;

  return {
    refDate: refDateStr,
    labels: {
      TODAY: todayLabel,
      WEEK: weekLabel,
      MONTH: monthLabel,
      YEAR: yearLabel,
    },
  };
};

const initialDates = calculateDateRangesForFyear(FINANCIAL_YEARS[0]);

const createEmptyModuleItems = () =>
  MODULE_ITEMS_DEF.map((m) => ({
    id: m.id,
    name: m.name,
    amount: 0,
    citizens: 0,
    icon: m.icon,
    color: m.iconColor,
  }));

export const ALL_MODULES_DATA = {
  periods: {
    TODAY: {
      dateRange: initialDates.labels.TODAY,
      netCollection: 0,
      totalCitizens: 0,
      items: createEmptyModuleItems(),
    },
    WEEK: {
      dateRange: initialDates.labels.WEEK,
      netCollection: 0,
      totalCitizens: 0,
      items: createEmptyModuleItems(),
    },
    MONTH: {
      dateRange: initialDates.labels.MONTH,
      netCollection: 0,
      totalCitizens: 0,
      items: createEmptyModuleItems(),
    },
    YEAR: {
      dateRange: initialDates.labels.YEAR,
      netCollection: 0,
      totalCitizens: 0,
      items: createEmptyModuleItems(),
    },
  },
  chart: {
    month: [],
    week: [],
    year: [],
  },
};

const createEmptyModuleSpecific = (title) => ({
  title,
  periodCards: {
    TODAY: { label: "TODAY", dateRange: initialDates.labels.TODAY, amount: 0, citizens: 0 },
    WEEK: { label: "WEEK", dateRange: initialDates.labels.WEEK, amount: 0, citizens: 0 },
    MONTH: { label: "MONTH", dateRange: initialDates.labels.MONTH, amount: 0, citizens: 0 },
    YEAR: { label: "YEAR", dateRange: initialDates.labels.YEAR, amount: 0, citizens: 0 },
  },
  demand: {
    arrear: 0,
    current: 0,
    totalDemand: 0,
    totalCitizens: 0,
  },
  collection: {
    arrear: 0,
    current: 0,
    addition: 0,
    deduction: 0,
    totalCollection: 0,
    totalCitizens: 0,
  },
  balance: {
    arrear: 0,
    current: 0,
    totalBalance: 0,
    totalCitizens: 0,
  },
  chart: {
    month: [],
    week: [],
    year: [],
  },
});

export const MODULE_SPECIFIC_DATA = {
  PROPERTY: createEmptyModuleSpecific("Property Collection"),
  WASTE: createEmptyModuleSpecific("Waste Collection"),
  WATER: createEmptyModuleSpecific("Water Collection"),
};

// Formats a number to Indian currency format (e.g. ₹ 20,35,74,296)
export const formatIndianCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹ 0";
  return "₹ " + Number(amount).toLocaleString("en-IN");
};

// Formats citizen count with commas
export const formatCitizens = (count) => {
  if (count === null || count === undefined || isNaN(count)) return "0";
  return Number(count).toLocaleString("en-IN");
};

// Merges live periods into ALL_MODULES_DATA
export const mergeAllModulesPeriods = (defaultData, apiPeriods) => {
  if (!apiPeriods) return defaultData;
  const newPeriods = { ...(defaultData.periods || {}) };

  Object.keys(apiPeriods).forEach((pKey) => {
    const apiPeriod = apiPeriods[pKey];
    if (!apiPeriod) return;

    const baseItems = defaultData.periods?.[pKey]?.items || createEmptyModuleItems();
    const newItems = baseItems.map((item) => {
      const apiItem = apiPeriod.modules?.[item.id];
      if (!apiItem) return item;
      return {
        ...item,
        amount: apiItem.amount !== undefined ? apiItem.amount : item.amount,
        citizens: apiItem.citizens !== undefined ? apiItem.citizens : item.citizens,
      };
    });

    const totalCitizens = newItems.reduce((acc, curr) => acc + (curr.citizens || 0), 0);

    newPeriods[pKey] = {
      ...(defaultData.periods?.[pKey] || {}),
      dateRange: apiPeriod.date || defaultData.periods?.[pKey]?.dateRange || "",
      netCollection:
        apiPeriod.netCollection !== undefined
          ? apiPeriod.netCollection
          : defaultData.periods?.[pKey]?.netCollection || 0,
      totalCitizens,
      items: newItems,
    };
  });

  return {
    ...defaultData,
    periods: newPeriods,
  };
};

// Merges chart data into ALL_MODULES_DATA for the requested timeframe ('week' | 'month' | 'year')
export const mergeAllModulesChart = (defaultData, apiChartData, timeframe = "month") => {
  if (!Array.isArray(apiChartData)) return defaultData;
  const formatted = apiChartData.map((d) => ({
    ...d,
    date: d.date || d.day || "",
    collection:
      d.collection !== undefined
        ? d.collection
        : (d.property || 0) +
          (d.waste || 0) +
          (d.water || 0) +
          (d.lease || 0) +
          (d.shop || 0) +
          (d.tower || 0) +
          (d.trade || 0),
  }));

  return {
    ...defaultData,
    chart: {
      ...(defaultData.chart || {}),
      [timeframe]: formatted,
    },
  };
};

// Merges overview (periodCards + chart) for a single module
export const mergeSingleModuleOverview = (defaultData, moduleKey, apiOverview, timeframe = "month") => {
  if (!apiOverview || !defaultData?.[moduleKey]) return defaultData;
  const currentMod = defaultData[moduleKey];

  const existingPeriodCards = currentMod.periodCards || {};
  const newPeriodCards = { ...existingPeriodCards };

  if (apiOverview.periods) {
    Object.keys(apiOverview.periods).forEach((pKey) => {
      const p = apiOverview.periods[pKey];
      if (!p) return;
      const baseCard = existingPeriodCards[pKey] || { label: pKey, dateRange: "", amount: 0, citizens: 0 };
      newPeriodCards[pKey] = {
        ...baseCard,
        dateRange: p.date || baseCard.dateRange,
        amount: p.amount !== undefined ? p.amount : baseCard.amount,
        citizens: p.citizens !== undefined ? p.citizens : baseCard.citizens,
      };
    });
  }

  const newChart = { ...(currentMod.chart || {}) };
  if (Array.isArray(apiOverview.chartData)) {
    const tf = apiOverview.timeframe || timeframe;
    newChart[tf] = apiOverview.chartData.map((d) => ({
      date: d.date || "",
      collection: d.amount !== undefined ? d.amount : d.collection || 0,
      citizens: d.citizens !== undefined ? d.citizens : 0,
    }));
  }

  return {
    ...defaultData,
    [moduleKey]: {
      ...currentMod,
      periodCards: newPeriodCards,
      chart: newChart,
    },
  };
};

// Merges DCB for a single module (maps backend { demand, collection, balance } to UI fields)
export const mergeSingleModuleDcb = (defaultData, moduleKey, apiDcb) => {
  if (!apiDcb || !defaultData?.[moduleKey]) return defaultData;
  const currentMod = defaultData[moduleKey];

  const mappedDemand = apiDcb.demand
    ? {
        arrear: apiDcb.demand.arrear ?? 0,
        current: apiDcb.demand.current ?? 0,
        totalDemand: apiDcb.demand.total ?? apiDcb.demand.totalDemand ?? 0,
        totalCitizens: apiDcb.demand.citizens ?? apiDcb.demand.totalCitizens ?? 0,
      }
    : currentMod.demand;

  const mappedCollection = apiDcb.collection
    ? {
        arrear: apiDcb.collection.arrear ?? 0,
        current: apiDcb.collection.current ?? 0,
        addition: apiDcb.collection.addition ?? 0,
        deduction: apiDcb.collection.deduction ?? 0,
        totalCollection: apiDcb.collection.total ?? apiDcb.collection.totalCollection ?? 0,
        totalCitizens: apiDcb.collection.citizens ?? apiDcb.collection.totalCitizens ?? 0,
      }
    : currentMod.collection;

  const mappedBalance = apiDcb.balance
    ? {
        arrear: apiDcb.balance.arrear ?? 0,
        current: apiDcb.balance.current ?? 0,
        totalBalance: apiDcb.balance.total ?? apiDcb.balance.totalBalance ?? 0,
        totalCitizens: apiDcb.balance.citizens ?? apiDcb.balance.totalCitizens ?? 0,
      }
    : currentMod.balance;

  return {
    ...defaultData,
    [moduleKey]: {
      ...currentMod,
      demand: mappedDemand,
      collection: mappedCollection,
      balance: mappedBalance,
    },
  };
};
