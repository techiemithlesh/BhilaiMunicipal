import { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { officerListApi, officerLockUnlockApi } from '../../../api/endpoints';
import { formatLocalDateTime } from '../../../utils/common';
import { Button, Spinner } from '@nextui-org/react';
import { FaEdit, FaLock, FaUnlock } from 'react-icons/fa';
import PermissionWrapper from '../../../components/common/PermissionWrapper';
import CommonTable from '../../../components/common/CommonTable';
import ImagePreview from '../../../components/common/ImagePreview';
import UlbOfficerAddEditModal from '../components/UlbOfficerAddEditModal';
import defaultAvatar from "../../../assets/images/default-avatar.jpg";

function UlbOfficerList() {

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
    const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
    const [previewImg, setPreviewImg] = useState("");

    const token = getToken();
    useEffect(() => {
        if (token) fetchData();
    }, [page, itemsPerPage]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(
                officerListApi,
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
                officerListApi,
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
                officerLockUnlockApi,
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

    const openPreviewModel = (link) => {
        setIsModalPreviewOpen(true);
        setPreviewImg(link);
    };
    const closePreviewModel = () => {
        setIsModalPreviewOpen(false);
        setPreviewImg("");
    };

    const headers = [
        { label: "#", key: "serial" },
        { label: "Officer Name", key: "officerName" },
        { label: "Designation", key: "designation" },
        { label: "Contact No.", key: "contactNo" },
        { label: "email", key: "email" },
        { label: "Sl No.", key: "slNo" },
        { label: "Created At", key: "createdAt" },
        { label: "Action", key: "action" },
    ];

    const renderRow = (item, index, currentPage, perPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 border">
                {(currentPage - 1) * perPage + index + 1}
            </td>
            <td className="px-3 py-2 border">
                <img
                    src={item?.imgPath || defaultAvatar}
                    alt="userImage"
                    onClick={() => openPreviewModel(item?.imgPath || defaultAvatar)}
                    className="inline-block ml-2 w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer mr-3"
                />
                {item?.officerName}
            </td>
            <td className="px-3 py-2 border">{item.designation}</td>
            <td className="px-3 py-2 border">{item.contactNo}</td>
            <td className="px-3 py-2 border">{item.email}</td>
            <td className="px-3 py-2 border">{item.slNo}</td>
            <td className="px-3 py-2 border">
                {formatLocalDateTime(item.createdAt)}
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
                    className={`delete text-white ${item.lockStatus ? "bg-green-600" : "bg-red-600"
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
                    className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""
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
                                    Add Officer
                                </button>
                            }
                        />
                    </PermissionWrapper>
                </div>
            )}

            {/* Modal */}
            {isModalPreviewOpen && (
                <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
            )}
            {isAddEditModalOpen && (
                <UlbOfficerAddEditModal
                    onClose={closeAddEditMenuModal}
                    item={selectedItem}
                    onSuccess={fetchData}
                />
            )}
        </>
    )
}

export default UlbOfficerList
