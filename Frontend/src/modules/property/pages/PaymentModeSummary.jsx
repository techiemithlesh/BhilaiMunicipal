import { useEffect, useState, useMemo, useRef } from "react";
import Select from "react-select";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { getToken } from "../../../utils/auth";
import {
  getWardListApi,
  propCollectionSummaryApi,
  userApi,
} from "../../../api/endpoints";
import { exportToExcel, exportToPdf } from "../../../utils/exportUtils";

const buildFilterQueryString = (obj) => {
  const params = new URLSearchParams();
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((val) => params.append(`${key}[]`, val));
    } else {
      params.set(key, obj[key] ?? "");
    }
  }
  return params.toString();
};

function PaymentModeSummary() {
  const token = getToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultRef = useRef();

  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(
    searchParams.get("fromDate") || today
  );
  const [toDate, setToDate] = useState(searchParams.get("uptoDate") || today);
  const [wardList, setWardList] = useState([]);
  const [collectorList, setCollectorList] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]);
  const [selectedCollectors, setSelectedCollectors] = useState([]);
  const [appType, setAppType] = useState(null);
  const [resultData, setResultData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const appTypeOptions = useMemo(
    () => [
      { value: "SAF", label: "SAF" },
      { value: "PROPERTY", label: "PROPERTY" },
    ],
    []
  );

  useEffect(() => {
    if (token) {
      fetchWardList();
      fetchUserList();
    }
  }, [token]);

  useEffect(() => {
    const app = searchParams.get("appType");
    if (app) {
      const found = appTypeOptions.find((a) => a.value === app);
      if (found) setAppType(found);
    }
  }, [searchParams, appTypeOptions]);

  useEffect(() => {
    if (searchParams.get("fromDate") && searchParams.get("uptoDate")) {
      handleSearch(false);
    }
  }, [searchParams]);

  const fetchWardList = async () => {
    try {
      const res = await axios.get(getWardListApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: true },
      });
      if (res?.data?.status) {
        const wards = res.data.data.map((w) => ({
          value: w.id,
          label: w.wardNo,
        }));
        setWardList(wards);
        const fromURL = searchParams.getAll("wardId[]");
        if (fromURL.length) {
          const selected = wards.filter((w) =>
            fromURL.includes(w.value.toString())
          );
          setSelectedWards(selected);
        }
      }
    } catch (err) {
      console.error("Ward list fetch error:", err);
    }
  };

  const fetchUserList = async () => {
    try {
      const res = await axios.get(userApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: true },
      });
      if (res?.data?.status) {
        const users = res.data.data.map((u) => ({
          value: u.id,
          label: u.name,
        }));
        setCollectorList(users);
        const fromURL = searchParams.getAll("userId[]");
        if (fromURL.length) {
          const selected = users.filter((u) =>
            fromURL.includes(u.value.toString())
          );
          setSelectedCollectors(selected);
        }
      }
    } catch (err) {
      console.error("Collector list fetch error:", err);
    }
  };

  const handleSearch = async (updateURL = true) => {
    const filters = {
      fromDate: fromDate || "",
      uptoDate: toDate || "",
      wardId: selectedWards.map((w) => w.value),
      userId: selectedCollectors.map((c) => c.value),
      appType: appType?.value || "",
    };

    if (updateURL) {
      setSearchParams(buildFilterQueryString(filters));
    }

    setIsFrozen(true);
    setIsLoading(true);
    try {
      const res = await axios.post(propCollectionSummaryApi, filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResultData(res.data?.data || {});
    } catch (err) {
      console.error("Fetch summary error:", err);
    } finally {
      setIsLoading(false);
      setIsFrozen(false);
    }
  };

  const renderSummarySection = (title, dataArray) => (
    <div className="mb-6 border rounded-md overflow-hidden">
      <div className="bg-gray-200 px-4 py-2 font-bold">{title}</div>
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border text-left">Payment Mode</th>
            <th className="px-4 py-2 border text-left">Count</th>
            <th className="px-4 py-2 border text-left">Amount</th>
          </tr>
        </thead>
        <tbody>
          {dataArray?.length > 0 ? (
            dataArray.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{item.paymentMode}</td>
                <td className="px-4 py-2 border">{item.count}</td>
                <td className="px-4 py-2 border">{item.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-2 border" colSpan={3}>
                No data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const handleExcelExport = () => {
    const columns = [
      { key: "paymentMode", label: "Payment Mode" },
      { key: "count", label: "Count" },
      { key: "amount", label: "Amount" },
    ];

    const allSheets = [
      { title: "Total Collection", columns, data: resultData?.totalTran || [] },
      {
        title: "Total Refund/Cancellation",
        columns,
        data: resultData?.totalRefund || [],
      },
      {
        title: "Net Collection",
        columns,
        data: resultData?.netCollection ? [resultData.netCollection] : [],
      },
      { title: "Door to Door", columns, data: resultData?.doorToDoor || [] },
    ];

    exportToExcel(`Payment_Mode_Summary_${today}`, allSheets);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="bg-purple-100 shadow px-4 py-2 rounded font-bold text-lg">
        Payment Mode Wise Summary
      </div>

      <div className="items-end gap-4 grid grid-cols-1 md:grid-cols-6">
        {/* Filters */}
        <div>
          <label className="font-medium text-sm">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 border rounded w-full"
          />
        </div>
        <div>
          <label className="font-medium text-sm">Upto Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 border rounded w-full"
          />
        </div>
        <div>
          <label className="font-medium text-sm">Ward No.</label>
          <Select
            isMulti
            options={wardList}
            value={selectedWards}
            onChange={setSelectedWards}
            placeholder="Select Ward(s)"
            className="text-sm"
          />
        </div>
        <div>
          <label className="font-medium text-sm">Collector</label>
          <Select
            isMulti
            options={collectorList}
            value={selectedCollectors}
            onChange={setSelectedCollectors}
            placeholder="Select Collector(s)"
            className="text-sm"
          />
        </div>
        <div>
          <label className="font-medium text-sm">App Type</label>
          <Select
            options={appTypeOptions}
            value={appType}
            onChange={setAppType}
            isClearable
            placeholder="Select App Type"
            className="text-sm"
          />
        </div>
        <div>
          <button
            onClick={() => handleSearch(true)}
            className="bg-black hover:bg-gray-800 px-4 py-2 rounded w-full text-white"
          >
            {isLoading ? "Loading..." : "SEARCH"}
          </button>
        </div>
      </div>

      <div
        ref={resultRef}
        className="bg-white shadow mb-6 border border-blue-800 rounded-xl"
      >
        <div className="flex justify-between items-center bg-blue-900 px-4 py-2 rounded-t-md font-semibold text-white text-sm">
          <span>Result</span>
          <div className="flex gap-2">
            <button
              onClick={handleExcelExport}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-xs"
            >
              Excel
            </button>
            <button
              onClick={() =>
                exportToPdf(resultRef, `Payment_Mode_Summary_${today}`)
              }
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs"
            >
              Print
            </button>
          </div>
        </div>
        <div
          className={`${
            isFrozen ? "pointer-events-none filter blur-sm" : ""
          } p-4 space-y-2 overflow-x-auto border`}
        >
          <div className="gap-x-12 gap-y-2 grid grid-cols-1 md:grid-cols-2 text-sm">
            {renderSummarySection(
              "Total Collection",
              resultData?.totalTran || []
            )}
            {renderSummarySection(
              "Total Refund/Cancellation",
              resultData?.totalRefund || []
            )}
            {renderSummarySection(
              "Net Collection",
              resultData?.netCollection ? [resultData.netCollection] : []
            )}
            {renderSummarySection("Door to Door", resultData?.doorToDoor || [])}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModeSummary;
