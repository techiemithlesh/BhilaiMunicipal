import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import { Select, Spinner, SelectItem } from "@nextui-org/react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import {
  ModuleListApi,
  roleApi,
  RoleModuleDtlApi,
  RoleModuleEditApi,
  RoleModuleAddApi,
} from "../../../api/endpoints";

function RolePermissionAddEditModal({ item, onClose, onSuccess }) {
  const token = getToken();
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [formData, setFormData] = useState({});
  const [roleList, setRoleList] = useState([]);
  const [moduleList, setModuleList] = useState([]);
  const [errors, setErrors] = useState({});

  const roleOptions = roleList.map((role) => ({
    value: String(role.id),
    label: role.roleName,
  }));

  const moduleOptions = moduleList.map((item) => ({
    value: String(item.id),
    label: item.moduleName,
  }));

  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [moduleSearchQuery, setModuleSearchQuery] = useState("");

  const filteredRoleOptions = roleOptions.filter((opt) =>
    opt.label.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  const filteredModuleOptions = moduleOptions.filter((opt) =>
    opt.label.toLowerCase().includes(moduleSearchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [roleRes, moduleRes] = await Promise.all([
          axios.get(roleApi, {
            headers: { Authorization: `Bearer ${token}` },
            params: { all: "all" },
          }),
          axios.post(
            ModuleListApi,
            { all: "all" },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);

        const newRoleList = roleRes?.data?.status ? roleRes.data.data : [];
        const newModuleList = moduleRes?.data?.status
          ? moduleRes.data.data
          : [];

        setRoleList(newRoleList);
        setModuleList(newModuleList);

        if (item?.id) {
          const response = await axios.post(
            RoleModuleDtlApi,
            { id: item.id },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response?.data?.status) {
            const data = response.data.data;
            setFormData(data);
          }
        }
      } catch (err) {
        console.error("Error loading initial data", err);
        toast.error("Failed to load initial data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInitialData();
    }
  }, [token, item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors && errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNextUISelectChange = (name) => (keys) => {
    const selectedValue = keys.currentKey || null;
    setFormData((prev) => ({ ...prev, [name]: selectedValue }));
    if (errors && errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFormSubmit = async () => {
    const payload = {
      ...formData,
      ...(item?.id && { id: item.id }),
    };

    const api = item?.id ? RoleModuleEditApi : RoleModuleAddApi;
    setIsFrozen(true);

    try {
      const res = await axios.post(api, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res?.data?.status) {
        toast.success(res.data.message);
        onClose();
        onSuccess();
      } else {
        toast.error(res?.data?.message || "An error occurred.");
        setErrors(res?.data?.errors || {});
      }
    } catch (err) {
      console.error("Submit error", err);
      toast.error("Failed to submit data.");
    } finally {
      setIsFrozen(false);
    }
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
            <h2 className="font-bold text-lg">
              {item?.id ? "Update" : "Add"} Menu
            </h2>
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
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Role Type Select with Search */}
                <div>
                  <Select
                    label="Role Type"
                    labelPlacement="outside"
                    variant="bordered"
                    isRequired={true}
                    placeholder={`Select Role Type`}
                    className="w-full"
                    classNames={{
                      inputWrapper: "bg-white",
                      label: "text-sm",
                      base: "max-w-xs",
                      trigger: "min-h-12 py-2",
                      mainWrapper: "bg-white rounded-medium",
                    }}
                    selectedKeys={
                      formData?.roleId
                        ? new Set([String(formData.roleId)])
                        : new Set()
                    }
                    onSelectionChange={handleNextUISelectChange("roleId")}
                    onInputChange={(value) => setRoleSearchQuery(value)}
                  >
                    {filteredRoleOptions.map((opt) => (
                      <SelectItem key={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                  {errors.roleId && (
                    <p className="mt-1 text-red-500 text-xs">{errors.roleId}</p>
                  )}
                </div>
                {/* Module Select with Search */}
                <div>
                  <Select
                    label="Module"
                    labelPlacement="outside"
                    variant="bordered"
                    isRequired={true}
                    placeholder={`Select Module`}
                    className="w-full"
                    classNames={{
                      inputWrapper: "bg-white",
                      label: "text-sm",
                      base: "max-w-xs",
                      trigger: "min-h-12 py-2",
                      mainWrapper: "bg-white rounded-medium",
                    }}
                    selectedKeys={
                      formData?.moduleId
                        ? new Set([String(formData.moduleId)])
                        : new Set()
                    }
                    onSelectionChange={handleNextUISelectChange("moduleId")}
                    onInputChange={(value) => setModuleSearchQuery(value)}
                  >
                    {filteredModuleOptions.map((opt) => (
                      <SelectItem key={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                  {errors.moduleId && (
                    <p className="mt-1 text-red-500 text-xs">
                      {errors.moduleId}
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canUploadDoc"
                    name="canUploadDoc"
                    checked={!!formData?.canUploadDoc}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canUploadDoc"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Upload Doc
                  </label>
                </div>
                {/* All other checkboxes */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canDocVerify"
                    name="canDocVerify"
                    checked={!!formData?.canDocVerify}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canDocVerify"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Doc Verify
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canAdd"
                    name="canAdd"
                    checked={!!formData?.canAdd}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canAdd"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Add Application
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canAppEdit"
                    name="canAppEdit"
                    checked={!!formData?.canAppEdit}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canAppEdit"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Application Edit
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canAppLock"
                    name="canAppLock"
                    checked={!!formData?.canAppLock}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canAppLock"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Application Deactivate
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canAppUnlock"
                    name="canAppUnlock"
                    checked={!!formData?.canAppUnlock}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canAppUnlock"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Application Activate
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canTakePayment"
                    name="canTakePayment"
                    checked={!!formData?.canTakePayment}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canTakePayment"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Take Payment
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canGenerateNotice"
                    name="canGenerateNotice"
                    checked={!!formData?.canGenerateNotice}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canGenerateNotice"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Generate Notice
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canGenerateDemand"
                    name="canGenerateDemand"
                    checked={!!formData?.canGenerateDemand}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canGenerateDemand"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Generate Demand
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canMeterChange"
                    name="canMeterChange"
                    checked={!!formData?.canMeterChange}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canMeterChange"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Meter Change
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canCashVerify"
                    name="canCashVerify"
                    checked={!!formData?.canCashVerify}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canCashVerify"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Cash Verify
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canChequeStatusVerify"
                    name="canChequeStatusVerify"
                    checked={!!formData?.canChequeStatusVerify}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canChequeStatusVerify"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Bank Reconcile
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canPaymentModeUpdate"
                    name="canPaymentModeUpdate"
                    checked={!!formData?.canPaymentModeUpdate}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canPaymentModeUpdate"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Update Payment Mode
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="canTranDeactivate"
                    name="canTranDeactivate"
                    checked={!!formData?.canTranDeactivate}
                    onChange={handleChange}
                    className="border-gray-300 rounded w-4 h-4 text-indigo-600"
                  />
                  <label
                    htmlFor="canTranDeactivate"
                    className="block ml-2 font-semibold text-gray-700 text-sm"
                  >
                    Can Deactivate Transaction
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white"
                  onClick={handleFormSubmit}
                  disabled={isFrozen}
                >
                  {item?.id ? "Update" : "Add"}
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

export default RolePermissionAddEditModal;
