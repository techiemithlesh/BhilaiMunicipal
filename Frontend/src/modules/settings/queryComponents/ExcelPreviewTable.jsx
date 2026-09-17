import React from "react";

export default function ExcelPreviewTable({ cardsConfig }) {
  console.log("cardsConfig", cardsConfig);

  // 1. Calculate how many child rows are needed (matches the maximum columns in non-parent cards)
  const childCards = cardsConfig.filter((card) => card.type !== "parent");
  const maxChildRows = childCards.length > 0
    ? Math.max(...childCards.map((c) => c.columns?.length || 0))
    : 1;

  // Generate an array for the number of rows needed (minimum 1 row)
  const rowIndices = Array.from({ length: Math.max(maxChildRows, 1) }, (_, i) => i);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border">
      <h4 className="text-xs font-bold text-gray-600 uppercase mb-3">
        2. Generated Flattened Layout Preview
      </h4>
      <div className="overflow-x-auto border rounded max-h-64">
        <table className="w-full text-left text-xs border-collapse">
          {/* Row 1: Meta Headers (Card Level) */}
          <thead className="bg-slate-800 text-white">
            <tr>
              {cardsConfig.map((card, cardIdx) => (
                <th
                  key={card.cardId || cardIdx}
                  colSpan={card.columns?.length || 1}
                  className="border border-slate-700 px-3 py-2 text-center whitespace-nowrap"
                >
                  <div className="text-[10px] text-indigo-300 font-bold uppercase">
                    {card.metaHeader || card.title || `SECTION ${cardIdx + 1}`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Row 2: Sub-Meta Headers (Card Level) */}
          <thead className="bg-slate-700 text-gray-200">
            <tr>
              {cardsConfig.map((card, cardIdx) => (
                <th
                  key={card.cardId || cardIdx}
                  colSpan={card.columns?.length || 1}
                  className="border border-slate-600 px-3 py-1 text-center whitespace-nowrap text-[10px] font-semibold"
                >
                  {card.subMetaHeader || "Details"}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body: Repeats rows for non-parent cards */}
          <tbody>
            {rowIndices.map((rowIndex) => (
              <tr key={rowIndex} className="bg-gray-50 font-medium">
                {cardsConfig.map((card, cardIdx) => {
                  const hasColumns = card.columns && card.columns.length > 0;

                  // PARENT CARD: Render once on first row and span across all child rows
                  if (card.type === "parent") {
                    if (rowIndex !== 0) return null; // Skip rendering on subsequent rows

                    return hasColumns ? (
                      card.columns.map((column, colIdx) => (
                        <td
                          key={`parent-${card.cardId || cardIdx}-${colIdx}`}
                          rowSpan={rowIndices.length}
                          className="border px-3 py-2 whitespace-nowrap text-gray-800 align-top bg-white"
                        >
                          {column.label || column.key || "—"}
                        </td>
                      ))
                    ) : (
                      <td
                        key={`parent-empty-${card.cardId || cardIdx}`}
                        rowSpan={rowIndices.length}
                        className="border px-3 py-2 text-gray-400 italic text-center align-top bg-white"
                      >
                        No Columns
                      </td>
                    );
                  }

                  // NON-PARENT (CHILD) CARD: Repeat row cells per column item
                  return hasColumns ? (
                    card.columns.map((column, colIdx) => (
                      <td
                        key={`child-${rowIndex}-${card.cardId || cardIdx}-${colIdx}`}
                        className="border px-3 py-2 whitespace-nowrap text-gray-800"
                      >
                        {/* Display corresponding column info per repeated row */}
                        {column.label}
                      </td>
                    ))
                  ) : (
                    <td
                      key={`child-empty-${rowIndex}-${card.cardId || cardIdx}`}
                      className="border px-3 py-2 text-gray-400 italic text-center"
                    >
                      No Columns
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}