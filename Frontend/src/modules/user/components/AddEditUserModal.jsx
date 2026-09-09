import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import {
  getWardListApi,
  roleApi,
  userByIdApi,
  getReportToApi,
  getUserWardMapApi,
} from "../../../api/endpoints";
import { Spinner } from "@nextui-org/react";
import { modalVariants } from "../../../utils/motionVariable";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import FileUpload from "../../../components/common/FileUpload";
import Select from "react-select";
import toast from "react-hot-toast";

function AddEditUserModal({ user, onClose, onSuccess }) {
  const token = getToken();

  const [isLoading, setIsLoading] = useState(true);
  const [rollList, setRollList] = useState([]);
  const [ulbWardList, setUlbWardList] = useState([]);
  const [reportTo, setReportTo] = useState([]);
  const [errors, setErrors] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [signatureFiles, setSignatureFiles] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
    guardianName: "",
    phoneNo: "",
    roleId: "",
    userFor: "",
    reportTo: "",
    maxLoginAllow: 1,
    userImgDoc: null,
    signatureImgDoc: null,
    wardIds: [],
  });

  const [userImgPreview, setUserImgPreview] = useState();
  const [signatureImgPreview, setSignatureImgPreview] = useState();

  const roleOptions = rollList.map((role) => ({
    value: role.id,
    label: role.roleName,
    userFor: role.userFor,
  }));

  const reportToOptions = reportTo.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  const fetchWardList = async () => {
    try {
      const res = await axios.get(getWardListApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: "all" },
      });
      if (res.data.status) setUlbWardList(res.data.data);
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };

  const fetchUserWardMap = async () => {
    try {
      const res = await axios.post(
        getUserWardMapApi,
        { userId: user?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status) {
        const wardIds = res.data.data.map((val) => parseInt(val.id));
        setSelectedWards(wardIds);
        setFormData((prev) => ({ ...prev, wardIds }));
      }
    } catch (error) {
      console.error("Error fetching user wards:", error);
    }
  };

  const fetchReportTo = async (roleId) => {
    setIsFrozen(true);
    try {
      const res = await axios.get(getReportToApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { roleId },
      });
      if (res.data.status) {
        setReportTo(res.data.data);
        if (res.data.data.length === 0) {
          setFormData((prev) => ({ ...prev, reportTo: "" }));
        }
      }
    } catch (error) {
      console.error("Error fetching report to:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const res = await axios.get(`${userByIdApi}/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status) {
        const data = res.data.data;
        setFormData({
          email: data.email || "",
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          lastName: data.lastName || "",
          guardianName: data.guardianName || "",
          phoneNo: data.phoneNo || "",
          roleId: data.roleId || "",
          userFor: data.userFor || "",
          reportTo: data.reportTo || "",
          maxLoginAllow: data.maxLoginAllow || 1,
          userImgDoc: null,
          signatureImgDoc: null,
          wardIds: [],
        });

        setUserImgPreview(data?.userImg);
        setSignatureImgPreview(data?.signatureImg);
        if (data?.roleId) fetchReportTo(data?.roleId);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const roleRes = await axios.get(roleApi, {
        headers: { Authorization: `Bearer ${token}` },
        params: { all: "all" },
      });
      setRollList(roleRes.data.data);

      await fetchWardList();

      if (user?.id) {
        await fetchUserDetails();
        await fetchUserWardMap();
      }
    } catch (error) {
      console.error("Error during initial data fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInitialData();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const reader = new FileReader();

      reader.onload = function (e) {
        if (name === "userImgDoc" && e.target.result)
          setUserImgPreview(e.target.result);
        if (name === "signatureImgDoc" && e.target.result)
          setSignatureImgPreview(e.target.result);
      };

      reader.readAsDataURL(files[0]);
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: files[0],
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: value,
      }));
    }

    if (errors && errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleWardChange = (e) => {
    const value = parseInt(e.target.value);
    const updated = e.target.checked
      ? [...selectedWards, value]
      : selectedWards.filter((v) => v !== value);

    setSelectedWards(updated);
    setFormData((prev) => ({ ...prev, wardIds: updated }));
  };

  const selectAllWard = (e) => {
    const isChecked = e.target.checked;
    if (!isChecked) {
      setSelectedWards([]);
    } else {
      const allWardIds = ulbWardList.map((item) => parseInt(item?.id));
      setSelectedWards(allWardIds);
    }
  };

  const handleRoleChange = (selected) => {
    const roleId = selected?.value || "";
    const userFor = selected?.userFor || "";

    setFormData((prev) => ({
      ...prev,
      roleId,
      userFor,
    }));

    if (roleId) fetchReportTo(roleId);
  };

  const handleFormSubmit = async () => {
    const form = new FormData();

    Object.keys(formData).forEach((key) => {
      if (
        key !== "wardIds" &&
        formData[key] !== null &&
        formData[key] !== undefined
      ) {
        form.append(key, formData[key]);
      }
    });

    selectedWards.forEach((id, index) => {
      form.append(`wardIds[${index}]`, id);
    });

    if (imageFiles[0]?.file) {
      form.append("userImgDoc", imageFiles[0].file);
    }

    if (signatureFiles[0]?.file) {
      form.append("signatureImgDoc", signatureFiles[0].file);
    }
    setIsFrozen(true);
    try {
      const res = await axios.post(`${userByIdApi}/${user?.id || ""}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status === true) {
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
          <div className="flex flex-shrink-0 justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              {user?.id ? "Update" : "Add"} User
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
              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={errors?.firstName}
                />
                <InputField
                  label="Middle Name"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  error={errors?.middleName}
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={errors?.lastName}
                />
                <InputField
                  label="Guardian Name"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  error={errors?.guardianName}
                />
                <InputField
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={errors?.email}
                />
                <InputField
                  label="Phone No."
                  type="number"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleInputChange}
                  error={errors?.phoneNo}
                />
                <div>
                  <label className="block font-semibold text-gray-700 text-sm">
                    Role Type
                  </label>
                  <Select
                    name="roleId"
                    value={roleOptions.find(
                      (opt) => opt.value === formData.roleId
                    )}
                    onChange={handleRoleChange}
                    options={roleOptions}
                    placeholder="Select Role"
                    isClearable
                  />
                  {errors?.roleId&&(
                    <span className="text-red-500">{errors?.roleId}</span>
                  )}
                </div>
                <InputField
                  label="User For"
                  name="userFor"
                  value={formData.userFor}
                  onChange={handleInputChange}
                  disabled
                  error={errors?.userFor}
                />
                <InputField
                  label="Max Login"
                  type="number"
                  name="maxLoginAllow"
                  value={formData.maxLoginAllow}
                  onChange={handleInputChange}
                  error={errors?.maxLoginAllow}
                />
                {reportTo.length > 0 && (
                  <div>
                    <label className="block font-semibold text-gray-700 text-sm">
                      Report To
                    </label>
                    <Select
                      name="reportTo"
                      value={reportToOptions.find(
                        (opt) => opt.value === formData.reportTo
                      )}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          reportTo: selected?.value || "",
                        }))
                      }
                      options={reportToOptions}
                      placeholder="Select User"
                      isClearable
                    />
                    {errors?.reportTo&&(
                      <span className="text-red-500">{errors?.reportTo}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Select Ward <input type="checkbox" onChange={selectAllWard} />
                </label>
                {errors?.wardIds&&(
                  <span className="text-red-500">{errors?.wardIds}</span>
                )}
                <div className="gap-2 grid grid-cols-4 p-2 border border-gray-200 rounded">
                  {ulbWardList.map((ward) => (
                    <label
                      key={ward.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={ward.id}
                        checked={selectedWards.includes(ward.id)}
                        onChange={handleWardChange}
                      />
                      <span>{ward.wardNo}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

                <div className="mb-4">
                  <label htmlFor="userImgDoc" className="block text-gray-700">
                    Profile Img
                  </label>
                  <input
                    type="file"
                    id="userImgDoc"
                    name="userImgDoc"
                    className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
                    onChange={handleInputChange}
                  />
                  <img
                    src={userImgPreview ? userImgPreview : formData.userImgDoc}
                    className="w-44 h-44 img-fluid"
                    alt={formData.userName}
                  />
                  {errors.userImgDoc && <span className="text-red-400">{errors.userImgDoc}</span>}
                </div>

                <div className="mb-4">
                  <label htmlFor="signatureImgDoc" className="block text-gray-700">
                    Signature Img
                  </label>
                  <input
                    type="file"
                    id="signatureImgDoc"
                    name="signatureImgDoc"
                    className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
                    onChange={handleInputChange}
                  />
                  <img
                    src={
                      signatureImgPreview
                        ? signatureImgPreview
                        : formData.signatureImgDoc
                    }
                    style={{ width: "100px", height: "100px" }}
                    alt={formData.userName}
                  />
                  {errors.signatureImgDoc && <span className="text-red-400">{errors.signatureImgDoc}</span>}
                </div>
                {/* <div>
                  <label className="block font-semibold text-gray-700 text-sm">
                    User Image
                  </label>
                  <FileUpload
                    name="userImgDoc"
                    files={imageFiles}
                    setFiles={setImageFiles}
                    allowMultiple={false}
                    acceptedFileTypes={["image/png", "image/jpeg"]}
                  />
                  {errors?.userImgDoc&&(
                    <span className="text-red-500">{errors?.userImgDoc}</span>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 text-sm">
                    Signature
                  </label>
                  <FileUpload
                    name="signatureImgDoc"
                    files={signatureFiles}
                    setFiles={setSignatureFiles}
                    allowMultiple={false}
                    acceptedFileTypes={["image/png", "image/jpeg"]}
                  />
                  {errors?.signatureImgDoc&&(
                    <span className="text-red-500">{errors?.signatureImgDoc}</span>
                  )}
                </div> */}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  className={`bg-blue-600 text-white px-6 py-2 rounded-md ${
                    isLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700 transition"
                  }`}
                  onClick={handleFormSubmit}
                  disabled={isLoading}
                >
                  {user?.id ? "Update" : "Add"} User
                </button>
              </div>

              {Object.keys(errors).map((key) => (
                <li key={key} className="text-red-500 text-sm">
                  {key +
                    ": " +
                    (Array.isArray(errors[key])
                      ? errors[key].join(", ")
                      : String(errors[key]))}
                </li>
              ))}
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

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false,
  error="",
}) => (
  <div>
    <label htmlFor={name} className="block font-semibold text-gray-700 text-sm">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      disabled={disabled}
      className="mt-1 p-2 border border-gray-300 rounded-md w-full"
    />
    {error&&(
      <span className="text-red-500">{error}</span>
    )}
  </div>
);

export default AddEditUserModal;
