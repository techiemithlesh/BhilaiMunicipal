import { useState } from "react";
import { getToken } from "../../../utils/auth";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import FormCard from "../../../components/common/FormCard";
import { formatLocalDate } from "../../../utils/common";
import { waterConsumerDemandGenerateApi } from "../../../api/endpoints";
import FileUpload from "../../../components/common/FileUpload";
import axios from "axios";
import toast from "react-hot-toast";

function GenerateDemandModal({ onClose, onSuccess, lastConnectionDtl, id }) {
  const token = getToken();
  const today = new Date().toISOString().split("T")[0]; // Gets today's date in YYYY-MM-DD format
  const [maxDate] = useState(today);
  const [meterList, setMeterList] = useState([]);
  const [form, setForm] = useState({ currentDate: today });
  const [imageFiles, setImageFiles] = useState([]);
  const [validationError, setValidationError] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);

  const formFields = [
    {
      name: "meterTypeId",
      label: "Type of Connection",
      type: "text",
      error: validationError?.meterTypeId || "",
      value: lastConnectionDtl?.connectionType || "",
      required: false,
      isDisabled: true,
    },
    {
      name: "meterNo",
      label: "Meter No.",
      type: "text",
      error: validationError?.meterNo || "",
      value: lastConnectionDtl?.meterNo || "",
      required: false,
      isDisabled: true,
    },
    {
      name: "connectionDate",
      label: "Connection Date",
      type: "date",
      error: validationError?.connectionDate || "",
      value: lastConnectionDtl?.connectionDate || "",
      required: false,
      isDisabled: true,
    },
    {
      name: "currentDate",
      label: "Demand Upto Date",
      type: "date",
      error: validationError?.currentDate || "",
      value: form?.currentDate || "",
      required: true,
      max: maxDate,
    },
    {
      name: "lastReading",
      label: "Current Meter Reading",
      type: "number",
      error: validationError?.lastReading || "",
      value: form?.lastReading || "",
      required: lastConnectionDtl?.meterTypeId == 1,
      isHidden: lastConnectionDtl?.meterTypeId != 1,
    },
  ];

  const handleChange = (name, value) => {
    setForm((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "meterTypeId" && value != 1) {
        updated = { ...updated, meterNo: "", initialReading: "" };
      }
      return updated;
    });
    // Clear the specific validation error when the field changes
    if (validationError && validationError[name]) {
      setValidationError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.keys(form).forEach((key) => {
      payload.append(key, form[key]);
    });
    if (imageFiles[0]?.file) {
      payload.append("meterImg", imageFiles[0].file);
    }

    setIsFrozen(true);
    payload.append("id", id);
    try {
      const response = await axios.post(
        waterConsumerDemandGenerateApi,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        toast.success(response?.data?.message || "Connection Changed");
        onSuccess?.(payload);
      } else {
        toast.error(response?.data?.message || "Server Error!!!");
        setValidationError(response?.data?.errors);
      }
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update connection.");
    } finally {
      setIsFrozen(false);
    }
  };
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">
            Generate Demand
          </h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="relative flex-grow overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            {/* The form card now correctly uses the form state and handleSubmit */}
            <FormCard
              formFields={formFields}
              onChange={handleChange}
              onSubmit={handleSubmit}
              buttonLabel="Update Connection"
            />
            {lastConnectionDtl?.meterTypeId == 1 && (
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block font-semibold text-gray-700 text-sm">
                    Meter Img
                  </label>
                  <FileUpload
                    name="meterImg"
                    files={imageFiles}
                    setFiles={setImageFiles}
                    allowMultiple={false}
                    required={true}
                    acceptedFileTypes={["image/png", "image/jpeg", "image/jpg"]}
                  />
                  {validationError?.meterImg && (
                    <div className="mt-1 text-red-600 text-xs">
                      {validationError?.meterImg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 col-span-full mt-5">
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            >
              Cancel
            </button>
          </div>

          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default GenerateDemandModal;
