import { useEffect, useRef, useState } from "react";
import { getToken } from "../../../utils/auth";
import { roleWisePendingApi } from "../../../api/endpoints";
import axios from "axios";
import { exportToExcel, exportToPdf } from "../../../utils/exportUtils";
import { createSearchParams, Link } from "react-router-dom";

function LevelWisePendingSaf() {
  const [dataList, setDataList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const token = getToken();
  const resultRef = useRef();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(
        roleWisePendingApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const list = res.data.data || [];
      setDataList(list || []);
    } catch (err) {
      console.error("Error fetching collection report:", err);
    } finally {
      setIsFrozen(false);
    }
  };
  const handleExport = () => {
    const columns = [
      { key: "slNo", label: "Sl No." },
      { key: "level", label: "Level" },
      { key: "totalUser", label: "Total User" },
      { key: "count", label: "Total No of Form(s)" },
    ];

    const rows = dataList.map((item, idx) => ({
      slNo: idx + 1,
      level: item.roleName,
      totalUser: item.totalUser,
      count: item.totalSaf,
    }));

    exportToExcel("Level_Wise_Pending_Form", [
      { title: "Pending Forms", columns, data: rows },
    ]);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-blue-900 px-4 py-2 rounded-t-md font-semibold text-white text-sm">
        <span>Level Wise Pending Form</span>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-xs"
          >
            Excel
          </button>
          <button
            onClick={() => exportToPdf(resultRef, `LevelWisePending_${today}`)}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs"
          >
            Print
          </button>
        </div>
      </div>

      <div
        className={`${
          isFrozen ? "pointer-events-none filter blur-sm" : ""
        } overflow-x-auto border border-blue-900 rounded-b-md`}
      >
        <table ref={resultRef} className="w-full text-sm table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border text-left">Sl No.</th>
              <th className="px-4 py-2 border text-left">Level</th>
              <th className="px-4 py-2 border text-left">Total No of User</th>
              <th className="px-4 py-2 border text-left">
                Total No of Form(s)
              </th>
              <th className="px-4 py-2 border text-left">SAF Wise</th>
              <th className="px-4 py-2 border text-left">Employee Wise</th>
            </tr>
          </thead>
          <tbody>
            {dataList.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{idx + 1}</td>
                <td className="px-4 py-2 border">{item.roleName}</td>
                <td className="px-4 py-2 border">{item.totalUser}</td>
                <td className="px-4 py-2 border">{item.totalSaf}</td>
                <td className="px-4 py-2 border">
                  <Link
                    to={{
                      pathname: "/Property/report/level/user/pending",
                      search: createSearchParams({
                        "roleId[]": item?.id.toString(), // Or pass multiple like: ["1", "2"]
                      }).toString(),
                    }}
                    className="bg-blue-500 px-3 py-1 rounded text-white hover:text-blue-800 text-xs whitespace-nowrap"
                  >
                    View SAF Wise Details
                  </Link>
                </td>
                <td className="px-4 py-2 border">
                  <Link
                    to={{
                      pathname: "/Property/report/level/user/wise/pending",
                      search: createSearchParams({
                        "roleId[]": item?.id.toString(), // Or pass multiple like: ["1", "2"]
                      }).toString(),
                    }}
                    className="bg-black hover:bg-blue-800 px-2 py-1 rounded text-white text-xs whitespace-nowrap transition"
                  >
                    View Employee Wise Details
                  </Link>
                </td>
              </tr>
            ))}
            {dataList.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="py-2 border text-gray-500 text-center"
                >
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LevelWisePendingSaf;
