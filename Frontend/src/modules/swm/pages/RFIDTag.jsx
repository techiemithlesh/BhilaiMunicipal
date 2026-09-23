import React, { useEffect, useMemo, useState } from "react";
import { getToken } from "../../../utils/auth";
import { Link, useSearchParams } from "react-router-dom";
import CommonTable from "../../../components/common/CommonTable";
import axios from "axios";
import { getWardListApi, swmRfidListApi } from "../../../api/endpoints";
import { FaEye } from "react-icons/fa";
import Select from "react-select";

function RFIDTag() {
  const token = getToken();
  const [searchParams] = useSearchParams();

  const [wardId, setWardId] = useState(
    searchParams.get("wardId")
      ? searchParams.get("wardId").split(",").map(Number)
      : []
  );

  const [wardList, setWardList] = useState([]);
  const [dataList, setDataList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);

  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const rawValue = searchParams.get("isRfIdMap");

  const [formData, setFormData] = useState({
    isRfIdMap: rawValue !== null ? JSON.parse(rawValue):null, // true / false / null
  });

  // -----------------------------------------
  // Fetch Ward List
  // -----------------------------------------
  useEffect(() => {
    if (!token) return;

    const fetchWardList = async () => {
      try {
        const { data } = await axios.get(getWardListApi, {
          headers: { Authorization: `Bearer ${token}` },
          params: { all: true },
        });

        if (data?.status) setWardList(data.data);
      } catch (error) {
        console.error("Error fetching Ward list:", error);
      }
    };

    fetchWardList();
  }, [token]);

  // -----------------------------------------
  // Fetch Table Data
  // -----------------------------------------
  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, page, itemsPerPage, formData]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const { data } = await axios.post(
        swmRfidListApi,
        {
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
          wardId: wardId.length ? wardId : null,
          ...formData,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = data.data || {};
      setDataList(list.data || []);
      setTotalPage(list.lastPage || 1);
      setTotalItem(list.total || 0);
    } catch (err) {
      console.error("Error fetching RFID list:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const { data } = await axios.post(
        swmRfidListApi,
        {
          page: 1,
          perPage: totalItem,
          key: search.trim() || null,
          wardId: wardId.length ? wardId : null,
          ...formData,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.data?.data || [];
    } catch (err) {
      console.error("Error fetching all data:", err);
      return [];
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  // -----------------------------------------
  // Memoized Ward Options
  // -----------------------------------------
  const wardOptions = useMemo(
    () =>
      wardList.map((w) => ({
        value: w.id,
        label: w.wardNo,
      })),
    [wardList]
  );

  // -----------------------------------------
  // Table Headers & Rows
  // -----------------------------------------
  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "Consumer No.", key: "consumerNo" },
    { label: "Holding No.", key: "holdingNo" },
    { label: "RFID No.", key: "rfId" },
    { label: "Install By", key: "installBy" },
    { label: "Installation Date", key: "rfIdInstallDate" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Mobile No.", key: "mobileNo" },
    { label: "Address", key: "address" },
    { label: "Action", key: "action" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id} className="hover:bg-gray-100">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">{item.consumerNo}</td>
      <td className="px-3 py-2 border">{item.holdingNo}</td>
      <td className="px-3 py-2 border">{item.rfId}</td>
      <td className="px-3 py-2 border">{item.installBy}</td>
      <td className="px-3 py-2 border">{item.rfIdInstallDate}</td>
      <td className="px-3 py-2 border">{item.ownerName}</td>
      <td className="px-3 py-2 border">{item.mobileNo}</td>
      <td className="px-3 py-2 border">{item.address}</td>

      <td className="px-3 py-2 border text-center">
        <Link
          to={`/swm/dtl/${item.id}`}
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
        >
          <FaEye size={18} />
        </Link>
      </td>
    </tr>
  );

  // -----------------------------------------
  // Filters UI
  // -----------------------------------------
  const filterComponent = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Ward Filter */}
      <div>
        <label className="block text-sm mb-1 font-medium">Ward No.</label>
        <Select
          isMulti
          options={wardOptions}
          value={wardOptions.filter((opt) => wardId.includes(opt.value))}
          onChange={(selected) =>
            setWardId(selected.map((opt) => opt.value))
          }
          placeholder="Select Ward(s)..."
        />
      </div>
      {/* RFID Mapped Filter */}
      <div>
        <label className="block text-sm mb-1 font-medium">Is RFID Mapped</label>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="rfidMapped"
              checked={formData.isRfIdMap === true}
              onChange={() =>
                setFormData((prev) => ({ ...prev, isRfIdMap: true }))
              }
            />
            Yes
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="rfidMapped"
              checked={formData.isRfIdMap === false}
              onChange={() =>
                setFormData((prev) => ({ ...prev, isRfIdMap: false }))
              }
            />
            No
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="rfidMapped"
              checked={formData.isRfIdMap === null}
              onChange={() =>
                setFormData((prev) => ({ ...prev, isRfIdMap: null }))
              }
            />
            All
          </label>
        </div>
      </div>
    </div>
  );

  // -----------------------------------------
  // Render
  // -----------------------------------------
  return (
    <div className={`${isFrozen ? "pointer-events-none opacity-50" : ""} w-full`}>
      <CommonTable
        title="RFID Tag List"
        data={dataList}
        headers={headers}
        renderRow={renderRow}
        totalPages={totalPage}
        currentPage={page}
        setPageNo={setPage}
        totalItem={totalItem}
        setItemsPerPage={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        search={search}
        setSearch={setSearch}
        onSearch={handleSearch}
        fetchAllData={fetchAllData}
        filterComponent={filterComponent}
      />
    </div>
  );
}

export default RFIDTag;
