import React, { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { waterWardWiseConsumerApi } from "../../../api/endpoints";
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
        waterWardWiseConsumerApi,
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
  ];

  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">{index + 1}</td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">{item.totalConsumer}</td>
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
