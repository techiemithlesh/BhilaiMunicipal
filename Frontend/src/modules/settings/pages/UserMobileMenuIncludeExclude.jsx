import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { Spinner } from "@nextui-org/react";
import CommonTable from "../../../components/common/CommonTable";
import MenuAddEditModal from "../components/MenuAddEditModal";
import axios from "axios";
import { userApi } from "../../../api/endpoints";
import { FaBan, FaEdit } from "react-icons/fa";
import defaultAvatar from "../../../assets/images/default-avatar.jpg";
import ImagePreview from "../../../components/common/ImagePreview";
import ModalIncludeExcludeMenu from "../components/ModalIncludeExcludeMenu";

function UserMobileMenuIncludeExclude() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const [list, setList] = useState([]);
  const [user, setUser] = useState(null);
  const [action, setAction] = useState("");

  const token = getToken();

  const headers = [
    { label: "#", key: "serial" },
    { label: "User Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Role", key: "roleName" },
    { label: "Action", key: "" },
  ];

  const renderRow = (item, index, currentPage, itemsPerPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * itemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">
        {item?.name}
        <img
          src={item?.userImg || defaultAvatar}
          alt="userImage"
          onClick={() => openPreviewModel(item?.userImg || defaultAvatar)}
          className="inline-block ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
        />
      </td>
      <td className="px-3 py-2 border text-red-600">{item.email}</td>
      <td className="px-3 py-2 border">{item.roleName}</td>
      <td className="space-x-2 px-3 py-2 border">
        <button
          className="bg-black px-2 py-1 rounded text-white text-xs"
          onClick={() => openAddEditMenuModal(item, "INCLUDE")}
        >
          <FaEdit className="inline mr-1" /> Include
        </button>
        <button
          className="bg-black px-2 py-1 rounded text-white text-xs"
          onClick={() => openAddEditMenuModal(item, "EXCLUDE")}
        >
          <FaBan className="inline mr-1" /> Exclude
        </button>
      </td>
    </tr>
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(userApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          onlyMobileRole: true,
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
        },
      });
      setList(response.data.data?.data || []);
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
  }, [page, itemsPerPage, search, token]); // added search and token for completeness

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const fetchAllList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(userApi, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: 1,
          perPage: totalItem,
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

  const openAddEditMenuModal = (item, action) => {
    setUser(item);
    setAction(action);
    setIsModalOpen(true);
  };

  const closeAddEditMenuModal = () => {
    setIsModalOpen(false);
    setAction("");
    setUser(null);
  };

  const openPreviewModel = (link) => {
    setIsModalPreviewOpen(true);
    setPreviewImg(link);
  };

  const closePreviewModel = () => {
    setIsModalPreviewOpen(false);
    setPreviewImg("");
  };

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <CommonTable
          data={list}
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
          fetchAllData={fetchAllList}
        />
      )}

      {isModalPreviewOpen && (
        <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
      )}

      {isModalOpen && (
        <ModalIncludeExcludeMenu
          user={user}
          action={action}
          onClose={closeAddEditMenuModal}
          onSuccess={fetchData}
          type={"MOBI"}
        />
      )}
    </>
  );
}

export default UserMobileMenuIncludeExclude;
