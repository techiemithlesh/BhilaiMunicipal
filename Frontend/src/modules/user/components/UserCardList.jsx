import { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Button, Input } from "@nextui-org/react";
import { FaHistory, FaLock, FaUnlock, FaUserCheck } from "react-icons/fa";
import { getToken } from "../../../utils/auth";
import { exportToExcel } from "../../../utils/exportExcel";
import { useLoading } from "../../../contexts/LoadingContext";

import {
  cacheClearApi,
  userApi,
  userLockUnlockByIdApi,
  userResetPassword,
} from "../../../api/endpoints";
import { RoleEditModal } from "./RoleEditModal";
import { WardMapModal } from "./WardMapModal";
import AddEditUserModal from "./AddEditUserModal";

import defaultAvatar from "../../../assets/images/default-avatar.jpg";
import ImagePreview from "../../../components/common/ImagePreview";
import CommonTable from "../../../components/common/CommonTable";
import toast from "react-hot-toast";
import { toastMsg } from "../../../utils/utils";
import LoginUserList from "../../../components/specific/LoginUserList";

export default function UserCardList({ userType }) {
  const [userListData, setUserListData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isRoleMapModelOpen, setIsRoleMapModelOpen] = useState(false);
  const [isWardMapModelOpen, setIsWardMapModelOpen] = useState(false);
  const [isUserModelOpen, setIsUserModelOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [isLoginDeviceModelOpen, setIsLoginDeviceModelOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userDetails"));
  const { setIsLoadingGable } = useLoading();
  const token = getToken();

  // Fetch users
  const fetchUserData = async () => {
    setIsLoadingGable(true);
    try {
      const response = await axios.get(userApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          userFor: userType,
          page: currentPage,
          perPage: itemsPerPage,
          key: search.trim() || null,
        },
      });
      const data = response.data.data;
      setUserListData(data.data);
      setFilteredData(data.data);
      setTotalPages(data.lastPage);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingGable(false);
    }
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Full Name", key: "name" },
    { label: "User Name", key: "userName" },
    { label: "Phone No.", key: "phoneNo" },
    { label: "Email", key: "email" },
    { label: "User Type", key: "userFor" },
    { label: "Roles", key: "roleName" },
    { label: "Action", key: "" },
  ];

  const renderRow = (item, index, currentPage, itemsPerPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * itemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">
        <img
          src={item?.userImg || defaultAvatar}
          alt="userImage"
          onClick={() => openPreviewModel(item?.userImg || defaultAvatar)}
          className="inline-block ml-2 w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer mr-3"
        />
        {item?.name}
      </td>
      <td className="px-3 py-2 border text-red-600">{item.userName}</td>
      <td className="px-3 py-2 border">{item.phoneNo}</td>
      <td className="px-3 py-2 border">{item.email}</td>
      <td className="px-3 py-2 border">{item.userFor}</td>
      <td className="px-3 py-2 border">{item.roleName}</td>
      <td className="px-3 py-2 border space-x-2">
        {userInfo?.roleDtls?.some((role) => [1, 2].includes(role?.id)) && (
          <div className="flex items-center space-x-2">
            {!item?.lockStatus && (
              <>
                <Button size="sm" onClick={() => openUserModel(item)}>
                  Edit
                </Button>
                <Button size="sm" onClick={() => resetPassword(item)}>
                  Reset
                </Button>
              </>
            )}
            <Button
              size="sm"
              className={item.lockStatus ? "bg-green-500" : "bg-red-500"}
              onClick={() => lockUnlockUser(!item.lockStatus, item)}
            >
              {item.lockStatus ? <FaUnlock /> : <FaLock />}
            </Button>
            {}
            <Button
              size="sm"              
              onClick={() => openLoginHistoryModal(item)}
            >
              <FaHistory/>
            </Button>
          </div>
        )}
      </td>
    </tr>
  );

  const openPreviewModel = (link) => {
    setIsModalPreviewOpen(true);
    setPreviewImg(link);
  };

  const closePreviewModel = () => {
    setIsModalPreviewOpen(false);
    setPreviewImg("");
  };

  useEffect(() => {
    fetchUserData();
  }, [userType, currentPage, itemsPerPage]);

  // Filter users by search
  // useEffect(() => {
  //   const result = userListData.filter((user) => {
  //     const fullName = `${user.firstName} ${user.middleName} ${user.lastName}`.toLowerCase();
  //     return (
  //       user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       fullName.includes(searchTerm.toLowerCase()) ||
  //       user.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       user.userFor.toLowerCase().includes(searchTerm.toLowerCase())
  //     );
  //   });
  //   setFilteredData(result);
  // }, [searchTerm, userListData]);

  const fetchAllList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(userApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: 1,
          perPage: total,
          key: search.trim() || null,
        },
      });
      return response.data.data?.data || [];
    } catch (error) {
      console.error("Error fetching all menus:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Lock/Unlock user
  const lockUnlockUser = async (status, user) => {
    setIsLoadingGable(true);
    try {
      const response = await axios.post(
        `${userLockUnlockByIdApi}/${user.id}`,
        { lockStatus: status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response?.data?.status) fetchUserData();
    } catch (error) {
      console.error("Error updating lock status:", error);
    } finally {
      setIsLoadingGable(false);
    }
  };

  const resetPassword = async (user) => {
    setIsLoadingGable(true);
    try {
      const response = await axios.post(
        `${userResetPassword}/${user.id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data?.status) {
        toast.success(response.data.message, { position: "top-right" });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setIsLoadingGable(false);
    }
  };

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUserData();
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setIsRoleMapModelOpen(true);
  };

  const openLoginHistoryModal = (user) => {
    setSelectedUser(user);
    setIsLoginDeviceModelOpen(true);
  };

  const updateRedis = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(cacheClearApi, {}, {});
      toastMsg(res.data.message, "success");
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openWardModel = (user) => {
    setSelectedUser(user);
    setIsWardMapModelOpen(true);
  };

  const openUserModel = (user) => {
    setSelectedUser(user);
    setIsUserModelOpen(true);
  };

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <CommonTable
          data={userListData}
          headers={headers}
          renderRow={renderRow}
          title="Menu List"
          totalPages={totalPages}
          currentPage={currentPage}
          setPageNo={setCurrentPage}
          totalItem={total}
          setItemsPerPage={setItemsPerPage}
          itemsPerPage={itemsPerPage}
          search={search}
          setSearch={setSearch}
          onSearch={handleSearch}
          fetchAllData={fetchAllList}
          actionButton={
            <div className="flex items-center gap-[10px]">
              <button
                className="bg-green-600 text-white px-4 py-1 rounded"
                onClick={() => openUserModel(null)}
              >
                Add User
              </button>

              {userInfo?.roleDtls?.some((role) => role.id === 1) && (
                <button
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-700 transition-colors"
                  onClick={updateRedis}
                >
                  Update Redis
                </button>
              )}
            </div>
          }
        />
      )}

      {/* Modals */}
      {isModalPreviewOpen && (
        <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
      )}
      {isRoleMapModelOpen && (
        <RoleEditModal
          onClose={() => setIsRoleMapModelOpen(false)}
          user={selectedUser}
        />
      )}
      {isWardMapModelOpen && (
        <WardMapModal
          onClose={() => setIsWardMapModelOpen(false)}
          user={selectedUser}
        />
      )}
      {isUserModelOpen && (
        <AddEditUserModal
          onClose={() => setIsUserModelOpen(false)}
          user={selectedUser}
          onSuccess={fetchUserData}
        />
      )}

      {isLoginDeviceModelOpen && (
        <LoginUserList
          onClose={() => setIsLoginDeviceModelOpen(false)}
          id={selectedUser?.id}
        />
      )}
    </>
  );
}
