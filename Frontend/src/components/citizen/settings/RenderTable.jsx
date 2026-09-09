import React, { useEffect, useState } from "react";

function RenderTable({
  title = "",
  columns = [],
  data = [],
  renderRow = null,
  footerRow = null,
  searchable = true,
}) {
  const [filteredData, setFilteredData] = useState(data);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const keyword = searchInput.toLowerCase();
    const filtered = data.filter((item) =>
      Object.values(item).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(keyword)
      )
    );
    setFilteredData(filtered);
  }, [searchInput, data]);

  return (
    <div className="bg-white shadow-lg border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
        <h3 className="font-semibold text-white text-lg">{title}</h3>
        {searchable && (
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="text-sm rounded-md px-2 py-1 outline-none border border-blue-300 focus:ring-2 focus:ring-blue-400"
          />
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-left">
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 font-semibold border sticky top-0 bg-gray-100">
                  {col.label || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) =>
                renderRow ? (
                  renderRow(item, index)
                ) : (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {columns.map((col, i) => (
                      <td key={i} className="px-3 py-2">
                        {item[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-4 border text-gray-500 text-center"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
          {footerRow && <tfoot>{footerRow}</tfoot>}
        </table>
      </div>
    </div>
  );
}

export default RenderTable;
