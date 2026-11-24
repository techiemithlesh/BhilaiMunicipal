// Dummy data for Municipal Corporation Bhilai - NewDashboard
// Structured clearly so it can easily be replaced by real backend APIs later

export const FINANCIAL_YEARS = ["2026-2027", "2025-2026", "2024-2025"];

export const PERIOD_LABELS = {
  TODAY: { label: "TODAY", dateRange: "21-11-2026" },
  WEEK: { label: "WEEK", dateRange: "16-11-2026 TO 22-11-2026" },
  MONTH: { label: "MONTH", dateRange: "01-11-2026 TO 30-11-2026" },
  YEAR: { label: "YEAR", dateRange: "01-04-2026 TO 31-03-2027" },
};

export const MODULE_ITEMS_DEF = [
  { id: "property", key: "property", name: "Property", color: "#2563EB", strokeWidth: 2.5 },
  { id: "waste", key: "waste", name: "Waste", color: "#059669", strokeWidth: 2.5 },
  { id: "water", key: "water", name: "Water", color: "#0284C7", strokeWidth: 2.5 },
  { id: "lease", key: "lease", name: "Lease", color: "#7C3AED", strokeWidth: 2.5 },
  { id: "shop", key: "shop", name: "Shop", color: "#D97706", strokeWidth: 2.5 },
  { id: "tower", key: "tower", name: "Tower", color: "#DB2777", strokeWidth: 2.5 },
  { id: "trade", key: "trade", name: "Trade", color: "#475569", strokeWidth: 2.5 },
];

