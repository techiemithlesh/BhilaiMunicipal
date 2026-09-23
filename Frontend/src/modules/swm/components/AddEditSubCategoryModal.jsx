import React, { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import {
  swmCategoryListApi,
  swmSubCategoryAddApi,
  swmSubCategoryDtlApi,
  swmSubCategoryEditApi,
} from "../../../api/endpoints";
import toast from "react-hot-toast";
import { Button, Spinner } from "@nextui-org/react";
import Select from "react-select";
import { modalVariants } from "../../../utils/motionVariable";
import { motion } from "framer-motion";
import { FaGripVertical, FaTimes } from "react-icons/fa";
import InputField from "../../../components/common/InputField";
import axios from "axios";

function AddEditSubCategoryModal({ item, onClose, onSuccess }) {
  const token = getToken();
  const [categoryList, setCategoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [formData, setFormData] = useState({
    categoryTypeMasterId: "",
    subCategoryType: "",
    rates: [
      {
        ratePerMonth: "",
        compostingMachineRate: "",
        isPercentCompostingMachineRate: false,
        effectiveFrom: "",
        effectiveUpto: "",
      },
    ],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const categoryRes = await axios.post(
        swmCategoryListApi,
        { all: "all" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategoryList(categoryRes?.data?.data || []);

      if (item?.id) {
        const response = await axios.post(
          swmSubCategoryDtlApi,
          { id: item?.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.status) {
          setFormData(response?.data?.data);
        }
      }
    } catch (error) {
      console.error("Error during initial data fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions =
    categoryList?.map((item) => ({
      value: item?.id,
      label: item?.categoryType,
    })) || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFormSubmit = async () => {
    setIsFrozen(true);
    try {
      const url = item?.id ? swmSubCategoryEditApi : swmSubCategoryAddApi;
      const res = await axios.post(url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.status) {
        toast.success(res.data.message, { position: "top-right" });
        onClose();
        onSuccess();
      } else {
        setErrors(res.data.errors || {});
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const blankRate = {
    ratePerMonth: "",
    compostingMachineRate: "",
    isPercentCompostingMachineRate: false,
    effectiveFrom: "",
    effectiveUpto: "",
  };

  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      rates: [...(prev?.rates || []), { ...blankRate }],
    }));
  };

  const updateRow = (index, field, value) => {
    const updated = [...formData.rates];
    updated[index][field] = field === "isPercentCompostingMachineRate" ? !updated[index][field] : value;
    setFormData({ ...formData, rates: updated });
  };

  const removeRow = (index) => {
    if (formData?.rates?.length === 1) {
      toast.error("At least one rate setup is required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      rates: prev?.rates.filter((_, i) => i !== index),
    }));
  };

  const primaryFields = [
    { name: "ratePerMonth", label: "Rate Per Month", type: "number" },
    { name: "compostingMachineRate", label: "Composting Machine Rate", type: "number" },
    { name: "isPercentCompostingMachineRate", label: "Is % of Rate Per Month", type: "checkbox" },
    { name: "effectiveFrom", label: "Effective From", type: "date" },
    { name: "effectiveUpto", label: "Effective Upto", type: "date" },
  ];

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75 p-4">
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.5 }}
          className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[80vh]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              {item?.id ? "Update" : "Add"} Sub Category
            </h2>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="relative flex-grow pr-2 overflow-y-auto">
            <div
              className={`${
                isFrozen ? "pointer-events-none filter blur-sm" : ""
              } w-full space-y-4`}
            >
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block font-semibold text-gray-700 text-sm mb-1">
                    Category Type
                  </label>
                  <Select
                    name="categoryTypeMasterId"
                    value={categoryOptions.find(
                      (opt) => opt.value === formData.categoryTypeMasterId
                    )}
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        categoryTypeMasterId: selected?.value || "",
                      }))
                    }
                    options={categoryOptions}
                    placeholder="Select Category"
                    isClearable
                  />
                  {errors?.categoryTypeMasterId && (
                    <span className="text-red-500 text-sm">
                      {errors.categoryTypeMasterId}
                    </span>
                  )}
                </div>

                <InputField
                  label="Sub Category Type"
                  name="subCategoryType"
                  value={formData.subCategoryType || ""}
                  onChange={handleInputChange}
                  error={errors?.subCategoryType}
                />
              </div>

              {/* Rates Section */}
              <div className="space-y-6">
                <h3 className="pb-2 border-b font-semibold text-lg">
                  Rate Setup
                </h3>

                {formData?.rates?.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="p-4 border border-gray-200 rounded-lg shadow-md relative"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="flex items-center gap-2 font-bold text-gray-700 text-md">
                        <FaGripVertical className="text-gray-400" />
                        Step {rowIndex + 1}
                      </h4>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        disabled={formData?.rates?.length === 1 || isFrozen}
                      >
                        Delete
                      </Button>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                      {primaryFields.map((field) => (
                        <div key={field.name}>
                          <label className="block mb-1 font-medium text-xs">
                            {field.label}
                          </label>
                          {field.type === "checkbox" ? (
                            <input
                              type="checkbox"
                              checked={row[field.name] || false}
                              onChange={() =>
                                updateRow(rowIndex, field.name, !row[field.name])
                              }
                              disabled={isFrozen}
                              className="w-4 h-4"
                            />
                          ) : (
                            <input
                              type={field.type}
                              value={row[field.name] || ""}
                              onChange={(e) =>
                                updateRow(rowIndex, field.name, e.target.value)
                              }
                              disabled={isFrozen}
                              className="px-3 py-2 border rounded focus:ring-1 focus:ring-blue-300 w-full h-10"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button variant="bordered" onClick={addRow} disabled={isFrozen}>
                  ➕ Add New Rate
                </Button>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  className={`bg-blue-600 text-white px-6 py-2 rounded-md ${
                    isFrozen
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700 transition"
                  }`}
                  onClick={handleFormSubmit}
                  disabled={isFrozen}
                >
                  {item?.id ? "Update" : "Add"} Sub Category
                </button>
              </div>
            </div>

            {isFrozen && (
              <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/40 backdrop-blur-sm">
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

export default AddEditSubCategoryModal;
