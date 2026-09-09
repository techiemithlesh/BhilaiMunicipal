import { useState } from "react";

const TaxViewTab = ({ taxDtl }) => {
  const [activeTab, setActiveTab] = useState("floor");

  if (!taxDtl || typeof taxDtl !== "object") {
    return <div>Loading or no data available</div>;
  }

  const tabs = [
    { key: "floor", label: "Floorwise Tax" },
    { key: "financial", label: "Financial Yearwise Tax" },
    { key: "ruleset", label: "Rulesetwise Tax" },
  ];

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex space-x-4 mb-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 font-semibold ${
              activeTab === tab.key
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "floor" &&
          taxDtl.floorWiseTax.map((floor, floorIndex) =>
            floor?.floorName ? (
              <FloorPanel key={floorIndex} floor={floor} />
            ) : null
          )}

        {activeTab === "financial" &&
          taxDtl.fyearWiseTax?.map((fy, fyIndex) => (
            <FinancialYearPanel key={fyIndex} fy={fy} />
          ))}

        {activeTab === "ruleset" && (
          <>
            {taxDtl.ruleSetVersionTax &&
              taxDtl.ruleSetVersionTax.map((ruleSetData, index) => (
                <RuleSetPanel key={index} ruleSet={ruleSetData} />
              ))}
          </>
        )}
      </div>
    </div>
  );
};

