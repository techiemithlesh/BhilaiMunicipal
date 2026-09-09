import { useEffect, useState } from "react";
import { getLoginType, getToken } from "../../../utils/auth";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { tradeInboxApi } from "../../../api/endpoints";
import { Spinner } from "@nextui-org/react";
import CommonTable from "../../../components/common/CommonTable";
import AdminLayout from "../../../layout/AdminLayout";
import axios from "axios";

export default function TradeInbox() {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const token = getToken();
  const loginType = getLoginType();

  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "Application No.", key: "applicationNo" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Mobile Number", key: "mobileNo" },
    { label: "Guardian Name", key: "guardianName" },
    { label: "Address", key: "address" },
    { label: "Action", key: "" },
  ];

  const renderRow = (item, index, currentPage, itemsPerPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * itemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item?.wardNo}</td>
      <td className="px-3 py-2 border text-red-600">{item?.applicationNo}</td>
      <td className="px-3 py-2 border">{item.ownerName}</td>
      <td className="px-3 py-2 border">{item.mobileNo}</td>
      <td className="px-3 py-2 border">{item.guardianName}</td>
      <td className="px-3 py-2 border">{item.address}</td>
      <td className="space-x-2 px-3 py-2 border">
        <Link
          to={
            loginType == "mobile"
              ? `/mobile/saf/verification/${item?.id}`
              : `/trade/wf/inbox/${item.id}`
          }
          rel="noopener noreferrer"
          className="inline-flex justify-center items-center text-blue-600 hover:text-blue-800"
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
        tradeInboxApi,
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
      console.error("Error fetching menu list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [page, itemsPerPage]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        tradeInboxApi,
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
      console.error("Error fetching all menus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <CommonTable
            data={dataList}
            headers={headers}
            renderRow={renderRow}
            title="Inbox"
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
        </>
      )}
    </>
  );
}
