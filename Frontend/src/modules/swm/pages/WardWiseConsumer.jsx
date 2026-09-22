import React, { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { swmWardWiseConsumerApi } from "../../../api/endpoints";
import DataTableFullData from "../../../components/common/DataTableFullData";

function WardWiseConsumer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = getToken();

  const [dataList, setDataList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [allUserList, setAllUserList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [wardList, setWardList] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);

  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        swmWardWiseConsumerApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        setDataList(response?.data?.data);
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "Total Consumer", key: "totalConsumer" },
    { label: "RFID Install Consumer", key: "totalRfIdConsumer" },
    { label: "RFID Not Install Consumer", key: "totalNotRfIdConsumer" },
  ];

  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">{index + 1}</td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">
        <Link
          to={`/swm/report/rf-id?wardId=${item?.id}`}
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
        >
          {item.totalConsumer}
        </Link>
      </td>
      <td className="px-3 py-2 border">
        <Link
          to={`/swm/report/rf-id?wardId=${item?.id}&isRfIdMap=true`}
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
        >
          {item.totalRfIdConsumer}
        </Link>
      </td>
      <td className="px-3 py-2 border">
        <Link
          to={`/swm/report/rf-id?wardId=${item?.id} &isRfIdMap=false`}
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
        >
          {item.totalNotRfIdConsumer}
        </Link>
      </td>
    </tr>
  );

  return (
    <div
      className={`${
        isFrozen ? "pointer-events-none filter blur-sm" : ""
      } w-full space-y-4`}
    >
      <DataTableFullData
        isExport={true}
        title="Ward Wise Consumer"
        headers={headers}
        renderRow={renderRow}
        data={dataList}
        startingItemsPerPage={10}
        showingItem={[10, 15, 50, 100, 500, 1000]}
      />
    </div>
  );
}

export default WardWiseConsumer;