const FloorPanel = ({ floor }) => {
  const [open, setOpen] = useState(false);

  const totalSummary = Array.isArray(floor.tax)
    ? floor.tax.reduce((acc, taxItem) => {
        if (!Array.isArray(taxItem.fyearTax)) return acc;
        const amount = parseFloat(
          taxItem.fyearTax?.length > 0 ? taxItem?.totalTax ?? 0 : 0
        );
        const monthlyPenalty = parseFloat(
          taxItem.fyearTax?.length > 0 ? taxItem?.monthlyPenalty ?? 0 : 0
        );
        acc["propertyTax"] = (acc["propertyTax"] || 0) + amount;
        acc["monthlyPenalty"] = (acc["monthlyPenalty"] || 0) + monthlyPenalty;
        return acc;
      }, {})
    : {};

  return (
    <div className="space-y-4 bg-white shadow p-4 border rounded-2xl">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="font-bold text-xl">{floor.floorName || ""}</h3>
        <button className="text-blue-600 text-sm hover:underline">
          {open ? "Hide Details ▲" : "Show Details ▼"}
        </button>
      </div>

      <div className="space-y-2 text-gray-700 text-sm">
        <p>
          <strong className="text-gray-800">Construction Type:</strong>{" "}
          {floor?.constructionType} |{" "}
          <strong className="text-gray-800">Occupancy Type:</strong>{" "}
          {floor?.occupancyType} |{" "}
          <strong className="text-gray-800">Usage Type:</strong>{" "}
          {floor?.usageType} |{" "}
          <strong className="text-gray-800">From Date:</strong>{" "}
          {floor?.dateFrom}
        </p>
        <div className="text-gray-600 text-sm">
          {Object.entries(totalSummary).map(([type, amount]) => (
            <span key={type} className="mr-4 font-medium text-primary">
              {type}: ₹{amount.toFixed(2)}
            </span>
          ))}
        </div>
      </div>

      {open && (
        <div className="overflow-x-auto">
          <table className="border border-gray-300 min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2 border">SL</th>
                <th className="px-3 py-2 border">Rule Set</th>
                <th className="px-3 py-2 border">From Year</th>
                <th className="px-3 py-2 border">From Qtr</th>
                <th className="px-3 py-2 border">Upto Year</th>
                <th className="px-3 py-2 border">Upto Qtr</th>
                <th className="px-3 py-2 border">ARV</th>
                <th className="px-3 py-2 border">Property Tax</th>
                <th className="px-3 py-2 border">Holding Tax</th>
                <th className="px-3 py-2 border">Health Cess</th>
                <th className="px-3 py-2 border">Latrine Tax</th>
                <th className="px-3 py-2 border">RWH</th>
                <th className="px-3 py-2 border">Total Tax</th>
                <th className="px-3 py-2 border">Monthly Penalty</th>
                <th className="px-3 py-2 border">Applicable</th>
              </tr>
            </thead>
            <tbody>
              {floor.tax.map((tax, index) => {
                const isApplicable = tax?.fyearTax.length > 0;
                return (
                  <tr
                    key={index}
                    className={`border-b ${
                      isApplicable ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    <td className="px-3 py-2 border text-center">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 border">{tax?.ruleSet}</td>
                    <td className="px-3 py-2 border">{tax?.fromFYear}</td>
                    <td className="px-3 py-2 border">{tax?.fromQtr}</td>
                    <td className="px-3 py-2 border">{tax?.uptoFYear}</td>
                    <td className="px-3 py-2 border">{tax?.uptoQtr}</td>
                    <td className="px-3 py-2 border text-right">{tax?.aRV}</td>
                    <td className="px-3 py-2 border text-right">
                      {tax?.propertyTax}
                    </td>
                    <td className="px-3 py-2 border text-right">
                      {tax?.holdingTax}
                      <span className="ml-1 text-blue-600 text-xs">
                        ({tax?.holdingTaxPercent}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 border text-right">
                      {tax?.healthCessTax}
                      <span className="ml-1 text-blue-600 text-xs">
                        ({tax?.healthCessTaxPercent}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 border text-right">
                      {tax?.latrineTax}
                      <span className="ml-1 text-blue-600 text-xs">
                        ({tax?.latrineTaxPercent}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 border text-right">
                      {tax?.rWH}
                      <span className="ml-1 text-blue-600 text-xs">
                        ({tax?.rWHTaxPercent}%)
                      </span>
                    </td>
                    <td className="px-3 py-2 border font-semibold text-right">
                      {tax?.totalTax}
                    </td>
                    <td className="px-3 py-2 border font-semibold text-right">
                      {tax?.monthlyPenalty}
                    </td>
                    <td className="px-3 py-2 border text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          isApplicable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isApplicable ? "YES" : "NO"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const FinancialYearPanel = ({ fy }) => {
  const [open, setOpen] = useState(false);
  const totalSummary = Array.isArray(fy.quarterly)
    ? fy.quarterly.reduce((acc, taxItem) => {
        const amount = parseFloat(taxItem?.totalTax ?? 0);
        const monthlyPenalty = parseFloat(taxItem?.monthlyPenalty ?? 0);
        acc["propertyTax"] = (acc["propertyTax"] || 0) + amount;
        acc["monthlyPenalty"] = (acc["monthlyPenalty"] || 0) + monthlyPenalty;
        return acc;
      }, {})
    : {};

  return (
    <div className="bg-white p-3 border rounded-xl">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="font-bold text-xl">{fy?.fyear || "N/A"}</h3>
        <button className="text-blue-600 text-sm hover:underline">
          {open ? "Hide Details ▲" : "Show Details ▼"}
        </button>
      </div>
      <div className="space-y-2 text-gray-700 text-sm">
        <p>
          <strong className="text-gray-800">No Of Floors:</strong>{" "}
          {fy?.floorCount} |{" "}
          <strong className="text-gray-800">From QTR:</strong> {fy?.fromQtr} |{" "}
          <strong className="text-gray-800">Upto QTR:</strong> {fy?.uptoQtr}{" "}
        </p>
        <div className="text-gray-600 text-sm">
          {Object.entries(totalSummary).map(([type, amount]) => (
            <span key={type} className="mr-4 font-medium text-primary">
              {type}: ₹{amount.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-1 text-gray-700 text-xs">
        {open && (
          <div className="overflow-x-auto">
            <table className="border border-gray-300 min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 border">SL</th>
                  <th className="px-3 py-2 border">F YEAR</th>
                  <th className="px-3 py-2 border">QTR</th>
                  <th className="px-3 py-2 border">Holding Tax</th>
                  <th className="px-3 py-2 border">Health Cess</th>
                  <th className="px-3 py-2 border">Latrine Tax</th>
                  <th className="px-3 py-2 border">RWH</th>
                  <th className="px-3 py-2 border">Total Tax</th>
                  <th className="px-3 py-2 border">Monthly Penalty</th>
                </tr>
              </thead>
              <tbody>
                {fy.quarterly.map((qtr, index) => {
                  const isApplicable = true;
                  return (
                    <tr
                      key={index}
                      className={`border-b ${
                        isApplicable ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      <td className="px-3 py-2 border text-center">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2 border">{qtr?.fyear}</td>
                      <td className="px-3 py-2 border">{qtr?.qtr}</td>
                      <td className="px-3 py-2 border text-right">
                        {qtr?.holdingTax}
                      </td>
                      <td className="px-3 py-2 border text-right">
                        {qtr?.healthCessTax}
                      </td>
                      <td className="px-3 py-2 border text-right">
                        {qtr?.latrineTax}
                      </td>
                      <td className="px-3 py-2 border text-right">
                        {qtr?.rWH}
                      </td>
                      <td className="px-3 py-2 border font-semibold text-right">
                        {qtr?.totalTax}
                      </td>
                      <td className="px-3 py-2 border font-semibold text-right">
                        {qtr?.monthlyPenalty}
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
  );
};

const RuleSetPanel = ({ ruleSet }) => {
  const [open, setOpen] = useState(false);
  // const totalSummary = Array.isArray(fy.quarterly)
  //   ? fy.quarterly.reduce((acc, taxItem) => {
  //       const amount = parseFloat(
  //          taxItem?.totalTax ?? 0
  //       );
  //       acc["propertyTax"] = (acc["propertyTax"] || 0) + amount;
  //       return acc;
  //     }, {})
  //   : {};

  return (
    <div className="bg-white p-3 border rounded-xl">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="font-bold text-xl">{ruleSet?.ruleSet || "N/A"}</h3>
        <button className="text-blue-600 text-sm hover:underline">
          {open ? "Hide Details ▲" : "Show Details ▼"}
        </button>
      </div>
      <div className="space-y-2 text-gray-700 text-sm">
        <div>
          <strong className="text-gray-800">Effective From:</strong>{" "}
          {ruleSet?.effectiveFrom} |{" "}
          <strong className="text-gray-800">Effective Upto:</strong>{" "}
          {ruleSet?.effectiveUpto} |{" "}
          <strong className="bg-white">
            <div
              className="bg-gray-50 p-4 border border-gray-200 rounded overflow-auto font-mono text-gray-800 text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: ruleSet?.description.trim() || "",
              }}
            />
          </strong>
        </div>
        <div className="text-gray-600 text-sm">
          {/* {Object.entries(totalSummary).map(([type, amount]) => (
            <span key={type} className="mr-4 font-medium text-primary">
              {type}: ₹{amount.toFixed(2)}
            </span>
          ))} */}
        </div>
      </div>
      {open && (
        <div className="mt-1 text-gray-700 text-xs">
          <div className="overflow-x-auto">
            {ruleSet?.ruleSet == "BuildingRules1" && (
              <table className="border border-gray-300 min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border">SL</th>
                    <th className="px-3 py-2 border">Floors</th>
                    <th className="px-3 py-2 border">Use Type</th>
                    <th className="px-3 py-2 border">Rental Rate</th>
                    <th className="px-3 py-2 border">
                      Buildup Area (in Sq. Ft)
                    </th>
                    <th className="px-3 py-2 border">Effect From</th>
                    <th className="px-3 py-2 border">ARV</th>
                    <th className="px-3 py-2 border">Holding Tax</th>
                    <th className="px-3 py-2 border">Water Tax</th>
                    <th className="px-3 py-2 border">Latrine Tax</th>
                    <th className="px-3 py-2 border">Education Cess</th>
                    <th className="px-3 py-2 border">Health Cess</th>
                    <th className="px-3 py-2 border">Total Tax</th>
                    <th className="px-3 py-2 border">Quarterly Tax</th>
                    <th className="px-3 py-2 border">Monthly Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleSet.dTL.map((floor, index) => {
                    const isApplicable = true;
                    if (floor?.fyearTax?.length > 0) {
                      return (
                        <tr
                          key={index}
                          className={`border-b ${
                            isApplicable ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          <td className="px-3 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.floorName}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.usageType}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.rentalRate}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.floorDtl?.builtupArea}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.effectiveFromFYear}/{floor?.fromQtr}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.aRV}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.holdingTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.waterTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.latrineTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.educationCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.healthCessTax}
                          </td>
                          <td className="px-3 py-2 border font-semibold text-right">
                            {floor?.totalTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.totalTaxQuarterly}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.monthlyPenalty}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}
            {ruleSet?.ruleSet == "BuildingRules2" && (
              <table className="border border-gray-300 min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border">SL</th>
                    <th className="px-3 py-2 border">Floors</th>
                    <th className="px-3 py-2 border">Use Type</th>
                    <th className="px-3 py-2 border">Usage Factor</th>
                    <th className="px-3 py-2 border">Occupancy Factor</th>
                    <th className="px-3 py-2 border">Rental Rate</th>
                    <th className="px-3 py-2 border">
                      Carpet Area (in Sq. Ft)
                    </th>
                    <th className="px-3 py-2 border">Effect From</th>
                    <th className="px-3 py-2 border">ARV</th>
                    <th className="px-3 py-2 border">Holding Tax</th>
                    <th className="px-3 py-2 border">Water Tax</th>
                    <th className="px-3 py-2 border">Latrine Tax</th>
                    <th className="px-3 py-2 border">Education Cess</th>
                    <th className="px-3 py-2 border">Health Cess</th>
                    <th className="px-3 py-2 border">RWH</th>
                    <th className="px-3 py-2 border">Total Tax</th>
                    <th className="px-3 py-2 border">Quarterly Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleSet.dTL.map((floor, index) => {
                    const isApplicable = true;
                    if (floor?.fyearTax?.length > 0) {
                      return (
                        <tr
                          key={index}
                          className={`border-b ${
                            isApplicable ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          <td className="px-3 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.floorName}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.usageType}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.usageRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.occupancyRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.rentalRete}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.carpetArea}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.effectiveFromFYear}/{floor?.fromQtr}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.aRV}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.holdingTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.waterTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.latrineTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.educationCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.healthCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.rWH}
                          </td>
                          <td className="px-3 py-2 border font-semibold text-right">
                            {floor?.totalTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.totalTaxQuarterly}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}
            {ruleSet?.ruleSet == "BuildingRules3" && (
              <table className="border border-gray-300 min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border">SL</th>
                    <th className="px-3 py-2 border">Floors</th>
                    <th className="px-3 py-2 border">Use Type</th>
                    <th className="px-3 py-2 border">Capital Rate</th>
                    <th className="px-3 py-2 border">
                      Buildup Area (in Sq. Ft)
                    </th>
                    <th className="px-3 py-2 border">Occupancy Factor</th>
                    <th className="px-3 py-2 border">Tax Percentage</th>
                    <th className="px-3 py-2 border">Matrix Factor</th>
                    <th className="px-3 py-2 border">Effect From</th>
                    <th className="px-3 py-2 border">Property Tax</th>
                    <th className="px-3 py-2 border">Holding Tax</th>
                    <th className="px-3 py-2 border">Water Tax</th>
                    <th className="px-3 py-2 border">Latrine Tax</th>
                    <th className="px-3 py-2 border">Education Cess</th>
                    <th className="px-3 py-2 border">Health Cess</th>
                    <th className="px-3 py-2 border">RWH</th>
                    <th className="px-3 py-2 border">Total Tax</th>
                    <th className="px-3 py-2 border">Quarterly Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleSet.dTL.map((floor, index) => {
                    const isApplicable = true;
                    if (floor?.fyearTax?.length > 0) {
                      return (
                        <tr
                          key={index}
                          className={`border-b ${
                            isApplicable ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          <td className="px-3 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.floorName}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.usageType}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.capitalValue}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.buildupArea}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.occupancyRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.taxPercent}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.matrixFactorRate}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.effectiveFromFYear}/{floor?.fromQtr}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.propertyTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.holdingTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.waterTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.latrineTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.educationCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.healthCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.rWH}
                          </td>
                          <td className="px-3 py-2 border font-semibold text-right">
                            {floor?.totalTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.totalTaxQuarterly}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}

            {ruleSet?.ruleSet == "BuildingRules4" && (
              <table className="border border-gray-300 min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border">SL</th>
                    <th className="px-3 py-2 border">Floors</th>
                    <th className="px-3 py-2 border">Use Type</th>
                    <th className="px-3 py-2 border">Capital Rate</th>
                    <th className="px-3 py-2 border">
                      Buildup Area (in Sq. Ft)
                    </th>
                    <th className="px-3 py-2 border">Occupancy Factor</th>
                    <th className="px-3 py-2 border">Tax Percentage</th>
                    <th className="px-3 py-2 border">Matrix Factor</th>
                    <th className="px-3 py-2 border">Effect From</th>
                    <th className="px-3 py-2 border">Property Tax</th>
                    <th className="px-3 py-2 border">Holding Tax</th>
                    <th className="px-3 py-2 border">Water Tax</th>
                    <th className="px-3 py-2 border">Latrine Tax</th>
                    <th className="px-3 py-2 border">Education Cess</th>
                    <th className="px-3 py-2 border">Health Cess</th>
                    <th className="px-3 py-2 border">RWH</th>
                    <th className="px-3 py-2 border">Total Tax</th>
                    <th className="px-3 py-2 border">Quarterly Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleSet.dTL.map((floor, index) => {
                    const isApplicable = true;
                    if (floor?.fyearTax?.length > 0) {
                      return (
                        <tr
                          key={index}
                          className={`border-b ${
                            isApplicable ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          <td className="px-3 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.floorName}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.usageType}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.capitalValue}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.buildupArea}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.occupancyRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.taxPercent}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.matrixFactorRate}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.effectiveFromFYear}/{floor?.fromQtr}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.propertyTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.holdingTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.waterTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.latrineTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.educationCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.healthCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.rWH}
                          </td>
                          <td className="px-3 py-2 border font-semibold text-right">
                            {floor?.totalTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.totalTaxQuarterly}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}

            {ruleSet?.ruleSet == "VacantRules1" && (
              <table className="border border-gray-300 min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border">SL</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border">Area (in Sq. Meter)</th>
                    <th className="px-3 py-2 border">Rental Rate</th>
                    <th className="px-3 py-2 border">Occupancy Factor</th>
                    <th className="px-3 py-2 border">Effect From</th>
                    <th className="px-3 py-2 border">Yearly Tax</th>
                    <th className="px-3 py-2 border">Holding Tax</th>
                    <th className="px-3 py-2 border">Water Tax</th>
                    <th className="px-3 py-2 border">Latrine Tax</th>
                    <th className="px-3 py-2 border">Education Cess</th>
                    <th className="px-3 py-2 border">Health Cess</th>
                    <th className="px-3 py-2 border">Total Tax</th>
                    <th className="px-3 py-2 border">Quarterly Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleSet.dTL.map((floor, index) => {
                    const isApplicable = true;
                    if (floor?.fyearTax?.length > 0) {
                      return (
                        <tr
                          key={index}
                          className={`border-b ${
                            isApplicable ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          <td className="px-3 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.floorName}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.calculateArea}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.rentalRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.occupancyRate}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.effectiveFromFYear}/{floor?.fromQtr}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.propertyTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.holdingTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.waterTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.latrineTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.educationCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.healthCessTax}
                          </td>
                          <td className="px-3 py-2 border font-semibold text-right">
                            {floor?.totalTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.totalTaxQuarterly}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}

            {ruleSet?.ruleSet == "VacantRules2" && (
              <table className="border border-gray-300 min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 border">SL</th>
                    <th className="px-3 py-2 border">Type</th>
                    <th className="px-3 py-2 border">Area (in Sq. Meter)</th>
                    <th className="px-3 py-2 border">Rental Rate</th>
                    <th className="px-3 py-2 border">Occupancy Factor</th>
                    <th className="px-3 py-2 border">Circle Rate</th>
                    <th className="px-3 py-2 border">
                      Buildup Area (in Sq. Ft)
                    </th>
                    <th className="px-3 py-2 border">Tax Percentage</th>
                    <th className="px-3 py-2 border">Matrix Factor</th>
                    <th className="px-3 py-2 border">Effect From</th>
                    <th className="px-3 py-2 border">Yearly Tax</th>
                    <th className="px-3 py-2 border">Holding Tax</th>
                    <th className="px-3 py-2 border">Water Tax</th>
                    <th className="px-3 py-2 border">Latrine Tax</th>
                    <th className="px-3 py-2 border">Education Cess</th>
                    <th className="px-3 py-2 border">Health Cess</th>
                    <th className="px-3 py-2 border">Total Tax</th>
                    <th className="px-3 py-2 border">Quarterly Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {ruleSet.dTL.map((floor, index) => {
                    const isApplicable = true;
                    if (floor?.fyearTax?.length > 0) {
                      return (
                        <tr
                          key={index}
                          className={`border-b ${
                            isApplicable ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          <td className="px-3 py-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.floorDtl?.floorName}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.calculateArea}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.rentalRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.occupancyRate}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.capitalValue}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.buildupArea}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.taxPercent}
                          </td>
                          <td className="px-3 py-2 border">
                            {floor?.matrixFactorRate}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.effectiveFromFYear}/{floor?.fromQtr}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.propertyTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.holdingTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.waterTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.latrineTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.educationCessTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.healthCessTax}
                          </td>
                          <td className="px-3 py-2 border font-semibold text-right">
                            {floor?.totalTax}
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {floor?.totalTaxQuarterly}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxViewTab;
