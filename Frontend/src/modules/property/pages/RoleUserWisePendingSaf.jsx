import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { getToken } from "../../../utils/auth";
import { levelUserWisePendingApi } from "../../../api/endpoints";
import { exportToExcel, exportToPdf } from "../../../utils/exportUtils";
import { Link, createSearchParams, useSearchParams } from "react-router-dom";

function RoleUserWisePendingSaf() {
  const [searchParams] = useSearchParams();
  const token = getToken();
  const resultRef = useRef();
  const today = new Date().toISOString().split("T")[0];

  const parseIds = (key) =>
    searchParams
      .getAll(key)
      .map((val) => Number(val))
      .filter(Boolean);

  const [dataList, setDataList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);

  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");
  const [wardId, setWardId] = useState(parseIds("wardId[]"));
  const [roleId, setRoleId] = useState(parseIds("roleId[]"));
  const [userId, setUserId] = useState(parseIds("userId[]"));

  const filters = useMemo(
    () => ({
      fromDate: fromDate || "",
      uptoDate: toDate || "",
      wardId,
      roleId,
      userId,
    }),
    [fromDate, toDate, wardId, roleId, userId]
  );

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(levelUserWisePendingApi, filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDataList(res.data.data || []);
    } catch (err) {
      console.error("Error fetching collection report:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { key: "slNo", label: "Sl No." },
      { key: "userName", label: "User Name" },
      { key: "totalSaf", label: "Total No of Saf(s)" },
      { key: "totalWard", label: "Total No of Ward(s)" },
    ];

    const rows = dataList.map((item, idx) => ({
      slNo: idx + 1,
      userName: item.name,
      totalSaf: item.totalSaf,
      totalWard: item.totalWard,
    }));

    exportToExcel("User_Wise_Pending_Form", [
      { title: "Pending Forms", columns, data: rows },
    ]);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center bg-blue-900 px-4 py-2 rounded-t-md font-semibold text-white text-sm">
        <span>User Wise Pending Form</span>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-xs"
          >
            Excel
          </button>
          <button
            onClick={() => exportToPdf(resultRef, `UserWisePending_${today}`)}
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
        <table
          ref={resultRef}
          className="w-full text-sm border-collapse table-auto"
        >
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border text-left">Sl No.</th>
              <th className="px-4 py-2 border text-left">User Name</th>
              <th className="px-4 py-2 border text-left">Total No of Saf(s)</th>
              <th className="px-4 py-2 border text-left">
                Total No of Ward(s)
              </th>
              <th className="px-4 py-2 border text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {dataList.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{idx + 1}</td>
                <td className="px-4 py-2 border">{item.name}</td>
                <td className="px-4 py-2 border">{item.totalSaf}</td>
                <td className="px-4 py-2 border">{item.totalWard}</td>
                <td className="px-4 py-2 border">
                  <Link
                    to={{
                      pathname: "/Property/report/level/user/pending",
                      search: createSearchParams({
                        "userId[]": item?.id?.toString() || "",
                        fromDate: fromDate,
                        toDate: toDate,
                        ...wardId.reduce((acc, id) => {
                          acc["wardId[]"] = acc["wardId[]"] || [];
                          acc["wardId[]"].push(id.toString());
                          return acc;
                        }, {}),
                        ...roleId.reduce((acc, id) => {
                          acc["roleId[]"] = acc["roleId[]"] || [];
                          acc["roleId[]"].push(id.toString());
                          return acc;
                        }, {}),
                      }).toString(),
                    }}
                    className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs"
                  >
                    View SAF
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

export default RoleUserWisePendingSaf;
