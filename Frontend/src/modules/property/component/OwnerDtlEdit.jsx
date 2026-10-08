import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { propOwnerEditApi } from "../../../api/endpoints";
import toast from "react-hot-toast";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes, FaUser, FaPhoneAlt, FaFileUpload } from "react-icons/fa";

const MAX_FILE_SIZE_MB = 5;

const HIDDEN_FIELDS = ["aadharNo", "panNo", "email", "dob"];
const INLINE_FIELDS = [
  "ownerName",
  "guardianName",
  "relationType",
  "gender",
  "address",
  "mobileNo",
  "remarks",
  "document",
];

const inputClass =
  "block w-full bg-white px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100";

const toFlag = (value) =>
  value === true || value === 1 || value === "1" || value === "true" ? 1 : 0;

const Field = ({ id, label, required, error, hint, className = "", children }) => (
  <div className={className}>
    <label htmlFor={id} className="block mb-1 font-medium text-gray-700 text-sm">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1 text-gray-500 text-xs">{hint}</p>}
    {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
  </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className="flex items-center gap-2 mb-3 font-semibold text-blue-900 text-sm uppercase tracking-wide">
    <Icon className="text-base" />
    {title}
  </h3>
);

export default function OwnerDtlEdit({ propDetails, onClose, onSuccess, token }) {
  const [owners, setOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    if (Array.isArray(propDetails?.owners) && propDetails.owners.length) {
      setOwners(
        propDetails.owners.map((ele) => ({
          ...ele,
          isArmedForce: toFlag(ele.isArmedForce),
          isSpeciallyAbled: toFlag(ele.isSpeciallyAbled),
          remarks: "",
          document: "",
        }))
      );
    }
  }, [propDetails]);

  const handleChange = (ownerId, name, value) => {
    setOwners((prev) =>
      prev.map((owner) =>
        owner.id === ownerId ? { ...owner, [name]: value } : owner
      )
    );
    setErrors((prev) => {
      if (!prev[ownerId]?.[name]) return prev;
      const next = { ...prev, [ownerId]: { ...prev[ownerId] } };
      delete next[ownerId][name];
      return next;
    });
  };

  const handleFile = (ownerId, file) => {
    if (file && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be ${MAX_FILE_SIZE_MB} MB or smaller.`, {
        position: "top-right",
      });
      return;
    }
    handleChange(ownerId, "document", file || "");
  };

  const handleSubmit = async (ownerId) => {
    const payload = { ...owners.find((ele) => ele.id === ownerId) };
    HIDDEN_FIELDS.forEach((key) => delete payload[key]);
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    setSubmittingId(ownerId);
    try {
      const response = await axios.post(propOwnerEditApi, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response?.data?.status) {
        toast.success("Owner details updated successfully!", {
          position: "top-right",
        });
        onSuccess && onSuccess();
        onClose && onClose();
        return;
      }

      const fieldErrors = response?.data?.errors;
      if (fieldErrors) {
        setErrors((prev) => ({
          ...prev,
          [ownerId]: Object.fromEntries(
            Object.entries(fieldErrors).map(([key, msgs]) => [
              key,
              Array.isArray(msgs) ? msgs[0] : msgs,
            ])
          ),
        }));
        toast.error("Please correct the highlighted fields.", {
          position: "top-right",
        });
      } else {
        toast.error(response?.data?.message || "Failed to update owner details.", {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error submitting owner details:", error);
      toast.error("An error occurred while updating owner details.", {
        position: "top-right",
      });
    } finally {
      setSubmittingId(null);
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
        className="flex flex-col bg-white shadow-lg rounded-lg w-full max-w-4xl max-h-[90vh]"
      >
        <div className="flex justify-between items-start bg-blue-900 px-6 py-4 rounded-t-lg text-white">
          <div>
            <h2 className="font-semibold text-xl">Edit Owner Details</h2>
            <p className="mt-1 text-blue-100 text-sm">
              Each owner is updated separately. Fields marked{" "}
              <span className="text-red-300">*</span> are required.
            </p>
          </div>
          <button
            type="button"
            className="text-blue-100 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 gap-6 p-6 min-h-0 overflow-y-auto">
          {owners.map((owner, index) => {
            const err = errors[owner.id] || {};
            const otherErrors = Object.entries(err).filter(
              ([key]) => !INLINE_FIELDS.includes(key)
            );
            const isSubmitting = submittingId === owner.id;
            const fid = (name) => `owner-${owner.id}-${name}`;
            return (
              <div
                key={owner.id ?? index}
                className="shrink-0 border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 border-gray-200 border-b">
                  <span className="flex justify-center items-center bg-blue-900 rounded-full w-7 h-7 font-semibold text-white text-sm">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {owner.ownerName || `Owner ${index + 1}`}
                  </span>
                </div>

                <div className="flex flex-col gap-6 p-5">
                  <section>
                    <SectionTitle icon={FaUser} title="Personal Details" />
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                      <Field id={fid("ownerName")} label="Owner Name" required error={err.ownerName}>
                        <input
                          id={fid("ownerName")}
                          type="text"
                          value={owner.ownerName || ""}
                          onChange={(e) => handleChange(owner.id, "ownerName", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field id={fid("guardianName")} label="Guardian Name" error={err.guardianName}>
                        <input
                          id={fid("guardianName")}
                          type="text"
                          value={owner.guardianName || ""}
                          onChange={(e) => handleChange(owner.id, "guardianName", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field
                        id={fid("relationType")}
                        label="Relation"
                        required={!!owner.guardianName}
                        error={err.relationType}
                      >
                        <select
                          id={fid("relationType")}
                          value={owner.relationType || ""}
                          onChange={(e) => handleChange(owner.id, "relationType", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select Relation</option>
                          {["S/O", "D/O", "W/O", "C/O"].map((rel) => (
                            <option key={rel} value={rel}>
                              {rel}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field id={fid("gender")} label="Gender" required error={err.gender}>
                        <select
                          id={fid("gender")}
                          value={owner.gender || ""}
                          onChange={(e) => handleChange(owner.id, "gender", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select Gender</option>
                          {["Male", "Female", "Other"].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field
                        id={fid("address")}
                        label="Owner Address"
                        error={err.address}
                        className="md:col-span-2"
                      >
                        <input
                          id={fid("address")}
                          type="text"
                          placeholder="Enter Owner Address"
                          value={owner.address || ""}
                          onChange={(e) => handleChange(owner.id, "address", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={FaPhoneAlt} title="Contact" />
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                      <Field id={fid("mobileNo")} label="Mobile No" required error={err.mobileNo} hint="10 digit mobile number">
                        <input
                          id={fid("mobileNo")}
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={owner.mobileNo || ""}
                          onChange={(e) => handleChange(owner.id, "mobileNo", e.target.value.replace(/\D/g, ""))}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={FaFileUpload} title="Reason for Update" />
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                      <Field id={fid("remarks")} label="Remarks" required error={err.remarks} hint="Why is this change needed?">
                        <textarea
                          id={fid("remarks")}
                          rows={3}
                          value={owner.remarks || ""}
                          onChange={(e) => handleChange(owner.id, "remarks", e.target.value)}
                          className={inputClass}
                        />
                      </Field>
                      <Field
                        id={fid("document")}
                        label="Supportive Document"
                        required
                        error={err.document}
                        hint={`PDF, JPG, PNG or BMP, up to ${MAX_FILE_SIZE_MB} MB`}
                      >
                        <input
                          id={fid("document")}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.bmp"
                          onChange={(e) => handleFile(owner.id, e.target.files[0])}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </section>
                </div>

                {otherErrors.length > 0 && (
                  <ul className="bg-red-50 mx-5 mb-4 px-4 py-2 border border-red-200 rounded text-red-600 text-xs list-disc list-inside">
                    {otherErrors.map(([key, msg]) => (
                      <li key={key}>{msg}</li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-end gap-3 bg-gray-50 px-5 py-3 border-gray-200 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="bg-white hover:bg-gray-100 disabled:opacity-50 px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(owner.id)}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-2 rounded-md font-semibold text-white text-sm"
                  >
                    {isSubmitting ? "Updating..." : "Update Owner"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
