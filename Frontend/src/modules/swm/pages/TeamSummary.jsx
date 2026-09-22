import React, { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import {
  swmTeamSummaryApi,
  tlListApi,
  tlTcListApi,
} from "../../../api/endpoints";
import CommonTable from "../../../components/common/CommonTable";
import Select from "react-select";

function TeamSummary() {
  const token = getToken();
  const [isFrozen, setIsFrozen] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [tlList, setTlList] = useState([]);
  const [tlId, setTlId] = useState(null);
  const [tcList, setTcList] = useState([]);
  const [tcId, setTcId] = useState([]);
  const [tcListLoading, setTcListLoading] = useState(false);
  const [summaryTotals,setSummaryTotals] = useState({});

  /** ---------------------------
   *   🔹 Filters
   * --------------------------- */
  const filters = useMemo(
    () => ({
      fromDate: fromDate || "",
      uptoDate: toDate || "",
      tlId,
      tcId,
    }),
    [fromDate, toDate, tlId, tcId]
  );

  /** ---------------------------
   *   🔹 Fetch TL List
   * --------------------------- */
  const fetchTLList = async () => {
    try {
      const response = await axios.post(
        tlListApi,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const users = response.data.data.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        setTlList(users);
      }
    } catch (error) {
      console.error("Error fetching TL list:", error);
    }
  };

  /** ---------------------------
   *   🔹 Fetch TC List
   * --------------------------- */
  const fetchTcList = async (tlId) => {
    if (!tlId) {
      setTcList([]);
      setTcId([]);
      return;
    }

    setTcListLoading(true);
    try {
      const response = await axios.post(
        tlTcListApi,
        { tlId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const users = response.data.data.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        setTcList(users);
      }
    } catch (error) {
      console.error("Error fetching TC list:", error);
    } finally {
      setTcListLoading(false);
    }
  };

  /** ---------------------------
   *   🔹 Fetch Team Summary
   * --------------------------- */
  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(swmTeamSummaryApi, filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDataList(res.data.data || []);
    } catch (err) {
      console.error("Error fetching team summary:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  /** ---------------------------
   *   🔹 Export All Data
   * --------------------------- */
  const fetchAllData = async () => {
    try {
      const res = await axios.post(swmTeamSummaryApi, filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.data || []);
    } catch (err) {
      console.error("Error fetching all data for export:", err);
      return [];
    }
  };

  /** ---------------------------
   *   🔹 Lifecycle
   * --------------------------- */
  useEffect(() => {
    if (token) fetchTLList();
  }, [token]);

  useEffect(() => {
    if (token && tlId) fetchTcList(tlId);
    else setTcList([]);
  }, [token, tlId]);

  useEffect(()=>{
    // add hear
  },[dataList]);


  useEffect(() => {
    if (dataList.length > 0) {
      const totals = dataList.reduce(
        (acc, item) => {
          return {
            amount: acc.amount + (parseFloat(item.amount) || 0),
            count: acc.count + (parseInt(item.count, 10) || 0),
          };
        },
        { amount: 0, count: 0 }
      );
      setSummaryTotals({...totals});
    }
  }, [dataList]);

  /** ---------------------------
   *   🔹 Handlers
   * --------------------------- */
  const handleSearch = () => fetchData();

  /** ---------------------------
   *   🔹 Table Headers & Rows
   * --------------------------- */
  const headers = [
    { label: "#", key: "serial" },
    { label: "Tax Collector", key: "name" },
    { label: "Ward No.", key: "permittedWard" },
    { label: "Total Consumer", key: "count" },
    { label: "Amount", key: "amount" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id || index} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.name}</td>
      <td className="px-3 py-2 border">{item.permittedWard}</td>
      <td className="px-3 py-2 border">{item.count}</td>
      <td className="px-3 py-2 border">{item.amount}</td>
    </tr>
  );

  const summaryHeader = (
    <div className="flex flex-wrap items-center gap-8 rounded-sm text-sm">
      <p className="text-gray-800 font-semibold">
        Total Consumer :{" "}
        <span className="text-green-700 font-bold">
          {summaryTotals?.count || 0}
        </span>
      </p>
      <p className="text-gray-800 font-semibold">
        Total Collection :{" "}
        <span className="text-green-700 font-bold">
          ₹ {summaryTotals?.amount?.toLocaleString() || 0}
        </span>
      </p>
    </div>
  );

  /** ---------------------------
   *   🔹 Filter Component
   * --------------------------- */
  const filterComponent = (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
      <div>
        <label className="block text-sm font-medium mb-1">From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-2 py-1 border rounded w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-2 py-1 border rounded w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Team Leader</label>
        <Select
          options={tlList}
          value={tlList.find((w) => w.value === tlId) || null}
          onChange={(selected) => setTlId(selected ? selected.value : null)}
          placeholder="Select TL..."
          isClearable
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Tax Collector</label>
        {tcListLoading ? (
          <div className="flex justify-center items-center h-10">
            <span className="inline-block w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></span>
            <span className="ml-2 text-blue-600 text-sm">Loading...</span>
          </div>
        ) : (
          <Select
            isMulti
            options={tcList}
            value={tcList.filter((opt) => tcId.includes(opt.value))}
            onChange={(selected) =>
              setTcId(selected ? selected.map((o) => o.value) : [])
            }
            placeholder="Select TC..."
            isClearable
          />
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`${
        isFrozen ? "pointer-events-none opacity-50" : ""
      } w-full space-y-4`}
    >
      <CommonTable
        data={dataList}
        headers={headers}
        renderRow={renderRow}
        summaryData={summaryHeader}
        title="Team Summary"
        isSearchInput={false}
        onSearch={handleSearch}
        fetchAllData={fetchAllData}
        filterComponent={filterComponent}
        isPaginator={false}
      />
    </div>
  );
}

export default TeamSummary;
