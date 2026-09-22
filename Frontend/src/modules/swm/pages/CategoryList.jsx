import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import { swmCategoryListApi, swmCategoryLockUnlockApi } from '../../../api/endpoints';
import axios from 'axios';
import { Spinner } from '@nextui-org/react';
import CommonTable from '../../../components/common/CommonTable';
import PermissionWrapper from '../../../components/common/PermissionWrapper';
import { FaBan, FaEdit, FaUnlock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AddEditCategoryModal from '../components/AddEditCategoryModal';

function CategoryList() {
    const [dataList, setDataList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const token = getToken();


    const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post(
            swmCategoryListApi,
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
    
      const ActiveDeactivate = async (item, status) => {
        setIsLoading(true);
        try {
          const response = await axios.post(
            swmCategoryLockUnlockApi,
            {
              id: item.id,
              lockStatus: status,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.data.status) {
            toast.success(response.data.message);
            fetchData();
          } else {
            toast.error(response.data.message);
          }
        } catch (error) {
          console.error("active deactivate menu update error:", error);
        } finally {
          setIsLoading(false);
        }
      };
    
      const fetchAllData = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post(
            swmCategoryListApi,
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
    
      const openAddEditMenuModal = (item) => {
        setSelectedItem(item);
        setIsAddEditModalOpen(true);
      };
    
      const closeAddEditMenuModal = () => {
        setIsAddEditModalOpen(false);
        setSelectedItem(null);
      };

    const headers = [
        { label: "#", key: "serial" },
        { label: "Category", key: "categoryType" },
        { label: "Action", key: "" },
    ];

    const renderRow = (item, index, currentPage, itemsPerPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 border">
                {(currentPage - 1) * itemsPerPage + index + 1}
            </td>
            <td className="px-3 py-2 border">{item?.categoryType}</td>
            <td className="space-x-2 px-3 py-2 border">
                {!item?.lockStatus && (
                    <div className="flex items-center space-x-2">
                        <button
                            className="bg-black px-2 py-1 rounded text-white text-xs edit"
                            onClick={() => openAddEditMenuModal(item)}
                        >
                            <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button
                            className="bg-red-500 px-2 py-1 rounded text-white text-xs delete"
                            onClick={() => ActiveDeactivate(item, true)}
                        >
                            <FaBan className="inline mr-1" /> Deactivate
                        </button>
                    </div>
                )}
                {item?.lockStatus && (
                    <>
                        <button
                            className="bg-black px-2 py-1 rounded text-white text-xs edit"
                            onClick={() => ActiveDeactivate(item, false)}
                        >
                            <FaUnlock className="inline mr-1" /> Active
                        </button>
                    </>
                )}
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
              title="Category List"
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
                  Add Category
                </button>
              }
            />            
        </PermissionWrapper>
      )}

      {isAddEditModalOpen && (
        <AddEditCategoryModal
          onClose={closeAddEditMenuModal}
          item={selectedItem}
          onSuccess={fetchData}
        />
      )}
    </>
    )
}

export default CategoryList
