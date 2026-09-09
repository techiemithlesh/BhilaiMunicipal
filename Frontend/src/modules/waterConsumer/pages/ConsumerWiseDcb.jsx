import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import {
  getFyearListApi,
  getWardListApi,
  waterConsumerWiseDCBApi,
} from "../../../api/endpoints";
import CommonTable from "../../../components/common/CommonTable";
import { Select, SelectItem } from "@nextui-org/react";

function ConsumerWiseDcb() {
  const [searchParams] = useSearchParams();

  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [wardId, setWardId] = useState(
    searchParams.getAll("wardId[]").map(Number) || []
  );
  const [wardList, setWardList] = useState([]);
  const [fyear, setFyear] = useState(searchParams.get("fyear") || "");
  const [fyearList, setFyearList] = useState([]);
  const token = getToken();

  // load fyear list
  useEffect(() => {
    fetchFyearList();
  }, []);

  // load ward list
  useEffect(() => {
    if (token) fetchWardList();
  }, [token]);

  // load table data
  useEffect(() => {
    if (token) fetchData();
  }, [token, page, itemsPerPage]);

  const filters = useMemo(
    () => ({
      fyear: fyear || "",
      wardId,
    }),
    [fyear, wardId]
  );

  const fetchFyearList = async () => {
    try {
      const response = await axios.get(getFyearListApi);
      if (response?.data?.status) {
        const list = response?.data?.data || [];
        setFyearList(list);
        if (!fyear && list.length > 0) {
          setFyear(String(list[0])); // default to first fyear
        }
      }
    } catch (error) {
      console.error("Error fetching Fyear list:", error);
    }
  };

  const fetchWardList = async () => {
    try {
      const response = await axios.get(getWardListApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: true },
      });
      if (response?.data?.status) {
        setWardList(response?.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching Ward list:", error);
    }
  };

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(
        waterConsumerWiseDCBApi,
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

      const list = res?.data?.data || {};
      setDataList(list.data || []);
      setSummary(list.summary || {});
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
        waterConsumerWiseDCBApi,
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
      return (res?.data?.data?.data || []).map((item) => ({
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
    { label: "Consumer No", key: "consumerNo" },
    { label: "Property Type", key: "propertyType" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Mobile No", key: "mobileNo" },
    { label: "Address", key: "address" },
    { label: "Arrear Tax", key: "arrearTax" },
    { label: "Current Tax", key: "currentTax" },
    { label: "Total Tax", key: "totalTax" },
    { label: "Arrear Collection", key: "arrearCollection" },
    { label: "Current Collection", key: "currentCollection" },
    { label: "Total Collection", key: "totalCollection" },
    { label: "Arrear Balance", key: "arrearOutstanding" },
    { label: "Current Balance", key: "currentOutstanding" },
    { label: "Total Balance", key: "totalOutstanding" },
    { label: "Advance For This", key: "advanceForThis" },
    { label: "Total Current Advance", key: "totalCurrentAdvance" },
    { label: "Total Current Adjustment", key: "totalCurrentAdjust" },
    { label: "Total Balance Advance", key: "totalOutstandingAdvance" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">{item.consumerNo}</td>
      <td className="px-3 py-2 border">{item.propertyType}</td>
      <td className="px-3 py-2 border">{item.ownerName}</td>
      <td className="px-3 py-2 border">{item.mobileNo}</td>
      <td className="px-3 py-2 border">{item.address}</td>
      <td className="px-3 py-2 border">{item.arrearTax}</td>
      <td className="px-3 py-2 border">{item.currentTax}</td>
      <td className="px-3 py-2 border">{item.totalTax}</td>
      <td className="px-3 py-2 border">{item.arrearCollection}</td>
      <td className="px-3 py-2 border">{item.currentCollection}</td>
      <td className="px-3 py-2 border">{item.totalCollection}</td>
      <td className="px-3 py-2 border">{item.arrearOutstanding}</td>
      <td className="px-3 py-2 border">{item.currentOutstanding}</td>
      <td className="px-3 py-2 border">{item.totalOutstanding}</td>
      <td className="px-3 py-2 border">{item.advanceForThis}</td>
      <td className="px-3 py-2 border">{item.totalCurrentAdvance}</td>
      <td className="px-3 py-2 border">{item.totalCurrentAdjust}</td>
      <td className="px-3 py-2 border">{item.totalOutstandingAdvance}</td>
    </tr>
  );

  const renderFooter = (totals) => (
    <tr className="bg-gray-200 border-t font-bold">
      <td colSpan={6} className="px-3 py-2 border text-center">
        Total
      </td>
      <td className="px-3 py-2 border">{totals.totalConsumer}</td>
      <td className="px-3 py-2 border">{totals.totalArrearTax}</td>
      <td className="px-3 py-2 border">{totals.totalCurrentTax}</td>
      <td className="px-3 py-2 border">{totals.totalTax}</td>
      <td className="px-3 py-2 border">{totals.totalArrearCollection}</td>
      <td className="px-3 py-2 border">{totals.totalCurrentCollection}</td>
      <td className="px-3 py-2 border">{totals.totalCollection}</td>
      <td className="px-3 py-2 border">{totals.totalArrearOutstanding}</td>
      <td className="px-3 py-2 border">{totals.totalCurrentOutstanding}</td>
      <td className="px-3 py-2 border">{totals.grandTotalOutstanding}</td>
      <td className="px-3 py-2 border">{totals.totalAdvanceForThis}</td>
      <td className="px-3 py-2 border">{totals.grandTotalCurrentAdvance}</td>
      <td className="px-3 py-2 border">{totals.grandTotalCurrentAdjust}</td>
      <td className="px-3 py-2 border">
        {totals.totalGrandOutstandingAdvance}
      </td>
    </tr>
  );

  const filterComponent = (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
      <div>
        <label className="block mb-1 text-sm">Ward No.</label>
        <Select
          selectionMode="multiple"
          placeholder="Select Ward(s)..."
          selectedKeys={new Set(wardId.map(String))}
          onSelectionChange={(keys) => setWardId([...keys].map(Number))}
        >
          {wardList.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.wardNo}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div>
        <label className="block mb-1 text-sm">F-Year</label>
        <Select
          placeholder="Select F-Year..."
          selectedKeys={fyear ? new Set([String(fyear)]) : new Set([])}
          onSelectionChange={(keys) => setFyear([...keys][0] || "")}
        >
          {fyearList.map((fy) => (
            <SelectItem key={fy} value={fy}>
              {fy}
            </SelectItem>
          ))}
        </Select>
      </div>
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
        footerRow={renderFooter(summary)}
        title="Holding Wise DCB"
        totalPages={totalPage}
        currentPage={page}
        setPageNo={setPage}
        totalItem={totalItem}
        setItemsPerPage={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        isSearchInput={true}
        search={search}
        setSearch={setSearch}
        onSearch={handleSearch}
        fetchAllData={fetchAllData}
        filterComponent={filterComponent}
      />
    </div>
  );
}

export default ConsumerWiseDcb
