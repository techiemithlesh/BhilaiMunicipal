import { FaEdit, FaBan } from "react-icons/fa";
import CommonTable from "../../../components/common/CommonTable";
import { useEffect, useState } from "react";
import { getMobileMenuListApi, mobileMenuLockUnlockApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { Spinner } from "@nextui-org/react";
import axios from "axios";
import * as FaIcons from "react-icons/fa";
import * as MdIcons  from 'react-icons/md';
import toast from "react-hot-toast";
import MenuMobileAddEditModal from "../components/MenuMobileAddEditModal";
import { toTitleCase } from "../../../utils/common";

function MobileMenuList() {
    const [menuList, setMenuList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    const token = getToken();

    const headers = [
        { label: "#", key: "serial" },
        { label: "Menu Icon", key: "icon" },
        { label: "Menu Name", key: "menuName" },
        { label: "Menu Path", key: "url" },
        { label: "Permission To", key: "role" },
        { label: "Action", key: "" },
    ];

    const renderRow = (item, index, currentPage, itemsPerPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 border">
                {(currentPage - 1) * itemsPerPage + index + 1}
            </td>
            <td className="px-3 py-2 border">{getFaIcon(item?.icon)}</td>
            <td className="px-3 py-2 border text-red-600">
                {item.menuName}{" "}
                {item.parentMenu &&(

                    <div className="text-xs text-gray-500">
                        ({item.parentMenu})
                    </div>
                )}
            </td>
            <td className="px-3 py-2 border">{item.url}</td>
            <td className="px-3 py-2 border">{item.role}</td>
            <td className="px-3 py-2 border space-x-2">
                {!item?.lockStatus &&(
                    <>
                        <button
                            className="bg-black text-white px-2 py-1 rounded text-xs"
                            onClick={() => openAddEditMenuModal(item)}
                        >
                            <FaEdit className="inline mr-1" /> Edit
                        </button>
                        <button className="bg-black text-white px-2 py-1 rounded text-xs"
                            onClick={() => ActiveDeactivate(item,true)}
                        >
                            <FaBan className="inline mr-1" /> Deactivate
                        </button>
                    </>
                )}
                {item?.lockStatus &&(
                    <>
                        <button className="bg-black text-white px-2 py-1 rounded text-xs"
                            onClick={() => ActiveDeactivate(item,false)}
                        >
                            <FaIcons.FaUnlock className="inline mr-1" /> Active
                        </button>
                    </>
                )}
            </td>
        </tr>
    );

    const toPascalCase = (str) => {
        if (!str) return '';
        return str
            .toLowerCase()
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    };

    const getFaIcon = (iconName) => {
      // Default to FaCogs if icon is not found
      const IconComponent = MdIcons["Md"+toPascalCase(iconName)] || FaIcons[iconName] || FaIcons["FaCogs"];
      return <IconComponent />;
    };



    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                getMobileMenuListApi,
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
            setMenuList(response.data.data?.data || []);
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

    const ActiveDeactivate=async(item,status)=>{
        setIsLoading(true);
        try{
            const response = await axios.post(mobileMenuLockUnlockApi,
                {
                    id : item.id,
                    lockStatus : status
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
        }catch(error){
            console.error("active deactivate menu update error:",error);
        }finally{
            setIsLoading(false);
        }
    }

    const fetchAllMenus = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                getMobileMenuListApi,
                {
                    page:1,
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
        setSelectedMenu(item);
        setIsAddEditModalOpen(true);
    };

    const closeAddEditMenuModal = () => {
        setIsAddEditModalOpen(false);
        setSelectedMenu(null);
    };

    return (
        <>
            {isLoading ? (
                <Spinner />
            ) : (
                <CommonTable
                    data={menuList}
                    headers={headers}
                    renderRow={renderRow}
                    title="Menu List"
                    totalPages={totalPage}
                    currentPage={page}
                    setPageNo={setPage}
                    totalItem={totalItem}
                    setItemsPerPage={setItemsPerPage}
                    itemsPerPage={itemsPerPage}
                    search={search}
                    setSearch={setSearch}
                    onSearch={handleSearch}
                    fetchAllData={fetchAllMenus}
                    actionButton={
                        <button
                            className="bg-green-600 text-white px-4 py-1 rounded"
                            onClick={() => openAddEditMenuModal(null)}
                        >
                            Add Menu
                        </button>
                    }
                />
            )}

            {isAddEditModalOpen && (
                <MenuMobileAddEditModal
                    onClose={closeAddEditMenuModal}
                    item={selectedMenu}
                    onSuccess={fetchData}
                />
            )}
        </>
    );
}

export default MobileMenuList
