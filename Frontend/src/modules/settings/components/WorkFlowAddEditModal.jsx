import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaGripVertical } from "react-icons/fa"; // Added FaGripVertical for drag handle
import axios from "axios";
import toast from "react-hot-toast";
import { Spinner, Button } from "@nextui-org/react";
import Select from "react-select";

import { getToken } from "../../../utils/auth";
import {
  roleApi,
  ModuleListApi,
  wfEditApi,
  wfAddApi,
} from "../../../api/endpoints";
import { modalVariants } from "../../../utils/motionVariable";

// Custom styles for react-select to increase the size of the control
const customStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: "40px", // Standard form height
    fontSize: "0.9rem", // Larger font size
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "2px 8px",
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.9rem",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.9rem",
  }),
};

function WorkFlowAddEditModal({ item, onClose, onSuccess }) {
  const token = getToken();
  const [isLoading, setIsLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [roleList, setRoleList] = useState([]);
  const [moduleList, setModuleList] = useState([]);

  // 🎯 Drag and Drop References
  const dragItem = useRef(null); // Index of the item being dragged
  const dragOverItem = useRef(null); // Index of the item being hovered over

  const blankRoleMap = {
    roleId: null,
    forwardRoleId: null,
    backwardRoleId: null,
    serialNo: null,
    isInitiator: false,
    isFinisher: false,
    canDocUpload: false,
    canDocVerify: false,
    canForward: false,
    canBackward: false,
    canAppApproved: false,
    canAppReject: false,
    canModify: false,
    hasFullPermission: false,
  };

  const [formData, setFormData] = useState({
    workflowName: "",
    moduleId: "",
    roleMaps: [blankRoleMap],
  });

  // Split fields into two groups for better display in the grid
  const primaryFields = [
    { name: "roleId", label: "Role", type: "select" },
    { name: "forwardRoleId", label: "Forward Role", type: "select" },
    { name: "backwardRoleId", label: "Backward Role", type: "select" },
    { name: "serialNo", label: "Serial No", type: "number" },
  ];

  const permissionFields = [
    { name: "isInitiator", label: "Is Initiator", type: "checkbox" },
    { name: "isFinisher", label: "Is Finisher", type: "checkbox" },
    { name: "canDocUpload", label: "Can Doc Upload", type: "checkbox" },
    { name: "canDocVerify", label: "Can Doc Verify", type: "checkbox" },
    { name: "canForward", label: "Can Forward", type: "checkbox" },
    { name: "canBackward", label: "Can Backward", type: "checkbox" },
    { name: "canBtc", label: "Can BTC", type: "checkbox" },
    { name: "canAppApproved", label: "Can Approve", type: "checkbox" },
    { name: "canAppReject", label: "Can Reject", type: "checkbox" },
    { name: "canAppEdit", label: "Can Edit App", type: "checkbox" },
    { name: "canFamGenerate", label: "Can FAM Generate", type: "checkbox" },
    { name: "canSamGenerate", label: "Can SAM Generate", type: "checkbox" },
    { name: "canGeotag", label: "Can Tak Geo Tag", type: "checkbox" },
    { name: "canFieldVerify", label: "Can Tak Verification", type: "checkbox" },
    { name: "canTakePayment", label: "Can Tak Payment", type: "checkbox" },
    {
      name: "hasFullPermission",
      label: "Have Full Permission",
      type: "checkbox",
    },
  ];

  // Helper to get ALL formatted options for react-select
  const roleOptions = roleList.map((r) => ({
    value: r.id,
    label: r.roleName,
  }));

  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      roleMaps: [...prev.roleMaps, { ...blankRoleMap }],
    }));
  };

  /**
   * Updates a specific field in a roleMap row.
   */
  const updateRow = (index, field, value) => {
    const updated = [...formData.roleMaps];
    updated[index][field] = value;

    // Logic to reset forward/backward roles if the main roleId changes
    if (field === "roleId") {
      // If the new roleId is the same as the forward/backward role, reset them
      if (updated[index].forwardRoleId === value) {
        updated[index].forwardRoleId = null;
      }
      if (updated[index].backwardRoleId === value) {
        updated[index].backwardRoleId = null;
      }
    }

    setFormData({ ...formData, roleMaps: updated });
  };

  const removeRow = (index) => {
    // Prevent removal if only one step remains
    if (formData.roleMaps.length === 1) {
      toast.error("The workflow must have at least one step.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      roleMaps: prev.roleMaps.filter((_, i) => i !== index),
    }));
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e, index) => {
    dragItem.current = index;
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDrop = (e) => {
    const dragIndex = dragItem.current;
    const dropIndex = dragOverItem.current;

    // Only proceed if dragging started and ended on different items
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const updatedRoleMaps = [...formData.roleMaps];

    // 1. Remove the dragged item
    const [draggedItem] = updatedRoleMaps.splice(dragIndex, 1);

    // 2. Insert it into the new position
    updatedRoleMaps.splice(dropIndex, 0, draggedItem);

    // 3. Reset references
    dragItem.current = null;
    dragOverItem.current = null;

    // 4. Update the state
    setFormData((prev) => ({ ...prev, roleMaps: updatedRoleMaps }));
  };

  const handleSave = useCallback(async () => {
    try {
      setIsFrozen(true);
      // Perform final validation to ensure forward/backward roles are not equal to roleId
      const isValid = formData.roleMaps.every(
        (row) =>
          row.roleId !== row.forwardRoleId && row.roleId !== row.backwardRoleId
      );

      if (!isValid) {
        toast.error(
          "A step's forward or backward role cannot be the same as the step's primary role."
        );
        setIsFrozen(false);
        return;
      }

      // NOTE: The 'serialNo' fields should ideally be re-calculated/re-indexed on save
      // based on the array order. For this example, we'll assume the backend handles it.

      // Simulation of API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const url = item?.id ? wfEditApi : wfAddApi;
      const response = await axios.post(url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data?.status) {
        toast.success(response?.data?.message);
        onSuccess?.();
        onClose();
      } else if (response?.data?.error) {
        setError(response?.data?.error);
        toast.error(response?.data?.message);
      } else {
        toast.success("Failed to save workflow");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save workflow");
    } finally {
      setIsFrozen(false);
    }
  }, [formData, onSuccess, onClose]);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(roleApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: "all" },
      });
      if (response?.data?.status) {
        const blankRole = {
          id: null,
          roleName: "Select Role...",
        };

        // 🎯 NEW: Prepend the blank role to the fetched data array
        const updatedRoleList = [blankRole, ...response.data.data];

        setRoleList(updatedRoleList);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.post(
        ModuleListApi,
        { all: "all" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setModuleList(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchModules();

    if (item) {
      setFormData({
        id: item.id,
        workflowName: item.workflowName || "",
        moduleId: item.moduleId || "",
        // Ensure that roleMaps have default values for new fields if not present in item
        roleMaps: item.roles?.length
          ? item.roles.map((map) => ({ ...blankRoleMap, ...map }))
          : [blankRoleMap],
      });
    }
  }, [token, item]);

  // --- RENDERING ---

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 p-4">
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.3 }}
          className="flex flex-col bg-white shadow-xl rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-gray-200 border-b">
            <h2 className="font-semibold text-xl">
              {item ? "Edit WorkFlow" : "Add WorkFlow"}
            </h2>
            <button
              onClick={onClose}
              className="hover:bg-gray-200 p-2 rounded-full transition"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col flex-grow space-y-6 p-6 overflow-y-auto">
            {/* Module & Workflow Name (Section 1) */}
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block mb-1 font-medium text-sm">Module</label>
                <Select
                  options={moduleList.map((w) => ({
                    value: w.id,
                    label: w.moduleName,
                  }))}
                  value={
                    moduleList
                      .map((w) => ({ value: w.id, label: w.moduleName }))
                      .find((opt) => opt.value === formData.moduleId) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      moduleId: selected?.value ?? "",
                    })
                  }
                  placeholder="Select Module..."
                  isDisabled={isFrozen}
                  styles={customStyles}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-sm">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={formData.workflowName}
                  onChange={(e) =>
                    setFormData({ ...formData, workflowName: e.target.value })
                  }
                  placeholder="Enter workflow name"
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 w-full h-10"
                  disabled={isFrozen}
                />
              </div>
            </div>

            {/* Role Maps - Steps Section (The Drag Area) */}
            <div className="space-y-6">
              <h3 className="pb-2 border-b font-semibold text-lg">
                Workflow Steps (Roles & Permissions)
              </h3>

              {formData.roleMaps.map((row, rowIndex) => {
                const currentRoleId = row.roleId;

                const filteredRoleOptions = roleOptions.filter(
                  (opt) => opt.value !== currentRoleId
                );

                const isLastRemainingStep = formData.roleMaps.length === 1;

                return (
                  <div
                    key={rowIndex}
                    draggable // Enable dragging
                    onDragStart={(e) => handleDragStart(e, rowIndex)} // Set the dragged item index
                    onDragEnter={(e) => handleDragEnter(e, rowIndex)} // Set the item being hovered over
                    onDragEnd={handleDrop} // Reorder array on drop
                    onDragOver={(e) => e.preventDefault()} // Must be called to allow dropping
                    className={`p-4 border border-gray-200 rounded-lg shadow-md relative group transition cursor-grab ${
                      dragItem.current === rowIndex
                        ? "opacity-50 border-dashed border-4 border-blue-500"
                        : "hover:border-blue-400"
                    }`}
                  >
                    {/* Row Header/Index */}
                    <div className="flex justify-between items-center mb-4">
                      {/* Drag handle and Step Number */}
                      <h4 className="flex items-center gap-2 font-bold text-gray-700 text-md">
                        <FaGripVertical className="text-gray-400 cursor-grab" />
                        Step {rowIndex + 1}
                      </h4>

                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        disabled={isLastRemainingStep || isFrozen}
                        className="min-w-fit"
                      >
                        Delete Step
                      </Button>
                    </div>

                    {/* Primary Fields (Roles and Serial No) */}
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-4 mb-4">
                      {primaryFields.map((field) => {
                        const isDirectionalRole =
                          field.name === "forwardRoleId" ||
                          field.name === "backwardRoleId";
                        // Roles options exclude the current step's role for Forward/Backward
                        const optionsToUse = isDirectionalRole
                          ? filteredRoleOptions
                          : roleOptions;

                        const isInvalidSelection =
                          isDirectionalRole &&
                          row[field.name] === currentRoleId;

                        return (
                          <div key={field.name}>
                            <label className="block mb-1 font-medium text-xs">
                              {field.label}
                              {isInvalidSelection && (
                                <span className="ml-1 text-red-500">
                                  (Cannot be self)
                                </span>
                              )}
                            </label>
                            {field.type === "select" ? (
                              <Select
                                options={optionsToUse}
                                value={
                                  optionsToUse.find(
                                    (opt) => opt.value === row[field.name]
                                  ) || null
                                }
                                onChange={(selected) =>
                                  updateRow(
                                    rowIndex,
                                    field.name,
                                    selected?.value ?? null
                                  )
                                }
                                placeholder={`Select ${field.label}`}
                                isDisabled={isFrozen}
                                styles={customStyles}
                              />
                            ) : (
                              <input
                                type={field.type}
                                value={row[field.name] ?? ""}
                                onChange={(e) =>
                                  updateRow(
                                    rowIndex,
                                    field.name,
                                    e.target.value
                                  )
                                }
                                className="px-3 py-2 border rounded focus:ring-1 focus:ring-blue-300 w-full h-10"
                                disabled={isFrozen}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Permission Checkboxes */}
                    <div className="pt-4 border-t">
                      <h5 className="mb-2 font-medium text-sm">Permissions</h5>
                      <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
                        {permissionFields.map((field) => (
                          <div
                            key={field.name}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`${field.name}-${rowIndex}`}
                              checked={row[field.name] || false}
                              onChange={(e) =>
                                updateRow(
                                  rowIndex,
                                  field.name,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 accent-blue-500 cursor-pointer"
                              disabled={isFrozen}
                            />
                            <label
                              htmlFor={`${field.name}-${rowIndex}`}
                              className="text-sm cursor-pointer select-none"
                            >
                              {field.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Row Button */}
            <div>
              <Button variant="bordered" onClick={addRow} disabled={isFrozen}>
                ➕ Add New Step
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-2 p-4 border-gray-200 border-t">
            <Button variant="bordered" onClick={onClose} disabled={isFrozen}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleSave} disabled={isFrozen}>
              {isFrozen ? <Spinner color="white" size="sm" /> : "Save Workflow"}
            </Button>
          </div>

          {isFrozen && (
            <div className="absolute inset-0 flex justify-center items-center bg-white/60 rounded-2xl">
              <Spinner />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default WorkFlowAddEditModal;
