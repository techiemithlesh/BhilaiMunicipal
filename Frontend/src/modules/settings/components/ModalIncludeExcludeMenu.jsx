import axios from "axios";
import { useEffect, useState } from "react";
import {
  menuMobileUserExcludeApi,
  menuMobileUserExcludeIncludeListApi,
  menuMobileUserIncludeApi,
  menuUserExcludeApi,
  menuUserExcludeIncludeListApi,
  menuUserIncludeApi,
} from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { modalVariants } from "../../../utils/motionVariable";

function ModalIncludeExcludeMenu({
  user,
  action,
  onClose,
  onSuccess,
  type = "WEB",
}) {
  const [menuList, setMenuList] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 16;
  const token = getToken();

  const totalPages = Math.ceil(menuList.length / itemsPerPage);
  const paginatedMenus = menuList.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const fetchMenuList = async () => {
    try {
      const response = await axios.post(
        type == "WEB"
          ? menuUserExcludeIncludeListApi
          : menuMobileUserExcludeIncludeListApi,
        {
          userId: user?.id,
          actionType: action,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response?.data?.status) {
        setMenuList(response?.data?.data);
      }
    } catch (error) {
      console.error("Error fetching " + action + " menus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMenuList();
    }
  }, [user, token, type]);

  const handleRoleChange = (e) => {
    const roleId = parseInt(e.target.value);
    const checked = e.target.checked;

    setSelectedRoles((prev) =>
      checked ? [...prev, roleId] : prev.filter((id) => id !== roleId)
    );
    setRolePermissions((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[roleId] = {
          read: false,
          write: false,
          update: false,
          delete: false,
        };
      } else {
        delete updated[roleId];
      }
      return updated;
    });
  };

  const handlePermissionChange = (roleId, perm) => {
    setRolePermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [perm]: !prev[roleId][perm],
      },
    }));
  };

  const handleFormSubmit = async () => {
    const menus = selectedRoles.map((id) => {
      if (action == "EXCLUDE") {
        return {
          menuId: id,
        };
      } else {
        const perms = rolePermissions[id] || {};
        return {
          menuId: id,
          read: !!perms.read,
          write: !!perms.write,
          update: !!perms.update,
          delete: !!perms.delete,
        };
      }
    });

    const payload = {
      userId: user.id,
      menus: menus,
    };
    const api =
      action == "INCLUDE"
        ? type == "WEB"
          ? menuUserIncludeApi
          : menuMobileUserIncludeApi
        : type == "WEB"
        ? menuUserExcludeApi
        : menuMobileUserExcludeApi;
    try {
      setIsFrozen(true);
      const res = await axios.post(api, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.status) {
        toast.success(res.data.message);
        onClose();
        onSuccess();
      } else {
        toast.error("Error submitting form");
      }
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setIsFrozen(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 p-4">
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.3 }}
          className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-6xl max-h-[95vh]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg"> {action}</h2>
            <button onClick={onClose}>
              <FaTimes size={20} />
            </button>
          </div>

          <div className="relative flex-grow pr-2 overflow-y-auto">
            <div
              className={`${
                isFrozen ? "pointer-events-none filter blur-sm" : ""
              } w-full space-y-4`}
            >
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Select Menu
                </label>
                <div className="gap-2 grid grid-cols-2 md:grid-cols-4 p-3 border border-gray-300 rounded">
                  {paginatedMenus.map((menu) => (
                    <div
                      key={menu.menuId}
                      className="space-y-2 p-2 border rounded"
                    >
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          value={menu.menuId}
                          checked={selectedRoles.includes(menu.menuId)}
                          onChange={handleRoleChange}
                        />
                        <span className="font-medium">
                          {menu.menuName} <i>({menu?.role})</i>
                        </span>
                      </label>
                      {selectedRoles.includes(menu.menuId) &&
                        action == "INCLUDE" && (
                          <div className="gap-2 grid grid-cols-2 ml-6 text-xs">
                            {["read", "write", "update", "delete"].map(
                              (perm) => (
                                <label
                                  key={perm}
                                  className="flex items-center space-x-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={
                                      rolePermissions[menu.menuId]?.[perm] ||
                                      false
                                    }
                                    onChange={() =>
                                      handlePermissionChange(menu.menuId, perm)
                                    }
                                  />
                                  <span className="capitalize">{perm}</span>
                                </label>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 px-4 py-1 rounded"
                  >
                    ← Prev
                  </button>
                  <span className="text-gray-700 text-sm">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 px-4 py-1 rounded"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white"
                  onClick={handleFormSubmit}
                  disabled={isFrozen}
                >
                  {action}
                </button>
              </div>
            </div>

            {isFrozen && (
              <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 rounded">
                <div className="font-semibold text-gray-800 text-lg">
                  Processing...
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ModalIncludeExcludeMenu;
