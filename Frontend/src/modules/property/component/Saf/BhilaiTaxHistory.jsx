import { useState } from "react";

const currency = (value) => {
  if (value === null || value === undefined || value === "") return "0.00";
  const num = Number(value);
  return Number.isNaN(num) ? value : num.toFixed(2);
};

const TAX_COLUMNS = [
  { key: "effectFrom", label: "Effect From" },
  { key: "arv", label: "ARV", align: "right", format: currency },
  { key: "ratePercent", label: "Rate( in %)", align: "right", format: currency },
  { key: "propertyTax", label: "Property Tax", align: "right", format: currency },
  { key: "compositeTax", label: "Composite Tax", align: "right", format: currency },
  { key: "commonWaterTax", label: "Common Water Tax", align: "right", format: currency },
  { key: "personalWaterTax", label: "Personal Water Tax", align: "right", format: currency },
  { key: "educationCess", label: "Education Cess", align: "right", format: currency },
  { key: "yearlyTax", label: "Yearly Tax", align: "right", bold: true, format: currency },
];

const ARV_COLUMNS = [
  { key: "code", label: "Code" },
  { key: "constructionDate", label: "Construction Date" },
  { key: "effectFrom", label: "Effect From" },
  { key: "buildupArea", label: "Buildup Area", align: "right" },
  { key: "rate", label: "Rate", align: "right" },
  { key: "totalARV", label: "Total ARV", align: "right", format: currency },
  { key: "widowRebate", label: "Widow & Others", align: "right", format: currency },
  { key: "tenPercentRebate", label: "10% Rebate on ARV", align: "right", format: currency },
  { key: "oldHouseDiscount", label: "Old House Discount(%)", align: "right", format: currency },
  { key: "disabledDiscount", label: "25% Discount on Physically Disabled", align: "right", format: currency },
  { key: "netARV", label: "Net ARV", align: "right", bold: true, format: currency },
];

