import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../utils/auth";
import {
  getFyearListApi,
  getWardListApi,
  waterWardWiseDCBApi,
} from "../../../api/endpoints";
import CommonTable from "../../../components/common/CommonTable";
import { Select, SelectItem } from "@nextui-org/react";
import { createSearchParams, Link, useNavigate } from "react-router-dom";

function WardWiseDcb() {
  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [wardId, setWardId] = useState([]);
  const [wardList, setWardList] = useState([]);
  const [fyear, setFyear] = useState("");
  const [fyearList, setFyearList] = useState([]);
  const token = getToken();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFyearList();
  }, []);
  useEffect(() => {
    if (token) fetchWardList();
  }, [token]);
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
        setFyearList(response?.data?.data || []);
        setFyear(response?.data?.data[0] || "");
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
        waterWardWiseDCBApi,
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
      setSummary(list.summary || {}); // ✅ fixed
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
        waterWardWiseDCBApi,
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
    { label: "Total Consumer", key: "totalConsumer" },
    { label: "Arrear Tax", key: "arrearTax" },
    { label: "Current Tax", key: "currentTax" },
    { label: "Total Tax", key: "totalTax" },
    { label: "Arrear Collection", key: "arrearCollection" },
    { label: "Current Collection", key: "currentCollection" },
    { label: "Total Collection", key: "totalCollection" },
    { label: "Total Penalty Collect", key: "totalPenalty" },
    { label: "Total Rebate Collect", key: "totalRebate" },
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
      <td className="px-3 py-2 border">
        <Link
          to={{
            pathname: "/water/consumer/report/consumer/wise/dcb",
            search: createSearchParams({
              "wardId[]": item?.id.toString(),
              fyear,
            }).toString(),
          }}
          state={{ wardId: item.id, fyear }}
          className="block hover:bg-gray-100 px-3 py-2 w-full h-full"
        >
          {item.wardNo}
        </Link>
      </td>
      <td className="px-3 py-2 border">{item.totalConsumer}</td>
      <td className="px-3 py-2 border">{item.arrearTax}</td>
      <td className="px-3 py-2 border">{item.currentTax}</td>
      <td className="px-3 py-2 border">{item.totalTax}</td>
      <td className="px-3 py-2 border">{item.arrearCollection}</td>
      <td className="px-3 py-2 border">{item.currentCollection}</td>
      <td className="px-3 py-2 border">{item.totalCollection}</td>
      <td className="px-3 py-2 border">{item.totalPenalty}</td>
      <td className="px-3 py-2 border">{item.totalRebate}</td>
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
    <tr className="bg-gray-200 font-bold">
      <td colSpan={2} className="px-3 py-2 border text-center">
        Total
      </td>
      <td className="px-3 py-2 border">{totals.totalConsumer}</td>
      <td className="px-3 py-2 border">{totals.arrearTax}</td>
      <td className="px-3 py-2 border">{totals.currentTax}</td>
      <td className="px-3 py-2 border">{totals.totalTax}</td>
      <td className="px-3 py-2 border">{totals.arrearCollection}</td>
      <td className="px-3 py-2 border">{totals.currentCollection}</td>
      <td className="px-3 py-2 border">{totals.totalCollection}</td>
      <td className="px-3 py-2 border">{totals.totalPenalty}</td>
      <td className="px-3 py-2 border">{totals.totalRebate}</td>
      <td className="px-3 py-2 border">{totals.arrearOutstanding}</td>
      <td className="px-3 py-2 border">{totals.currentOutstanding}</td>
      <td className="px-3 py-2 border">{totals.totalOutstanding}</td>
      <td className="px-3 py-2 border">{totals.advanceForThis}</td>
      <td className="px-3 py-2 border">{totals.totalCurrentAdvance}</td>
      <td className="px-3 py-2 border">{totals.totalCurrentAdjust}</td>
      <td className="px-3 py-2 border">{totals.totalOutstandingAdvance}</td>
    </tr>
  );

  const filterComponent = (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
      <div>
        <label className="block text-sm">Ward No.</label>
        <Select
          selectionMode="multiple"
          placeholder="Select Ward(s)..."
          selectedKeys={wardId.map(String)}
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
        <label className="block text-sm">F-Year</label>
        <Select
          placeholder="Select F-Year..."
          selectedKeys={fyear ? [fyear] : []}
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
        title="Ward Wise DCB"
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

export default WardWiseDcb;
