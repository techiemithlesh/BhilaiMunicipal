import { useEffect, useMemo, useState } from "react";
import { formatLocalDate } from "../../../utils/common";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import {
  getWardListApi,
  userApi,
  waterPaymentModeListApi,
  waterCollectionApi,
} from "../../../api/endpoints";
import { Link } from "react-router-dom";
import CommonTable from "../../../components/common/CommonTable";
import { getToken } from "../../../utils/auth";
import Select from "react-select";

function CollectionReports() {
  const [dataList, setDataList] = useState([]);
  const [paymentModeList, setPaymentModeList] = useState([]);
  const [collectorList, setCollectorList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [wardId, setWardId] = useState([]);
  const [collector, setCollector] = useState([]);
  const [paymentMode, setPaymentMode] = useState([]);
  const [appType, setAppType] = useState(null);
  const [wardList, setWardList] = useState([]);
  const token = getToken();

  const appTypeOptions = useMemo(
    () => [
      { value: "APP", label: "Application" },
      { value: "CONSUMER", label: "Consumer" },
    ],
    []
  );

  const filters = useMemo(
    () => ({
      fromDate: fromDate || "",
      uptoDate: toDate || "",
      wardId,
      paymentMode,
      userId: collector,
      appType: appType || "",
    }),
    [fromDate, toDate, wardId, paymentMode, collector, appType]
  );

  const summaryLink = useMemo(() => {
    const params = new URLSearchParams();
    for (const key in filters) {
      const val = filters[key];
      if (Array.isArray(val)) {
        val.forEach((v) => params.append(`${key}[]`, v));
      } else {
        params.set(key, val);
      }
    }
    return `/water/consumer/report/payment/mode/summary?${params.toString()}`;
  }, [filters]);

  useEffect(() => {
    fetchPaymentMode();
  }, []);
  useEffect(() => {
    if (token) fetchUserList();
  }, [token]);
  useEffect(() => {
    if (token) fetchWardList();
  }, [token]);
  useEffect(() => {
    if (token) fetchData();
  }, [token, page, itemsPerPage]);

  const fetchPaymentMode = async () => {
    try {
      const response = await axios.post(waterPaymentModeListApi);
      if (response?.data?.status) {
        const modes = response.data.data.map((mode) => ({
          value: mode.paymentMode,
          label: mode.paymentMode,
        }));
        setPaymentModeList(modes);
      }
    } catch (error) {
      console.error("Error fetching payment modes:", error);
    }
  };

  const fetchUserList = async () => {
    try {
      const response = await axios.get(userApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: true },
      });
      if (response?.data?.status) {
        const users = response.data.data.map((item) => ({
          value: item.id,
          label: item.name,
        }));
        setCollectorList(users);
      }
    } catch (error) {
      console.error("Error fetching collector list:", error);
    }
  };

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
      const res = await axios.post(
        waterCollectionApi,
        {
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
          ...filters,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const list = res.data.data || {};
      setDataList(list.data || []);
      setTotalPage(list.lastPage || 1);
      setTotalItem(list.total || 0);
    } catch (err) {
      console.error("Error fetching collection report:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const res = await axios.post(
        waterCollectionApi,
        {
          page: 1,
          perPage: totalItem,
          key: search.trim() || null,
          ...filters,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return (res.data.data?.data || []).map((item) => ({
        ...item,
        fromUpto: `${item.fromFyear} (${item.fromQtr}) / ${item.uptoFyear} (${item.uptoQtr})`,
      }));
    } catch (err) {
      console.error("Error fetching all data for export:", err);
      return [];
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "Consumer No.", key: "consumerNo" },
    { label: "Application No.", key: "applicationNo" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Mobile No.", key: "mobileNo" },
    { label: "Tran. Date", key: "tranDate" },
    { label: "Mode", key: "paymentMode" },
    { label: "Amount", key: "payableAmt" },
    { label: "Collect By", key: "userName" },
    { label: "Tran. No.", key: "tranNo" },
    { label: "Check/DD No.", key: "chequeNo" },
    { label: "Bank Name", key: "bankName" },
    { label: "Branch Name", key: "branchName" },
    { label: "Action", key: "action" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">{item.consumerNo}</td>
      <td className="px-3 py-2 border">{item.applicationNo}</td>
      <td className="px-3 py-2 border">{item.ownerName}</td>
      <td className="px-3 py-2 border">{item.mobileNo}</td>
      <td className="px-3 py-2 border">{formatLocalDate(item.tranDate,'-')}</td>
      <td className="px-3 py-2 border">{item.paymentMode}</td>
      <td className="px-3 py-2 border">{item.payableAmt}</td>
      <td className="px-3 py-2 border">{item.userName}</td>
      <td className="px-3 py-2 border">{item.tranNo}</td>
      <td className="px-3 py-2 border">{item.chequeNo}</td>
      <td className="px-3 py-2 border">{item.bankName}</td>
      <td className="px-3 py-2 border">{item.branchName}</td>
      <td className="flex items-center gap-2 px-3 py-2 border">
        <Link
          to={
            item.consumerId
              ? `/water-consumer/payment-receipt/${item.id}`
              : `/water-app/payment-receipt/${item.id}`
          }
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
        >
          <FaEye className="w-5 h-5" />
        </Link>
      </td>
    </tr>
  );

  const filterComponent = (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
      <div>
        <label className="block text-sm">From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-2 py-1 border rounded w-full"
        />
      </div>
      <div>
        <label className="block text-sm">To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-2 py-1 border rounded w-full"
        />
      </div>
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
      <div>
        <label className="block text-sm">Payment Mode</label>
        <Select
          isMulti
          options={paymentModeList}
          value={paymentModeList.filter((opt) =>
            paymentMode.includes(opt.value)
          )}
          onChange={(opt) => setPaymentMode(opt.map((o) => o.value))}
          placeholder="Payment Mode"
        />
      </div>
      <div>
        <label className="block text-sm">Collector</label>
        <Select
          isMulti
          options={collectorList}
          value={collectorList.filter((opt) => collector.includes(opt.value))}
          onChange={(opt) => setCollector(opt.map((o) => o.value))}
          placeholder="Select Collector"
        />
      </div>
      <div>
        <label className="block text-sm">App Type</label>
        <Select
          options={appTypeOptions}
          value={appTypeOptions.find((opt) => opt.value === appType)}
          onChange={(opt) => setAppType(opt?.value ?? null)}
          isClearable
          placeholder="Select App Type"
        />
      </div>
    </div>
  );

  const links = (
    <div className="bg-blue-500 px-3 py-1 rounded text-white whitespace-nowrap">
      <Link to={summaryLink} target="_blank" className="hover:text-blue-800">
        Payment Mode Wise Summary
      </Link>
    </div>
  );

  return (
    <div
      className={`${
        isFrozen ? "pointer-events-none filter blur-sm" : ""
      } w-full space-y-4`}
    >
      <CommonTable
        data={dataList}
        headers={headers}
        renderRow={renderRow}
        title="Collection Report"
        totalPages={totalPage}
        currentPage={page}
        setPageNo={setPage}
        totalItem={totalItem}
        setItemsPerPage={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        isSearchInput={false}
        search={search}
        setSearch={setSearch}
        onSearch={handleSearch}
        fetchAllData={fetchAllData}
        filterComponent={filterComponent}
        links={links}
      />
    </div>
  );
}

export default CollectionReports;