const DataTable = ({ columns, rows }) => (
  <div className="overflow-x-auto">
    <table className="border border-gray-300 min-w-full text-sm">
      <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className="px-3 py-2 border font-semibold text-left whitespace-nowrap"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b">
            {columns.map((col) => (
              <td
                key={col.key}
                className={`px-3 py-2 border whitespace-nowrap ${
                  col.align === "right" ? "text-right" : ""
                } ${col.bold ? "font-semibold" : ""}`}
              >
                {col.format ? col.format(row[col.key]) : row[col.key] ?? "-"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TaxDetailsSection = ({ rows }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-blue-300 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex justify-between items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md px-4 py-2.5 w-full font-bold text-white text-sm uppercase tracking-wide"
      >
        <span>Tax Details</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-4">
          <DataTable columns={TAX_COLUMNS} rows={rows} />
        </div>
      )}
    </div>
  );
};

const AnnualRentalValueSection = ({ label, rows }) => (
  <div className="flex flex-col gap-2">
    <h3 className="py-1 pl-3 border-blue-600 border-l-4 font-semibold text-gray-800 text-base">
      Annual Rental Value As per the Rate of {label}
    </h3>
    <DataTable columns={ARV_COLUMNS} rows={rows} />
  </div>
);

/**
 * Builds the `entries` prop for BhilaiTaxHistory from the real API response
 * of reviewTaxApi/safApplyApi (the `taxDtl` state in Preview.jsx), which is
 * `camelCase(BhiliaTaxCalculator::$_GRID)` from the backend. Reads
 * `taxDtl.ruleSetVersionTax` — the same array TaxViewTab's "Rulesetwise Tax"
 * tab renders — one entry per rate era, each carrying:
 *   - `dTL`: one row per floor active in that era (feeds the ARV table)
 *   - `fyearlytax`: one row per financial year in that era, summed across
 *     every floor active that year (feeds the Tax Details table)
 *
 * The backend doesn't compute widow/old-house/disabled-discount amounts, or
 * a per-financial-year ARV/rate split when more than one floor is active in
 * a year, so those are filled in as best-effort (0, or reconstructed from
 * the floors' own era-level ARV where unambiguous).
 */
export const buildEntriesFromTaxDtl = (taxDtl) => {
  const eras = taxDtl?.ruleSetVersionTax;
  if (!Array.isArray(eras) || !eras.length) return [];

  const sortedEras = [...eras].sort((a, b) =>
    String(a?.effectiveFromFYear).localeCompare(String(b?.effectiveFromFYear)),
  );

  const entries = [];

  sortedEras.forEach((era) => {
    const floors = Array.isArray(era?.dTL) ? era.dTL : [];

    entries.push({
      type: "arv",
      label: era?.effectiveFromFYear || "-",
      rows: floors.map((floor) => ({
        code: floor?.floorDtl?.floorName || floor?.floorName || "-",
        constructionDate: floor?.floorDtl?.dateFrom || floor?.dateFrom || "-",
        effectFrom: floor?.fromFYear || era?.effectiveFromFYear || "-",
        buildupArea: floor?.floorDtl?.builtupArea ?? floor?.taxableArea ?? "-",
        rate: floor?.arvRate ?? "-",
        totalARV: floor?.yearlyARV,
        widowRebate: 0,
        tenPercentRebate: floor?.aRV10PercentRebate,
        oldHouseDiscount: 0,
        disabledDiscount: 0,
        netARV: floor?.aRV,
      })),
    });

    const activeFloorsInYear = (fyear) =>
      floors.filter(
        (floor) =>
          floor?.fromFYear <= fyear &&
          (!floor?.uptoFYear || floor.uptoFYear >= fyear),
      );

    const years = Array.isArray(era?.fyearlytax) ? era.fyearlytax : [];

    const yearRows = years.map((year) => {
      const activeFloors = activeFloorsInYear(year?.fyear);
      const arv = activeFloors.reduce(
        (sum, floor) => sum + (Number(floor?.aRV) || 0),
        0,
      );
      const ratePercent =
        activeFloors.length === 1 ? activeFloors[0]?.ratePercent : "-";

      return {
        effectFrom: year?.fyear ? `FY:${year.fyear}` : "-",
        arv: activeFloors.length ? arv : "-",
        ratePercent,
        propertyTax: year?.holdingTax,
        compositeTax: year?.compositeTax,
        commonWaterTax: year?.waterTax,
        personalWaterTax: 0,
        educationCess: year?.educationCessTax,
        yearlyTax: year?.totalTax,
      };
    });

    // Collapse a run of consecutive years whose tax figures are identical
    // (i.e. nothing about the taxed floors changed) into a single row,
    // keeping only the first year's label — a demand memo shows one line
    // per rate/composition change, not one line per financial year.
    const AMOUNT_KEYS = [
      "arv",
      "ratePercent",
      "propertyTax",
      "compositeTax",
      "commonWaterTax",
      "personalWaterTax",
      "educationCess",
      "yearlyTax",
    ];
    const sameAmounts = (a, b) =>
      AMOUNT_KEYS.every((key) => String(a[key]) === String(b[key]));

    const collapsedRows = yearRows.reduce((acc, row) => {
      const previous = acc[acc.length - 1];
      if (previous && sameAmounts(previous, row)) return acc;
      acc.push(row);
      return acc;
    }, []);

    entries.push({ type: "tax", rows: collapsedRows });
  });

  return entries.filter((entry) => entry.rows?.length);
};

/**
 * Renders a property's ARV/tax rate-change history as an alternating sequence
 * of "Tax Details" (collapsible) and "Annual Rental Value As per the Rate of
 * ..." blocks, mirroring how the demand history is presented on a printed SAF
 * assessment memo. Each block's table can hold one row (a single floor / a
 * single financial year) or several (multiple floors sharing a rate era,
 * multiple years sharing the same composite-tax rate) — whichever the data
 * calls for.
 *
 * `entries`: [
 *   { type: "tax", rows: [{...TAX_COLUMNS keys}, ...] } |
 *   { type: "arv", label, rows: [{...ARV_COLUMNS keys}, ...] }
 * ]
 */
const BhilaiTaxHistory = ({ entries }) => {
  const list = Array.isArray(entries) ? entries : [];

  if (!list.length) {
    return <p className="text-gray-500 text-sm">No tax details available.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {list.map((entry, index) =>
        entry.type === "arv" ? (
          <AnnualRentalValueSection
            key={index}
            label={entry.label}
            rows={entry.rows}
          />
        ) : (
          <TaxDetailsSection key={index} rows={entry.rows} />
        ),
      )}
    </div>
  );
};

export default BhilaiTaxHistory;
