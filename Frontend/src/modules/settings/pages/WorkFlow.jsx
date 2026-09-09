import axios from "axios";
import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { wfActivateDeactivateApi, wfListApi } from "../../../api/endpoints";
import { Button, Spinner } from "@nextui-org/react";
import CommonTable from "../../../components/common/CommonTable";
import { FaEdit, FaLock, FaUnlock } from "react-icons/fa";
import PermissionWrapper from "../../../components/common/PermissionWrapper";
import WorkFlowAddEditModal from "../components/WorkFlowAddEditModal";

function WorkFlow() {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);

  const token = getToken();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        wfListApi,
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

  const itemLockUnlock = async (item) => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        wfActivateDeactivateApi,
        { id: item.id, lockStatus: !item.lockStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) fetchData();
    } catch (err) {
      console.error("Error updating lock status:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        wfListApi,
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

  useEffect(() => {
    if (token) fetchData();
  }, [page, itemsPerPage]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const openAddEditModal = (item) => {
    setSelectedItem(item);
    setIsAddEditModalOpen(true);
  };

  const closeAddEditModal = () => {
    setIsAddEditModalOpen(false);
    setSelectedItem(null);
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Workflow Name", key: "workflowName" },
    { label: "Module Name", key: "moduleName" },
    { label: "Action", key: "" },
  ];

  const renderRow = (item, index, currentPage, itemsPerPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * itemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item?.workflowName}</td>
      <td className="px-3 py-2 border text-red-600">
        {item.moduleName}{" "}
        {item?.roles?.length > 0 && (
          <table className="border border-gray-400 text-gray-500 text-xs table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 border border-gray-400">Sl No.</th>
                <th className="px-4 py-2 border border-gray-400">Roll</th>
                <th className="px-4 py-2 border border-gray-400">Backward</th>
                <th className="px-4 py-2 border border-gray-400">Forward</th>
              </tr>
            </thead>
            <tbody>
              {item?.roles?.map((val, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border border-gray-400">
                    {val?.serialNo}
                  </td>
                  <td className="px-4 py-2 border border-gray-400">
                    {val?.roleName}
                  </td>
                  <td className="px-4 py-2 border border-gray-400">
                    {val?.backwardRoleName}
                  </td>
                  <td className="px-4 py-2 border border-gray-400">
                    {val?.forwardRoleName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
      <td className="space-x-2 px-3 py-2 border">
        <>
          {!item?.lockStatus && (
            <Button
              size="sm"
              className="edit"
              onClick={() => openAddEditModal(item)}
            >
              <FaEdit className="mr-1" /> Edit
            </Button>
          )}
          <Button
            size="sm"
            className={`delete text-white ${
              item.lockStatus ? "bg-green-600" : "bg-red-600"
            }`}
            onClick={() => itemLockUnlock(item)}
          >
            {item.lockStatus ? (
              <>
                <FaUnlock className="mr-1" /> Unlock
              </>
            ) : (
              <>
                <FaLock className="mr-1" /> Lock
              </>
            )}
          </Button>
        </>
      </td>
    </tr>
  );
  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <PermissionWrapper>
          <CommonTable
            data={dataList}
            headers={headers}
            renderRow={renderRow}
            title="Workflow List"
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
            actionButton={
              <button
                className="bg-green-600 px-4 py-1 rounded text-white"
                onClick={() => openAddEditModal(null)}
              >
                Add Workflow
              </button>
            }
          />
          {isAddEditModalOpen && (
            <WorkFlowAddEditModal
              onClose={closeAddEditModal}
              item={selectedItem}
              onSuccess={fetchData}
            />
          )}
        </PermissionWrapper>
      )}
    </>
  );
}

export default WorkFlow;
