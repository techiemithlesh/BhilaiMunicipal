import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { deactivatePropertyApi } from "../../../api/endpoints";
import {getToken} from "../../../utils/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function DeactivateHoldingModal({ propDetails, onCloseModal, onSuccess }) {
  const [file, setFile] = useState(null);
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const token =  getToken();

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "Only PDF, JPG, PNG or Word documents are allowed.",
      }));
      setFile(null);
      e.target.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        file: "File size must be 10 MB or less.",
      }));
      setFile(null);
      e.target.value = "";
      return;
    }

    setErrors((prev) => ({ ...prev, file: "" }));
    setFile(selected);
  };

  const validate = () => {
    const newErrors = {};

    if (!file) {
      newErrors.file = "Please upload a document before deactivating.";
    } else if (file.size > MAX_FILE_SIZE) {
      newErrors.file = "File size must be 10 MB or less.";
    }

    if (!remark.trim()) {
      newErrors.remarks = "Remark is required.";
    } else if (remark.trim().length < 10) {
      newErrors.remark = "Remark must be at least 10 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const handleDeactivate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("document", file);
      formData.append("remarks", remark.trim());
      formData.append("id", propDetails?.id);

      const res = await axios.post(
        deactivatePropertyApi, 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res?.data?.status) {
        toast.success("Deactivation submitted!");
        onCloseModal();
        onSuccess();
      }else if(res?.data?.errors){
        setErrors(res?.data?.errors);
        toast.error(res?.data?.message || "Validation failed.");
      } else {
        toast.error(res?.data?.message || "Deactivation failed. Please try again.");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="z-50 fixed inset-0 flex justify-center items-center py-10"
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        background: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="z-10 relative bg-white shadow-2xl p-8 border border-blue-300 rounded-3xl w-full max-w-lg max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <h2 className="font-bold text-red-700 text-2xl text-center tracking-wide">
          Deactivate Holding
        </h2>

        {/* Property Info */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 shadow-md mb-6 p-5 border border-blue-200 rounded-2xl text-sm">
          <h3 className="flex items-center gap-2 mb-3 font-bold text-blue-800 text-lg">
            🏠 Property Details
          </h3>

          <div className="gap-x-6 gap-y-3 grid grid-cols-2">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Holding No
              </span>
              <span className="font-medium text-blue-900">
                {propDetails?.holdingNo || "NA"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Owner
              </span>
              <span className="font-medium text-blue-900">
                {propDetails?.owners?.[0]?.ownerName || "NA"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Property Type
              </span>
              <span className="font-medium text-blue-900">
                {propDetails?.propertyType || "NA"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Khata No
              </span>
              <span className="font-medium text-blue-900">
                {propDetails?.khataNo || "NA"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Plot No
              </span>
              <span className="font-medium text-blue-900">
                {propDetails?.plotNo || "NA"}
              </span>
            </div>

            <div className="flex flex-col col-span-2">
              <span className="text-gray-500 text-xs uppercase tracking-wide">
                Address
              </span>
              <span className="font-medium text-blue-900 leading-relaxed">
                {propDetails?.propAddress || "NA"},{" "}
                {propDetails?.propCity || "NA"}, {propDetails?.propDist || "NA"}
                , {propDetails?.propState || "NA"},{" "}
                {propDetails?.propPinCode || "NA"}
              </span>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700 text-sm">
            Upload Document <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-gray-400 text-xs">
              (PDF/JPG/PNG/DOC, max 10 MB)
            </span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            className={`block file:bg-blue-600 file:hover:bg-blue-700 file:px-4 file:py-2 border rounded-lg file:rounded-lg w-full file:font-semibold file:text-white text-sm transition cursor-pointer ${
              errors.file ? "border-red-400" : "border-gray-300"
            }`}
          />
          {file && (
            <p className="mt-2 font-medium text-blue-600 text-xs">
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
          {errors.file && (
            <p className="mt-1 text-red-500 text-xs">{errors.file}</p>
          )}
        </div>

        {/* Remark */}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700 text-sm">
            Remark <span className="text-red-500">*</span>
          </label>
          <textarea
            value={remark}
            onChange={(e) => {
              setRemark(e.target.value);
              if (errors.remark) setErrors((prev) => ({ ...prev, remarks: "" }));
            }}
            placeholder="Enter reason for deactivation..."
            maxLength={500}
            className={`shadow mt-1 p-3 border focus:border-blue-500 rounded-lg focus:ring focus:ring-blue-200 w-full text-sm resize-none ${
              errors.remarks ? "border-red-400" : "border-blue-300"
            }`}
            rows={3}
          />
          <div className="flex justify-between mt-1">
            {errors.remarks ? (
              <p className="text-red-500 text-xs">{errors.remark}</p>
            ) : (
              <span />
            )}
            <span className="text-gray-400 text-xs">{remark.length}/500</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 mt-2">
          <button
            onClick={onCloseModal}
            disabled={loading}
            className="bg-white hover:bg-gray-100 disabled:opacity-50 px-5 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 hover:from-red-700 to-red-500 hover:to-red-600 disabled:opacity-60 shadow px-5 py-2 rounded-lg font-bold text-white transition disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}