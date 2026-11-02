import { useEffect, useState } from "react";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Spinner } from "@nextui-org/react";
import CommonTable from "../../../components/common/CommonTable";
import { safBTCListApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";

function BTCInbox() {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const token = getToken();

  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "SAF No.", key: "safNo" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Guardian Name", key: "guardianName" },
    { label: "Address", key: "propAddress" },
    {label: "Apply Date", key: "applyDate" },
     {label: "BTC  Date", key: "sendingDate" },
    {label: "Remarks", key: "remarks" },
    { label: "Action", key: "" },
  ];

  const renderRow = (item, index, currentPage, currentItemsPerPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * currentItemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item?.wardNo}</td>
      <td className="px-3 py-2 border text-red-600">{item?.safNo}</td>
      <td className="px-3 py-2 border">{item?.ownerName}</td>
      <td className="px-3 py-2 border">{item?.guardianName}</td>
      <td className="px-3 py-2 border">{item?.propAddress}</td>
      <td className="space-x-2 px-3 py-2 border">
        <Link
          to={`/saf/wf/btc/${item.id}`}
          className="inline-flex justify-center items-center text-blue-600 hover:text-blue-800"
          aria-label={`View SAF ${item?.safNo ?? ""}`}
        >
          <FaEye className="inline mr-1" />
        </Link>
      </td>
    </tr>
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        safBTCListApi,
        {
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDataList(response.data.data?.data || []);
      setTotalPage(response.data.data?.lastPage || 1);
      setTotalItem(response.data.data?.total || 1);
    } catch (error) {
      console.error("Error fetching SAF BTC list:", error);
      setDataList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [page, itemsPerPage]);

  const handleSearch = () => {
    setPage(1);
    if (page === 1) fetchData();
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        safBTCListApi,
        {
          page: 1,
          perPage: totalItem,
          key: search.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data?.data || [];
    } catch (error) {
      console.error("Error fetching SAF BTC list for export:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <Spinner />
  ) : (
    <CommonTable
      data={dataList}
      headers={headers}
      renderRow={renderRow}
      title="BTC List"
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
    />
  );
}

export default BTCInbox;