export const ALL_MODULES_DATA = {
  periods: {
    TODAY: {
      dateRange: "21-11-2026",
      netCollection: 549120,
      totalCitizens: 128,
      items: [
        { id: "property", name: "Property", amount: 412217, citizens: 61, icon: "FaBuilding", color: "#3B82F6" },
        { id: "waste", name: "Waste", amount: 78640, citizens: 56, icon: "FaTrashAlt", color: "#10B981" },
        { id: "water", name: "Water", amount: 29390, citizens: 9, icon: "FaWater", color: "#06B6D4" },
        { id: "lease", name: "Lease", amount: 28873, citizens: 2, icon: "FaFileContract", color: "#8B5CF6" },
        { id: "shop", name: "Shop", amount: 0, citizens: 0, icon: "FaStore", color: "#F59E0B" },
        { id: "tower", name: "Tower", amount: 0, citizens: 0, icon: "FaBroadcastTower", color: "#EC4899" },
        { id: "trade", name: "Trade", amount: 0, citizens: 0, icon: "FaBriefcase", color: "#64748B" },
      ],
    },
    WEEK: {
      dateRange: "16-11-2026 TO 22-11-2026",
      netCollection: 5491771,
      totalCitizens: 1387,
      items: [
        { id: "property", name: "Property", amount: 3696827, citizens: 636, icon: "FaBuilding", color: "#3B82F6" },
        { id: "waste", name: "Waste", amount: 1107520, citizens: 577, icon: "FaTrashAlt", color: "#10B981" },
        { id: "water", name: "Water", amount: 346146, citizens: 120, icon: "FaWater", color: "#06B6D4" },
        { id: "lease", name: "Lease", amount: 324241, citizens: 50, icon: "FaFileContract", color: "#8B5CF6" },
        { id: "shop", name: "Shop", amount: 17037, citizens: 4, icon: "FaStore", color: "#F59E0B" },
        { id: "tower", name: "Tower", amount: 0, citizens: 0, icon: "FaBroadcastTower", color: "#EC4899" },
        { id: "trade", name: "Trade", amount: 0, citizens: 0, icon: "FaBriefcase", color: "#64748B" },
      ],
    },
    MONTH: {
      dateRange: "01-11-2026 TO 30-11-2026",
      netCollection: 12089988,
      totalCitizens: 2778,
      items: [
        { id: "property", name: "Property", amount: 8229734, citizens: 1262, icon: "FaBuilding", color: "#3B82F6" },
        { id: "waste", name: "Waste", amount: 2179440, citizens: 1112, icon: "FaTrashAlt", color: "#10B981" },
        { id: "water", name: "Water", amount: 650022, citizens: 280, icon: "FaWater", color: "#06B6D4" },
        { id: "lease", name: "Lease", amount: 830496, citizens: 105, icon: "FaFileContract", color: "#8B5CF6" },
        { id: "shop", name: "Shop", amount: 200296, citizens: 19, icon: "FaStore", color: "#F59E0B" },
        { id: "tower", name: "Tower", amount: 0, citizens: 0, icon: "FaBroadcastTower", color: "#EC4899" },
        { id: "trade", name: "Trade", amount: 0, citizens: 0, icon: "FaBriefcase", color: "#64748B" },
      ],
    },
    YEAR: {
      dateRange: "01-04-2026 TO 31-03-2027",
      netCollection: 285537262,
      totalCitizens: 67313,
      items: [
        { id: "property", name: "Property", amount: 203574296, citizens: 30629, icon: "FaBuilding", color: "#3B82F6" },
        { id: "waste", name: "Waste", amount: 53477130, citizens: 28779, icon: "FaTrashAlt", color: "#10B981" },
        { id: "water", name: "Water", amount: 20655914, citizens: 5169, icon: "FaWater", color: "#06B6D4" },
        { id: "lease", name: "Lease", amount: 6878685, citizens: 2571, icon: "FaFileContract", color: "#8B5CF6" },
        { id: "shop", name: "Shop", amount: 951237, citizens: 165, icon: "FaStore", color: "#F59E0B" },
        { id: "tower", name: "Tower", amount: 0, citizens: 0, icon: "FaBroadcastTower", color: "#EC4899" },
        { id: "trade", name: "Trade", amount: 0, citizens: 0, icon: "FaBriefcase", color: "#64748B" },
      ],
    },
  },
  chart: {
    month: [
      { date: "01-11-26", property: 413491, waste: 2210, water: 1110, lease: 25000, shop: 5000, tower: 0, trade: 0, collection: 446811, citizens: 124 },
      { date: "02-11-26", property: 279918, waste: 44600, water: 12930, lease: 21000, shop: 4200, tower: 0, trade: 0, collection: 362648, citizens: 91 },
      { date: "03-11-26", property: 527775, waste: 47780, water: 9690, lease: 31000, shop: 8000, tower: 0, trade: 0, collection: 624245, citizens: 147 },
      { date: "04-11-26", property: 340759, waste: 141170, water: 61556, lease: 28000, shop: 6500, tower: 0, trade: 0, collection: 577985, citizens: 119 },
      { date: "05-11-26", property: 257625, waste: 84570, water: 38110, lease: 19000, shop: 4000, tower: 0, trade: 0, collection: 403305, citizens: 87 },
      { date: "06-11-26", property: 387140, waste: 84420, water: 5500, lease: 26000, shop: 7500, tower: 0, trade: 0, collection: 510560, citizens: 48 },
      { date: "07-11-26", property: 0, waste: 32040, water: 19000, lease: 0, shop: 0, tower: 0, trade: 0, collection: 51040, citizens: 6 },
      { date: "08-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 12 },
      { date: "09-11-26", property: 102540, waste: 1210, water: 4050, lease: 12000, shop: 2200, tower: 0, trade: 0, collection: 122000, citizens: 81 },
      { date: "10-11-26", property: 222301, waste: 36080, water: 30910, lease: 18000, shop: 3600, tower: 0, trade: 0, collection: 310891, citizens: 80 },
      { date: "11-11-26", property: 551950, waste: 104490, water: 15510, lease: 36000, shop: 9500, tower: 0, trade: 0, collection: 717450, citizens: 174 },
      { date: "12-11-26", property: 1108998, waste: 235100, water: 42550, lease: 65000, shop: 15000, tower: 0, trade: 0, collection: 1466648, citizens: 214 },
      { date: "13-11-26", property: 262994, waste: 150590, water: 48090, lease: 22000, shop: 6200, tower: 0, trade: 0, collection: 489874, citizens: 148 },
      { date: "14-11-26", property: 65275, waste: 91640, water: 15500, lease: 8000, shop: 1500, tower: 0, trade: 0, collection: 181915, citizens: 43 },
      { date: "15-11-26", property: 0, waste: 15720, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 15720, citizens: 0 },
      { date: "16-11-26", property: 511228, waste: 174870, water: 122200, lease: 45000, shop: 2500, tower: 0, trade: 0, collection: 855798, citizens: 283 },
      { date: "17-11-26", property: 766411, waste: 273520, water: 63470, lease: 52000, shop: 3200, tower: 0, trade: 0, collection: 1158601, citizens: 304 },
      { date: "18-11-26", property: 965679, waste: 272250, water: 48606, lease: 61000, shop: 3800, tower: 0, trade: 0, collection: 1351335, citizens: 257 },
      { date: "19-11-26", property: 718903, waste: 196510, water: 52660, lease: 58000, shop: 4100, tower: 0, trade: 0, collection: 1030173, citizens: 231 },
      { date: "20-11-26", property: 322389, waste: 111730, water: 29820, lease: 48000, shop: 3437, tower: 0, trade: 0, collection: 515376, citizens: 138 },
      { date: "21-11-26", property: 412217, waste: 78640, water: 29390, lease: 28873, shop: 0, tower: 0, trade: 0, collection: 549120, citizens: 128 },
      { date: "22-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "23-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "24-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "25-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "26-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "27-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "28-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "29-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
      { date: "30-11-26", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
    ],
    week: [
      { date: "Mon (16-11)", property: 511228, waste: 174870, water: 122200, lease: 45000, shop: 2500, tower: 0, trade: 0, collection: 855798, citizens: 283 },
      { date: "Tue (17-11)", property: 766411, waste: 273520, water: 63470, lease: 52000, shop: 3200, tower: 0, trade: 0, collection: 1158601, citizens: 304 },
      { date: "Wed (18-11)", property: 965679, waste: 272250, water: 48606, lease: 61000, shop: 3800, tower: 0, trade: 0, collection: 1351335, citizens: 257 },
      { date: "Thu (19-11)", property: 718903, waste: 196510, water: 52660, lease: 58000, shop: 4100, tower: 0, trade: 0, collection: 1030173, citizens: 231 },
      { date: "Fri (20-11)", property: 322389, waste: 111730, water: 29820, lease: 48000, shop: 3437, tower: 0, trade: 0, collection: 515376, citizens: 138 },
      { date: "Sat (21-11)", property: 412217, waste: 78640, water: 29390, lease: 28873, shop: 0, tower: 0, trade: 0, collection: 549120, citizens: 128 },
      { date: "Sun (22-11)", property: 0, waste: 0, water: 0, lease: 0, shop: 0, tower: 0, trade: 0, collection: 0, citizens: 0 },
    ],
    year: [
      { date: "Apr", property: 18450000, waste: 4850000, water: 1900000, lease: 520000, shop: 75000, tower: 0, trade: 0, collection: 25795000, citizens: 5830 },
      { date: "May", property: 21300000, waste: 5200000, water: 2100000, lease: 580000, shop: 82000, tower: 0, trade: 0, collection: 29262000, citizens: 6430 },
      { date: "Jun", property: 19800000, waste: 4950000, water: 1950000, lease: 540000, shop: 78000, tower: 0, trade: 0, collection: 27318000, citizens: 6140 },
      { date: "Jul", property: 24500000, waste: 6100000, water: 2350000, lease: 610000, shop: 88000, tower: 0, trade: 0, collection: 33648000, citizens: 7490 },
      { date: "Aug", property: 28900000, waste: 7200000, water: 2800000, lease: 690000, shop: 94000, tower: 0, trade: 0, collection: 39684000, citizens: 8800 },
      { date: "Sep", property: 34100000, waste: 8800000, water: 3400000, lease: 820000, shop: 110000, tower: 0, trade: 0, collection: 47230000, citizens: 10750 },
      { date: "Oct", property: 26200000, waste: 6900000, water: 2650000, lease: 710000, shop: 98000, tower: 0, trade: 0, collection: 36558000, citizens: 8260 },
      { date: "Nov (Current)", property: 8229734, waste: 2179440, water: 650022, lease: 830496, shop: 200296, tower: 0, trade: 0, collection: 12089988, citizens: 2778 },
      { date: "Dec (Proj)", property: 22000000, waste: 5800000, water: 2200000, lease: 620000, shop: 85000, tower: 0, trade: 0, collection: 30705000, citizens: 6950 },
      { date: "Jan (Proj)", property: 24000000, waste: 6200000, water: 2400000, lease: 650000, shop: 89000, tower: 0, trade: 0, collection: 33339000, citizens: 7500 },
      { date: "Feb (Proj)", property: 26000000, waste: 6800000, water: 2650000, lease: 690000, shop: 92000, tower: 0, trade: 0, collection: 36232000, citizens: 8260 },
      { date: "Mar (Proj)", property: 35000000, waste: 9200000, water: 3600000, lease: 880000, shop: 120000, tower: 0, trade: 0, collection: 48800000, citizens: 11100 },
    ],
  },
};

export const MODULE_SPECIFIC_DATA = {
  PROPERTY: {
    title: "Property Tax",
    periodCards: {
      TODAY: { label: "TODAY", dateRange: "21-11-2026", amount: 412217, citizens: 61 },
      WEEK: { label: "WEEK", dateRange: "16-11-2026 TO 22-11-2026", amount: 3696827, citizens: 636 },
      MONTH: { label: "MONTH", dateRange: "01-11-2026 TO 30-11-2026", amount: 8229734, citizens: 1262 },
      YEAR: { label: "YEAR", dateRange: "01-04-2026 TO 31-03-2027", amount: 203574296, citizens: 30629 },
    },
    demand: {
      arrear: 875515625,
      current: 320571386,
      totalDemand: 1196087011,
      totalCitizens: 88276,
    },
    collection: {
      arrear: 76819869,
      current: 131475326,
      addition: 411890,
      deduction: 5132789,
      totalCollection: 203574296,
      totalCitizens: 30629,
    },
    balance: {
      arrear: 798695756,
      current: 189096060,
      totalBalance: 987791816,
      totalCitizens: 57647,
    },
    chart: {
      month: [
        { date: "01-11-26", collection: 413491, citizens: 63 },
        { date: "02-11-26", collection: 279918, citizens: 46 },
        { date: "03-11-26", collection: 527775, citizens: 72 },
        { date: "04-11-26", collection: 340759, citizens: 56 },
        { date: "05-11-26", collection: 257625, citizens: 42 },
        { date: "06-11-26", collection: 387140, citizens: 25 },
        { date: "07-11-26", collection: 0, citizens: 0 },
        { date: "08-11-26", collection: 0, citizens: 0 },
        { date: "09-11-26", collection: 102540, citizens: 29 },
        { date: "10-11-26", collection: 222301, citizens: 34 },
        { date: "11-11-26", collection: 551950, citizens: 80 },
        { date: "12-11-26", collection: 1108998, citizens: 103 },
        { date: "13-11-26", collection: 262994, citizens: 70 },
        { date: "14-11-26", collection: 65275, citizens: 22 },
        { date: "15-11-26", collection: 0, citizens: 0 },
        { date: "16-11-26", collection: 511228, citizens: 135 },
        { date: "17-11-26", collection: 766411, citizens: 151 },
        { date: "18-11-26", collection: 965679, citizens: 124 },
        { date: "19-11-26", collection: 718903, citizens: 105 },
        { date: "20-11-26", collection: 322389, citizens: 64 },
        { date: "21-11-26", collection: 412217, citizens: 61 },
        { date: "22-11-26", collection: 0, citizens: 0 },
        { date: "23-11-26", collection: 0, citizens: 0 },
        { date: "24-11-26", collection: 0, citizens: 0 },
        { date: "25-11-26", collection: 0, citizens: 0 },
        { date: "26-11-26", collection: 0, citizens: 0 },
        { date: "27-11-26", collection: 0, citizens: 0 },
        { date: "28-11-26", collection: 0, citizens: 0 },
        { date: "29-11-26", collection: 0, citizens: 0 },
        { date: "30-11-26", collection: 0, citizens: 0 },
      ],
      week: [
        { date: "Mon (16-11)", collection: 511228, citizens: 135 },
        { date: "Tue (17-11)", collection: 766411, citizens: 151 },
        { date: "Wed (18-11)", collection: 965679, citizens: 124 },
        { date: "Thu (19-11)", collection: 718903, citizens: 105 },
        { date: "Fri (20-11)", collection: 322389, citizens: 64 },
        { date: "Sat (21-11)", collection: 412217, citizens: 61 },
        { date: "Sun (22-11)", collection: 0, citizens: 0 },
      ],
      year: [
        { date: "Apr", collection: 18450000, citizens: 2750 },
        { date: "May", collection: 21300000, citizens: 3100 },
        { date: "Jun", collection: 19800000, citizens: 2950 },
        { date: "Jul", collection: 24500000, citizens: 3600 },
        { date: "Aug", collection: 28900000, citizens: 4200 },
        { date: "Sep", collection: 34100000, citizens: 5100 },
        { date: "Oct", collection: 26200000, citizens: 3900 },
        { date: "Nov (Current)", collection: 8229734, citizens: 1262 },
        { date: "Dec (Proj)", collection: 22000000, citizens: 3300 },
        { date: "Jan (Proj)", collection: 24000000, citizens: 3600 },
        { date: "Feb (Proj)", collection: 26000000, citizens: 3900 },
        { date: "Mar (Proj)", collection: 35000000, citizens: 5200 },
      ],
    },
  },

  WASTE: {
    title: "Waste Collection",
    periodCards: {
      TODAY: { label: "TODAY", dateRange: "21-11-2026", amount: 78640, citizens: 56 },
      WEEK: { label: "WEEK", dateRange: "16-11-2026 TO 22-11-2026", amount: 1107520, citizens: 577 },
      MONTH: { label: "MONTH", dateRange: "01-11-2026 TO 30-11-2026", amount: 2179440, citizens: 1112 },
      YEAR: { label: "YEAR", dateRange: "01-04-2026 TO 31-03-2027", amount: 53477130, citizens: 28779 },
    },
    demand: {
      arrear: 338631680,
      current: 129386658,
      totalDemand: 468018338,
      totalCitizens: 95883,
    },
    collection: {
      arrear: 14729388,
      current: 38768282,
      addition: 0,
      deduction: 0,
      totalCollection: 53476530,
      totalCitizens: 28778,
    },
    balance: {
      arrear: 323902292,
      current: 90618376,
      totalBalance: 414520668,
      totalCitizens: 67105,
    },
    chart: {
      month: [
        { date: "01-11-26", collection: 2210, citizens: 46 },
        { date: "02-11-26", collection: 44600, citizens: 35 },
        { date: "03-11-26", collection: 47780, citizens: 59 },
        { date: "04-11-26", collection: 141170, citizens: 45 },
        { date: "05-11-26", collection: 84570, citizens: 36 },
        { date: "06-11-26", collection: 84420, citizens: 21 },
        { date: "07-11-26", collection: 32040, citizens: 0 },
        { date: "08-11-26", collection: 0, citizens: 12 },
        { date: "09-11-26", collection: 1210, citizens: 22 },
        { date: "10-11-26", collection: 36080, citizens: 30 },
        { date: "11-11-26", collection: 104490, citizens: 71 },
        { date: "12-11-26", collection: 235100, citizens: 86 },
        { date: "13-11-26", collection: 150590, citizens: 62 },
        { date: "14-11-26", collection: 91640, citizens: 20 },
        { date: "15-11-26", collection: 15720, citizens: 0 },
        { date: "16-11-26", collection: 174870, citizens: 121 },
        { date: "17-11-26", collection: 273520, citizens: 128 },
        { date: "18-11-26", collection: 272250, citizens: 116 },
        { date: "19-11-26", collection: 196510, citizens: 98 },
        { date: "20-11-26", collection: 111730, citizens: 59 },
        { date: "21-11-26", collection: 78640, citizens: 56 },
        { date: "22-11-26", collection: 0, citizens: 0 },
        { date: "23-11-26", collection: 0, citizens: 0 },
        { date: "24-11-26", collection: 0, citizens: 0 },
        { date: "25-11-26", collection: 0, citizens: 0 },
        { date: "26-11-26", collection: 0, citizens: 0 },
        { date: "27-11-26", collection: 0, citizens: 0 },
        { date: "28-11-26", collection: 0, citizens: 0 },
        { date: "29-11-26", collection: 0, citizens: 0 },
        { date: "30-11-26", collection: 0, citizens: 0 },
      ],
      week: [
        { date: "Mon (16-11)", collection: 174870, citizens: 121 },
        { date: "Tue (17-11)", collection: 273520, citizens: 128 },
        { date: "Wed (18-11)", collection: 272250, citizens: 116 },
        { date: "Thu (19-11)", collection: 196510, citizens: 98 },
        { date: "Fri (20-11)", collection: 111730, citizens: 59 },
        { date: "Sat (21-11)", collection: 78640, citizens: 56 },
        { date: "Sun (22-11)", collection: 0, citizens: 0 },
      ],
      year: [
        { date: "Apr", collection: 4850000, citizens: 2600 },
        { date: "May", collection: 5200000, citizens: 2800 },
        { date: "Jun", collection: 4950000, citizens: 2700 },
        { date: "Jul", collection: 6100000, citizens: 3300 },
        { date: "Aug", collection: 7200000, citizens: 3900 },
        { date: "Sep", collection: 8800000, citizens: 4800 },
        { date: "Oct", collection: 6900000, citizens: 3700 },
        { date: "Nov (Current)", collection: 2179440, citizens: 1112 },
        { date: "Dec (Proj)", collection: 5800000, citizens: 3100 },
        { date: "Jan (Proj)", collection: 6200000, citizens: 3300 },
        { date: "Feb (Proj)", collection: 6800000, citizens: 3700 },
        { date: "Mar (Proj)", collection: 9200000, citizens: 5000 },
      ],
    },
  },

  WATER: {
    title: "Water Collection",
    periodCards: {
      TODAY: { label: "TODAY", dateRange: "21-11-2026", amount: 29390, citizens: 9 },
      WEEK: { label: "WEEK", dateRange: "16-11-2026 TO 22-11-2026", amount: 346146, citizens: 120 },
      MONTH: { label: "MONTH", dateRange: "01-11-2026 TO 30-11-2026", amount: 650022, citizens: 280 },
      YEAR: { label: "YEAR", dateRange: "01-04-2026 TO 31-03-2027", amount: 20655914, citizens: 5169 },
    },
    demand: {
      arrear: 839361252,
      current: 94923390,
      totalDemand: 934284642,
      totalCitizens: 43853,
    },
    collection: {
      arrear: 4859816,
      current: 15796101,
      addition: 0,
      deduction: 0,
      totalCollection: 20634777,
      totalCitizens: 5169,
    },
    balance: {
      arrear: 834501436,
      current: 79127289,
      totalBalance: 913628725,
      totalCitizens: 38684,
    },
    chart: {
      month: [
        { date: "01-11-26", collection: 1110, citizens: 13 },
        { date: "02-11-26", collection: 12930, citizens: 8 },
        { date: "03-11-26", collection: 9690, citizens: 13 },
        { date: "04-11-26", collection: 61556, citizens: 15 },
        { date: "05-11-26", collection: 38110, citizens: 7 },
        { date: "06-11-26", collection: 5500, citizens: 0 },
        { date: "07-11-26", collection: 19000, citizens: 6 },
        { date: "08-11-26", collection: 0, citizens: 0 },
        { date: "09-11-26", collection: 4050, citizens: 28 },
        { date: "10-11-26", collection: 30910, citizens: 14 },
        { date: "11-11-26", collection: 15510, citizens: 20 },
        { date: "12-11-26", collection: 42550, citizens: 21 },
        { date: "13-11-26", collection: 48090, citizens: 13 },
        { date: "14-11-26", collection: 15500, citizens: 0 },
        { date: "15-11-26", collection: 0, citizens: 0 },
        { date: "16-11-26", collection: 122200, citizens: 27 },
        { date: "17-11-26", collection: 63470, citizens: 25 },
        { date: "18-11-26", collection: 48606, citizens: 17 },
        { date: "19-11-26", collection: 52660, citizens: 28 },
        { date: "20-11-26", collection: 29820, citizens: 15 },
        { date: "21-11-26", collection: 29390, citizens: 9 },
        { date: "22-11-26", collection: 0, citizens: 0 },
        { date: "23-11-26", collection: 0, citizens: 0 },
        { date: "24-11-26", collection: 0, citizens: 0 },
        { date: "25-11-26", collection: 0, citizens: 0 },
        { date: "26-11-26", collection: 0, citizens: 0 },
        { date: "27-11-26", collection: 0, citizens: 0 },
        { date: "28-11-26", collection: 0, citizens: 0 },
        { date: "29-11-26", collection: 0, citizens: 0 },
        { date: "30-11-26", collection: 0, citizens: 0 },
      ],
      week: [
        { date: "Mon (16-11)", collection: 122200, citizens: 27 },
        { date: "Tue (17-11)", collection: 63470, citizens: 25 },
        { date: "Wed (18-11)", collection: 48606, citizens: 17 },
        { date: "Thu (19-11)", collection: 52660, citizens: 28 },
        { date: "Fri (20-11)", collection: 29820, citizens: 15 },
        { date: "Sat (21-11)", collection: 29390, citizens: 9 },
        { date: "Sun (22-11)", collection: 0, citizens: 0 },
      ],
      year: [
        { date: "Apr", collection: 1900000, citizens: 480 },
        { date: "May", collection: 2100000, citizens: 530 },
        { date: "Jun", collection: 1950000, citizens: 490 },
        { date: "Jul", collection: 2350000, citizens: 590 },
        { date: "Aug", collection: 2800000, citizens: 700 },
        { date: "Sep", collection: 3400000, citizens: 850 },
        { date: "Oct", collection: 2650000, citizens: 660 },
        { date: "Nov (Current)", collection: 650022, citizens: 280 },
        { date: "Dec (Proj)", collection: 2200000, citizens: 550 },
        { date: "Jan (Proj)", collection: 2400000, citizens: 600 },
        { date: "Feb (Proj)", collection: 2650000, citizens: 660 },
        { date: "Mar (Proj)", collection: 3600000, citizens: 900 },
      ],
    },
  },
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

// Merges live API response with ALL_MODULES_DATA structure
export const mergeAllModulesApiData = (defaultData, apiAllModules) => {
  if (!apiAllModules || !apiAllModules.periods) return defaultData;
  const newPeriods = { ...defaultData.periods };

  Object.keys(apiAllModules.periods).forEach((pKey) => {
    const apiPeriod = apiAllModules.periods[pKey];
    if (!apiPeriod) return;

    const baseItems = defaultData.periods[pKey]?.items || [];
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
      ...defaultData.periods[pKey],
      dateRange: apiPeriod.date || defaultData.periods[pKey]?.dateRange,
      netCollection:
        apiPeriod.netCollection !== undefined
          ? apiPeriod.netCollection
          : defaultData.periods[pKey]?.netCollection,
      totalCitizens: totalCitizens || defaultData.periods[pKey]?.totalCitizens,
      items: newItems,
    };
  });

  const newChart = { ...defaultData.chart };
  if (Array.isArray(apiAllModules.chartData) && apiAllModules.chartData.length > 0) {
    newChart.month = apiAllModules.chartData;
  }

  return {
    ...defaultData,
    periods: newPeriods,
    chart: newChart,
  };
};

// Merges live API response with MODULE_SPECIFIC_DATA structure
export const mergeModuleSpecificApiData = (defaultData, apiModules) => {
  if (!apiModules) return defaultData;
  const result = { ...defaultData };

  ["PROPERTY", "WASTE", "WATER"].forEach((modKey) => {
    const apiMod = apiModules[modKey];
    if (!apiMod) return;

    const currentMod = defaultData[modKey];
    if (!currentMod) return;

    const newPeriods = { ...currentMod.periods };
    if (apiMod.periods) {
      Object.keys(apiMod.periods).forEach((pKey) => {
        const p = apiMod.periods[pKey];
        if (!p) return;
        newPeriods[pKey] = {
          ...currentMod.periods[pKey],
          dateRange: p.date || currentMod.periods[pKey]?.dateRange,
          amount: p.amount !== undefined ? p.amount : currentMod.periods[pKey]?.amount,
          citizens: p.citizens !== undefined ? p.citizens : currentMod.periods[pKey]?.citizens,
        };
      });
    }

    const newDcb = {
      ...currentMod.dcb,
      ...(apiMod.dcb || {}),
    };

    const newChart = { ...currentMod.chart };
    if (Array.isArray(apiMod.chartData) && apiMod.chartData.length > 0) {
      newChart.month = apiMod.chartData.map((d) => ({
        date: d.date,
        collection: d.amount !== undefined ? d.amount : d.collection,
        citizens: d.citizens !== undefined ? d.citizens : 0,
      }));
    }

    result[modKey] = {
      ...currentMod,
      periods: newPeriods,
      dcb: newDcb,
      chart: newChart,
    };
  });

  return result;
};

// Merges live periods into ALL_MODULES_DATA
export const mergeAllModulesPeriods = (defaultData, apiPeriods) => {
  if (!apiPeriods) return defaultData;
  const newPeriods = { ...defaultData.periods };

  Object.keys(apiPeriods).forEach((pKey) => {
    const apiPeriod = apiPeriods[pKey];
    if (!apiPeriod) return;

    const baseItems = defaultData.periods[pKey]?.items || [];
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
      ...defaultData.periods[pKey],
      dateRange: apiPeriod.date || defaultData.periods[pKey]?.dateRange,
      netCollection:
        apiPeriod.netCollection !== undefined
          ? apiPeriod.netCollection
          : defaultData.periods[pKey]?.netCollection,
      totalCitizens: totalCitizens || defaultData.periods[pKey]?.totalCitizens,
      items: newItems,
    };
  });

  return {
    ...defaultData,
    periods: newPeriods,
  };
};

// Merges chart data into ALL_MODULES_DATA
export const mergeAllModulesChart = (defaultData, apiChartData) => {
  if (!Array.isArray(apiChartData) || apiChartData.length === 0) return defaultData;
  return {
    ...defaultData,
    chart: {
      ...defaultData.chart,
      month: apiChartData,
    },
  };
};

// Merges overview (periods + chart) for a single module
export const mergeSingleModuleOverview = (defaultData, moduleKey, apiOverview) => {
  if (!apiOverview || !defaultData[moduleKey]) return defaultData;
  const currentMod = defaultData[moduleKey];

  const newPeriods = { ...currentMod.periods };
  if (apiOverview.periods) {
    Object.keys(apiOverview.periods).forEach((pKey) => {
      const p = apiOverview.periods[pKey];
      if (!p) return;
      newPeriods[pKey] = {
        ...currentMod.periods[pKey],
        dateRange: p.date || currentMod.periods[pKey]?.dateRange,
        amount: p.amount !== undefined ? p.amount : currentMod.periods[pKey]?.amount,
        citizens: p.citizens !== undefined ? p.citizens : currentMod.periods[pKey]?.citizens,
      };
    });
  }

  const newChart = { ...currentMod.chart };
  if (Array.isArray(apiOverview.chartData) && apiOverview.chartData.length > 0) {
    newChart.month = apiOverview.chartData.map((d) => ({
      date: d.date,
      collection: d.amount !== undefined ? d.amount : d.collection,
      citizens: d.citizens !== undefined ? d.citizens : 0,
    }));
  }

  return {
    ...defaultData,
    [moduleKey]: {
      ...currentMod,
      periods: newPeriods,
      chart: newChart,
    },
  };
};

// Merges DCB for a single module
export const mergeSingleModuleDcb = (defaultData, moduleKey, apiDcb) => {
  if (!apiDcb || !defaultData[moduleKey]) return defaultData;
  return {
    ...defaultData,
    [moduleKey]: {
      ...defaultData[moduleKey],
      dcb: {
        ...defaultData[moduleKey].dcb,
        ...apiDcb,
      },
    },
  };
};
