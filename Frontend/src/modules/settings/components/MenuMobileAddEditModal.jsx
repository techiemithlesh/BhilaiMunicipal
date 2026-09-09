import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import Select from "react-select";
import axios from "axios";
import toast from "react-hot-toast";
import { Spinner } from "@nextui-org/react";

import { getToken } from "../../../utils/auth";
import {
  getMobileMenuDtlByIdApi,
  getMobileMenuListApi,
  getMobileSubMenuListApi,
  menuMobileAddApi,
  menuMobileEditApi,
  roleApi,
} from "../../../api/endpoints";
import { modalVariants } from "../../../utils/motionVariable";

const InputField = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-gray-700">{label}</label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      disabled={disabled}
      className="w-full mt-1 p-2 border border-gray-300 rounded-md"
    />
  </div>
);

function MenuMobileAddEditModal({ item, onClose, onSuccess }) {
  const token = getToken();
  const [isLoading, setIsLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isDisabledUrl, setIsDisabledUrl] = useState(false);
  const [isDirectMenu, setIsDirectMenu] = useState(false);

  const [roleList, setRoleList] = useState([]);
  const [mainMenuList, setMainMenuList] = useState([]);
  const [subMenuList, setSubMenuList] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [formData, setFormData] = useState({
    menuName: "",
    parentId: "0",
    subMenuId: "0",
    url: "",
    queryString: "",
    serialNo: "",
    icon: "",
    description: "",
    roleId: [],
  });

  const [errors, setErrors] = useState({});

  const mainMenuOptions = useMemo(() => [
    { value: "0", label: "#" },
    { value: "-1", label: "Direct Menu" },
    ...mainMenuList.map((m) => ({ value: m.id.toString(), label: m.menuName }))
  ], [mainMenuList]);

  const subMenuOptions = useMemo(() =>
    [{ value: "0", label: "#" }, ...subMenuList.map((m) => ({ value: m.id.toString(), label: m.menuName }))],
    [subMenuList]
  );

  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, mainMenuRes] = await Promise.all([
        axios.get(roleApi, {
          headers: { Authorization: `Bearer ${token}` },
          params: { all: "all",onlyMobileRole:true },
        }),
        axios.post(getMobileMenuListApi, { all: "all", mainMenuOnly: true }, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setRoleList(rolesRes.data.data);
      setMainMenuList(mainMenuRes.data.data);

      if (item?.id) await fetchMenuDetails(item.id);
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuDetails = async (id) => {
    try {
      const res = await axios.post(getMobileMenuDtlByIdApi, { id }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data;
      setFormData({
        menuName: data.menuName,
        parentId: data.parentId?.toString() || "0",
        subMenuId: data.subMenuId?.toString() || "0",
        url: data.url || "",
        queryString: data.queryString || "",
        serialNo: data.serialNo || "",
        icon: data.icon || "",
        description: data.description || "",
        roleId: data.role?.map(r => r.roleId) || [],
      });

      const roleIds = data.role.map(r => r.roleId);
      setSelectedRoles(roleIds);

      const perms = {};
      data.role.forEach(role => {
        perms[role.roleId] = {
          read: !!role.read,
          write: !!role.write,
          update: !!role.update,
          delete: !!role.delete,
        };
      });
      setRolePermissions(perms);

      if (!["0", "-1"].includes(data.parentId?.toString())) {
        await fetchSubMenuList(data.parentId);
      }

      setIsDisabledUrl(data.parentId === "0");
      setIsDirectMenu(data.parentId === "-1");
    } catch (err) {
      console.error("Error fetching menu details", err);
    }
  };

  const fetchSubMenuList = async (menuId) => {
    try {
      const res = await axios.post(getMobileSubMenuListApi, { id: menuId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubMenuList(res.data.data);
    } catch (err) {
      console.error("Error fetching submenus", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleMenuChange = (selected) => {
    const parentId = selected?.value || "0";
    setFormData((prev) => ({ ...prev, parentId, subMenuId: "0" }));

    if (!["0", "-1"].includes(parentId)) {
      fetchSubMenuList(parentId);
    } else {
      setSubMenuList([]);
    }

    setIsDisabledUrl(parentId === "0");
    setIsDirectMenu(parentId === "-1");
  };

  const handleSubMenuChange = (selected) => {
    setFormData((prev) => ({ ...prev, subMenuId: selected?.value || "0" }));
  };

  const handleRoleChange = (e) => {
    const roleId = parseInt(e.target.value);
    const checked = e.target.checked;

    setSelectedRoles(prev => checked ? [...prev, roleId] : prev.filter(id => id !== roleId));
    setFormData(prev => ({
      ...prev,
      roleId: checked ? [...prev.roleId, roleId] : prev.roleId.filter(id => id !== roleId),
    }));

    setRolePermissions(prev => {
      const updated = { ...prev };
      if (checked) {
        updated[roleId] = { read: false, write: false, update: false, delete: false };
      } else {
        delete updated[roleId];
      }
      return updated;
    });
  };

  const handlePermissionChange = (roleId, perm) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [perm]: !prev[roleId][perm],
      },
    }));
  };

  const handleFormSubmit = async () => {
    const roles = selectedRoles.map((roleId) => {
      const perms = rolePermissions[roleId] || {};
      return {
        roleId,
        read: !!perms.read,
        write: !!perms.write,
        update: !!perms.update,
        delete: !!perms.delete,
      };
    });

    const payload = {
      ...formData,
      role: roles,
      ...(item?.id && { id: item.id }),
    };

    const api = item?.id ? menuMobileEditApi : menuMobileAddApi;
    setIsFrozen(true);

    try {
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
        setErrors(res.data.errors || {});
      }
    } catch (err) {
      console.error("Submit error", err);
    } finally {
      setIsFrozen(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-xl p-6 w-full max-w-6xl max-h-[95vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{item?.id ? "Update" : "Add"} Menu</h2>
            <button onClick={onClose}><FaTimes size={20} /></button>
          </div>

          <div className="overflow-y-auto flex-grow pr-2 relative">
            <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""} w-full space-y-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputField label="Menu Name" name="menuName" value={formData.menuName} onChange={handleInputChange} />
                <InputField label="Order No" name="serialNo" value={formData.serialNo} onChange={handleInputChange} />

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Under Menu</label>
                  <Select
                    name="parentId"
                    value={mainMenuOptions.find(opt => opt.value === formData.parentId)}
                    onChange={handleMenuChange}
                    options={mainMenuOptions}
                    isClearable
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Under Sub Menu</label>
                  <Select
                    name="subMenuId"
                    value={subMenuOptions.find(opt => opt.value === formData.subMenuId)}
                    onChange={handleSubMenuChange}
                    options={subMenuOptions}
                    isClearable
                    isDisabled={isDirectMenu || isDisabledUrl}
                  />
                </div>

                <InputField label="Menu Path" name="url" value={formData.url} onChange={handleInputChange} disabled={isDisabledUrl} />
                <InputField label="Menu Icon" name="icon" value={formData.icon} onChange={handleInputChange} />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">Select Roles</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-gray-300 rounded p-3">
                  {roleList.map((role) => (
                    <div key={role.id} className="border p-2 rounded space-y-2">
                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          value={role.id}
                          checked={selectedRoles.includes(role.id)}
                          onChange={handleRoleChange}
                        />
                        <span className="font-medium">{role.roleName}</span>
                      </label>
                      {selectedRoles.includes(role.id) && (
                        <div className="ml-6 grid grid-cols-2 gap-2 text-xs">
                          {['read', 'write', 'update', 'delete'].map((perm) => (
                            <label key={perm} className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                checked={rolePermissions[role.id]?.[perm] || false}
                                onChange={() => handlePermissionChange(role.id, perm)}
                              />
                              <span className="capitalize">{perm}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
                  onClick={handleFormSubmit}
                  disabled={isFrozen}
                >
                  {item?.id ? "Update" : "Add"} Menu
                </button>
              </div>
            </div>

            {isFrozen && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 rounded">
                <div className="text-lg font-semibold text-gray-800">Processing...</div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default MenuMobileAddEditModal
