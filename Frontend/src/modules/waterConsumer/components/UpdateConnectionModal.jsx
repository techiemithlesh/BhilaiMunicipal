import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { FaTimes } from "react-icons/fa";
import FormCard from "../../../components/common/FormCard";
import {
  waterConsumerUpdateConnectionApi,
  waterMeterTypeListApi,
} from "../../../api/endpoints";
import toast from "react-hot-toast";
import FileUpload from "../../../components/common/FileUpload";

function UpdateConnectionModal({
  onClose,
  onSuccess,
  lastConnectionTypeId,
  connectionDtl = {},
  id,
}) {
  const token = getToken();
  const [meterList, setMeterList] = useState([]);
  const [form, setForm] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [validationError, setValidationError] = useState({});
  const [isFrozen, setIsFrozen] = useState(false); // Added missing state

  // The fetch logic is correct for getting the meter types
  useEffect(() => {
    if (token) {
      fetchMeterTypes();
    }
  }, [token]);

  const fetchMeterTypes = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        waterMeterTypeListApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        setMeterList(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching meter types:", error);
      toast.error("Failed to fetch connection types.");
    } finally {
      setIsFrozen(false);
    }
  };

  // Correct handleChange function for the FormCard
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

  // Correct handleSubmit function for an update action
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.keys(form).forEach((key) => {
      payload.append(key, form[key]);
    });
    if (imageFiles[0]?.file) {
      payload.append("document", imageFiles[0].file);
    }

    setIsFrozen(true);
    payload.append("id", id);
    try {
      const response = await axios.post(
        waterConsumerUpdateConnectionApi,
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

  const formFields = [
    {
      name: "meterTypeId",
      label: "Type of Connection",
      type: "select",
      error: validationError?.meterTypeId || "",
      value: form?.meterTypeId || "",
      required: true,
      options: meterList.map((item) => ({
        label: item.meterType,
        value: item.id,
      })),
    },
    {
      name: "meterNo",
      label: "Meter No.",
      type: "text",
      error: validationError?.meterNo || "",
      value: form?.meterNo || "",
      required: form?.meterTypeId == 1,
      isHidden: form?.meterTypeId != 1,
      placeholder: "Enter Meter No",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
    },
    {
      name: "connectionDate",
      label: "Connection Date",
      type: "date",
      error: validationError?.connectionDate || "",
      value: form?.connectionDate || "",
      required: true,
    },
    {
      name: "initialReading",
      label: "Initial Reading",
      type: "number",
      error: validationError?.initialReading || "",
      value: form?.initialReading || "",
      required: form?.meterTypeId == 1,
      isHidden: form?.meterTypeId != 1,
    },
    {
      name: "lastReading",
      label: "Current Meter Reading",
      type: "number",
      error: validationError?.lastReading || "",
      value: form?.lastReading || "",
      required: lastConnectionTypeId == 1,
      isHidden: lastConnectionTypeId != 1,
    },
  ];

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
            Update Connection
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
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block font-semibold text-gray-700 text-sm">
                  Document
                </label>
                <FileUpload
                  name="document"
                  files={imageFiles}
                  setFiles={setImageFiles}
                  allowMultiple={false}
                  required={true}
                  acceptedFileTypes={["image/png", "image/jpeg", ".pdf"]}
                />
              </div>
            </div>
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

export default UpdateConnectionModal;
