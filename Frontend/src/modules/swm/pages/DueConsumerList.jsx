import React, { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import {
    getWardListApi,
  swmDueConsumerApi
} from "../../../api/endpoints";
import CommonTable from "../../../components/common/CommonTable";
import Select from "react-select";
import { formatLocalDate } from "../../../utils/common";

const DueConsumer = () => {
  const token = getToken();
  const [isFrozen, setIsFrozen] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [summary,setSummary] = useState({});
  const [wardList, setWardList] = useState([]);
  
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  
  const [wardId, setWardId] = useState([]);

  /** ---------------------------
   *   🔹 Filters
   * --------------------------- */
  const filters = useMemo(
    () => ({
      wardId,
    }),
    [wardId]
  );

  useEffect(() => {
    if (token) fetchWardList();
  }, [token]);
  
  const fetchWardList = async () => {
    try {
      const response = await axios.get(getWardListApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: true },
      });
      if (response?.data?.status) {
        setWardList(response?.data?.data);
      }
    } catch (error) {
      console.error("Error fetching Ward list:", error);
    }
  };

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(swmDueConsumerApi, 
        {
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
          ...filters,
        }, 
        {
            headers: { Authorization: `Bearer ${token}` },
        });
      const list = res.data.data || {};
      setDataList(list.data || []);
      setSummary(list?.summary||{})
      setTotalPage(list.lastPage || 1);
      setTotalItem(list.total || 0);
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
      const res = await axios.post(swmDueConsumerApi, filters, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return (res.data.data || []);
    } catch (err) {
      console.error("Error fetching all data for export:", err);
      return [];
    }
  };

  const handleSearch = () => fetchData();

  /** ---------------------------
   *   🔹 Table Headers & Rows
   * --------------------------- */
  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "Consumer No.", key: "consumerNo" },
    { label: "Holding No.", key: "holdingNo" },
    { label: "Consumer Type", key: "categoryType" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Guardian Name", key: "guardianName" },
    { label: "Mobile No.", key: "mobileNo" },
    { label: "Address", key: "address" },
    { label: "From Date", key: "demandFrom" },
    { label: "Upto Date", key: "demandUpto" },
    { label: "Demand Amount", key: "totalTax" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id || index} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">{item.consumerNo}</td>
      <td className="px-3 py-2 border">{item.holdingNo}</td>
      <td className="px-3 py-2 border">{item.categoryType}</td>
      <td className="px-3 py-2 border">{item.ownerName}</td>
      <td className="px-3 py-2 border">{item.guardianName}</td>
      <td className="px-3 py-2 border">{item.mobileNo}</td>
      <td className="px-3 py-2 border">{item.address}</td>
      <td className="px-3 py-2 border">{formatLocalDate(item.demandFrom)}</td>
      <td className="px-3 py-2 border">{formatLocalDate(item.demandUpto)}</td>
      <td className="px-3 py-2 border">{item.totalTax}</td>
    </tr>
  );

  const summaryHeader = (
    <div className="flex flex-wrap items-center gap-8 rounded-sm text-sm">
      <p className="text-gray-800 font-semibold">
        Number of Consumer :{" "}
        <span className="text-green-700 font-bold">
          {summary?.totalConsumer || 0}
        </span>
      </p>
      <p className="text-gray-800 font-semibold">
        Total Demand :{" "}
        <span className="text-green-700 font-bold">
          ₹ {summary?.totalTax?.toLocaleString() || 0}
        </span>
      </p>
    </div>
  );



  /** -------------------------
   *   🔹 Filter Component
   * --------------------------- */
  const filterComponent = (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
      <div>
        <label className="block text-sm">Ward No.</label>
        <Select
          isMulti
          options={wardList.map((w) => ({ value: w.id, label: w.wardNo }))}
          value={wardList
            .filter((w) => wardId.includes(w.id))
            .map((w) => ({ value: w.id, label: w.wardNo }))}
          onChange={(selected) => setWardId(selected.map((opt) => opt.value))}
          placeholder="Select Ward(s)..."
        />
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
        title="Due Consumer List"
        isSearchInput={true}
        onSearch={handleSearch}
        fetchAllData={fetchAllData}
        filterComponent={filterComponent}
      />
    </div>
  );
}

export default DueConsumer;
