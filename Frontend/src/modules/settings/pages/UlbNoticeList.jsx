import axios from 'axios';
import { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import { noticeListApi, noticeLockUnlockApi } from '../../../api/endpoints';
import { Button, Spinner } from '@nextui-org/react';
import { formatLocalDate, formatLocalDateTime } from '../../../utils/common';
import { FaEdit, FaFile, FaLock, FaUnlock } from 'react-icons/fa';
import PermissionWrapper from '../../../components/common/PermissionWrapper';
import CommonTable from '../../../components/common/CommonTable';
import UlbNoticeAddEditModal from '../components/UlbNoticeAddEditModal';

function UlbNoticeList() {
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
            noticeListApi,
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
            noticeListApi,
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

    const itemLockUnlock = async (item) => {
      setIsFrozen(true);
      try {
        const response = await axios.post(
          noticeLockUnlockApi,
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

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };


    const openAddEditMenuModal = (item) => {
        setSelectedItem(item);
        setIsAddEditModalOpen(true);
    };

    const closeAddEditMenuModal = () => {
        setSelectedItem(null);
        setIsAddEditModalOpen(false);
    };

    const headers = [
        { label: "#", key: "serial" },
        { label: "Notice Date", key: "noticeDate" },
        { label: "Subject", key: "subject" },
        { label: "User", key: "name" },
        { label: "Created At", key: "createdAt" },
        { label: "Document", key: "" },
        { label: "Action", key: "action" },
    ];

    const renderRow = (item, index, currentPage, perPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-3 py-2 border">
            {(currentPage - 1) * perPage + index + 1}
        </td>
        <td className="px-3 py-2 border">{formatLocalDate(item.noticeDate)}</td>
        <td className="px-3 py-2 border">{item.subject}</td>
        <td className="px-3 py-2 border">{item.name}</td>
        <td className="px-3 py-2 border">
            {formatLocalDateTime(item.createdAt)}
        </td>
        <td className="px-3 py-2 border">
            <Button onClick={()=>{window.open(item.docPath, "_blank")}}>
                <FaFile className='text-red-500'/>
            </Button>
        </td>
        <td className="flex items-center gap-2 px-3 py-2 border">
            {!item?.lockStatus && (
            <Button
                size="sm"
                className="edit"
                onClick={() => openAddEditMenuModal(item)}
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
              title="Usage List"
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
                  onClick={() => openAddEditMenuModal(null)}
                >
                  Add Notice
                </button>
              }
            />
          </PermissionWrapper>
        </div>
      )}

      {/* Modal */}
      {isAddEditModalOpen && (
        <UlbNoticeAddEditModal
          onClose={closeAddEditMenuModal}
          item={selectedItem}
          onSuccess={fetchData}
        />
      )}
    </>
  )
}

export default UlbNoticeList
