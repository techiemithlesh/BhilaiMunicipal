import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import { Button, Spinner } from "@nextui-org/react";
import { FaCheck, FaEdit, FaLock, FaTimes, FaUnlock } from "react-icons/fa";
import PermissionWrapper from "../../../components/common/PermissionWrapper";
import CommonTable from "../../../components/common/CommonTable";
import {
  RoleModuleListApi,
  RoleModuleLockUnlockApi,
} from "../../../api/endpoints";
import RolePermissionAddEditModal from "../components/RolePermissionAddEditModal";

function RolePermission() {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const token = getToken();

  useEffect(() => {
    if (token) fetchData();
  }, [page, itemsPerPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        RoleModuleListApi,
        {
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
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
      console.error("Error fetching floor type list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const res = await axios.post(
        RoleModuleListApi,
        {
          page: 1,
          perPage: totalItem,
          key: search.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data.data?.data || [];
    } catch (err) {
      console.error("Error fetching all occupancy types:", err);
      return [];
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const itemLockUnlock = async (item) => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        RoleModuleLockUnlockApi,
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

  const openAddEditModal = (item) => {
    setSelectedItem(item);
    setIsAddEditModalOpen(true);
  };

  const closeAddEditModal = () => {
    setSelectedItem(null);
    setIsAddEditModalOpen(false);
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Role Name", key: "roleName" },
    { label: "Module", key: "moduleName" },
    { label: "CanDocUpload", key: "canDocUpload" },
    { label: "canDocVerify", key: "canDocVerify" },
    { label: "canAdd", key: "canAdd" },
    { label: "canAppEdit", key: "canAppEdit" },
    { label: "canAppLock", key: "canAppLock" },
    { label: "canAppUnlock", key: "canAppUnlock" },
    { label: "canTakePayment", key: "canTakePayment" },
    { label: "canGenerateNotice", key: "canGenerateNotice" },
    { label: "canGenerateDemand", key: "canGenerateDemand" },
    { label: "canMeterChange", key: "canMeterChange" },
    { label: "canCashVerify", key: "canCashVerify" },
    { label: "canChequeStatusVerify", key: "canChequeStatusVerify" },
    { label: "canPaymentModeUpdate", key: "canPaymentModeUpdate" },
    { label: "canTranDeactivate", key: "canTranDeactivate" },
    { label: "Action", key: "action" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.roleName}</td>
      <td className="px-3 py-2 border">{item.moduleName}</td>
      <td className="px-3 py-2 border">
        {item.canDocUpload ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canDocVerify ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canAdd ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canAppEdit ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canAppLock ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canAppUnlock ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canTakePayment ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canGenerateNotice ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canGenerateDemand ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canMeterChange ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canCashVerify ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canChequeStatusVerify ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canPaymentModeUpdate ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>
      <td className="px-3 py-2 border">
        {item.canTranDeactivate ? (
          <FaCheck className="text-green-600" />
        ) : (
          <FaTimes className="text-red-600" />
        )}
      </td>

      <td className="flex items-center gap-2 px-3 py-2 border">
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
      </td>
    </tr>
  );

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center py-10 w-full">
          <Spinner size="lg" />
        </div>
      ) : (
        <div
          className={`${
            isFrozen ? "pointer-events-none filter blur-sm" : ""
          } w-full space-y-4`}
        >
          <PermissionWrapper>
            <CommonTable
              data={dataList}
              headers={headers}
              renderRow={renderRow}
              title="Role Permissions"
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
                  className="bg-green-600 px-4 py-1 rounded text-white write"
                  onClick={() => openAddEditModal(null)}
                >
                  Add New
                </button>
              }
            />
          </PermissionWrapper>
        </div>
      )}

      {/* Modal */}
      {isAddEditModalOpen && (
        <RolePermissionAddEditModal
          onClose={closeAddEditModal}
          item={selectedItem}
          onSuccess={fetchData}
        />
      )}
    </>
  );
}

export default RolePermission;
