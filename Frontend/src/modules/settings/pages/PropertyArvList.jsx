import React, { useState, useEffect } from 'react';
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { getBuildingArvListApi } from '../../../api/endpoints';

function PropertyArvList() {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const token = getToken();

  useEffect(() => {
    if (token) fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        getBuildingArvListApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const list = res.data.data || [];
      setDataList(list);
    } catch (err) {
      console.error("Error fetching ARV rate list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXPORT TO EXCEL FUNCTION ---
  const exportToExcel = (periodBlock, index) => {
    const tableElement = document.getElementById(`arv-table-${index}`);
    if (!tableElement) return;

    // Create styled HTML for Excel to maintain border and merged header structure
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000000; text-align: center; padding: 6px; font-family: Arial, sans-serif; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .period-title { background-color: #d9d9d9; font-size: 16px; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <h3>${periodBlock.period || 'ARV Rate List'}</h3>
        ${tableElement.outerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ARV_Rate_List_${(periodBlock.period || `Block_${index + 1}`).replace(/[^a-zA-Z0-9]/g, '_')}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full p-4 bg-gray-50 min-h-screen">
      {isLoading ? (
        <div className="flex justify-center items-center py-10 w-full">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""} space-y-8`}>
          {dataList.map((periodBlock, blockIdx) => {
            const matrix = periodBlock.matrix || [];

            // Collect all unique road types across all zone rows
            const roadTypes = Array.from(
              new Set(
                matrix.flatMap((row) => Object.keys(row.roadTypes || {}))
              )
            );

            // Collect construction types map per road type
            const roadTypeStructure = {};
            roadTypes.forEach((road) => {
              const constructionTypes = Array.from(
                new Set(
                  matrix.flatMap((row) =>
                    Object.keys(row.roadTypes?.[road] || {})
                  )
                )
              );
              roadTypeStructure[road] = constructionTypes.length > 0 ? constructionTypes : ['RCC', 'ACC', 'OTHER'];
            });

            return (
              <div key={blockIdx} className="bg-white rounded border border-gray-400 shadow-sm overflow-hidden">
                {/* Period Title Bar with Export Button */}
                <div className="bg-gray-200 px-4 py-2 flex justify-between items-center border-b border-gray-400">
                  <span className="font-bold text-md text-gray-800">
                    {periodBlock.period || `Rate List Block ${blockIdx + 1}`}
                  </span>
                  
                  {/* EXPORT BUTTON */}
                  <button
                    onClick={() => exportToExcel(periodBlock, blockIdx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm10-9h-4v2h4v-2zm0 3h-4v2h4v-2z" />
                    </svg>
                    Export Excel
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table id={`arv-table-${blockIdx}`} className="w-full border-collapse border border-gray-400 text-xs text-center font-sans">
                    <thead>
                      {/* LEVEL 1: Road Types (MAIN ROAD, PRINCIPAL MAIN ROAD, etc.) */}
                      <tr className="bg-gray-100 uppercase font-bold text-gray-800">
                        <th className="border border-gray-400 px-3 py-2 w-20" rowSpan={3}>
                          Zone
                        </th>
                        {roadTypes.map((road, rIdx) => {
                          const cTypesCount = roadTypeStructure[road].length;
                          return (
                            <th
                              key={rIdx}
                              className="border border-gray-400 px-2 py-2 text-sm"
                              colSpan={cTypesCount * 2}
                            >
                              {road}
                            </th>
                          );
                        })}
                      </tr>

                      {/* LEVEL 2: Construction Types (RCC, ACC, OTHER) */}
                      <tr className="bg-gray-100 uppercase font-bold text-gray-700">
                        {roadTypes.map((road) =>
                          roadTypeStructure[road].map((cType, cIdx) => (
                            <th
                              key={cIdx}
                              className="border border-gray-400 px-2 py-1"
                              colSpan={2}
                            >
                              {cType}
                            </th>
                          ))
                        )}
                      </tr>

                      {/* LEVEL 3: Usage Types (RESS, COMM) */}
                      <tr className="bg-gray-50 uppercase text-gray-600 font-semibold">
                        {roadTypes.map((road) =>
                          roadTypeStructure[road].map((cType) => (
                            <React.Fragment key={`${road}-${cType}`}>
                              <th className="border border-gray-400 px-2 py-1 w-16">RESS</th>
                              <th className="border border-gray-400 px-2 py-1 w-16">COMM</th>
                            </React.Fragment>
                          ))
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {matrix.length > 0 ? (
                        matrix.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-blue-50/40 text-gray-800 font-medium">
                            {/* Zone Name / Number */}
                            <td className="border border-gray-400 px-2 py-2 font-semibold bg-gray-50 text-center">
                              {row.zone}
                            </td>

                            {/* Dynamically render values matching Road -> Construction -> Usage */}
                            {roadTypes.map((road) =>
                              roadTypeStructure[road].map((cType) => {
                                const rates = row.roadTypes?.[road]?.[cType] || {};
                                return (
                                  <React.Fragment key={`${road}-${cType}`}>
                                    <td className="border border-gray-400 px-2 py-2 text-center">
                                      {rates.Resident ?? "-"}
                                    </td>
                                    <td className="border border-gray-400 px-2 py-2 text-center">
                                      {rates.Commercial ?? "-"}
                                    </td>
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={100} className="border border-gray-400 py-6 text-gray-500">
                            No records available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PropertyArvList;