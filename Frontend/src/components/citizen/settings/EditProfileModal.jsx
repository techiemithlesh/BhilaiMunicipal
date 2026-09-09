import { useEffect, useState } from "react";
import { FaTimes, FaPhone, FaEnvelope, FaUser, FaUserTie } from "react-icons/fa";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import defaultAvatar from "../../../assets/images/default-avatar.jpg";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import { toastMsg } from "../../../utils/utils";
import { citizenEditProfileApi, citizenProfileApi } from "../../../api/endpoints";

function EditProfileModal({ onClose,  onSuccess }) {
  const token = getToken();
  const [isFrozen, setIsFrozen] = useState(false);
  const[user,setUser] = useState({});
  const [formData, setFormData] = useState({
    firstName:  "",
    middleName: "",
    lastName:  "",
    guardianName: "",
    phoneNo: "",
    email: "",
    userImgDoc: null, // will hold File object
    previewImg:  null, // for preview
  });

  const [errors, setErrors] = useState({});

  useEffect(()=>{
    if(token){
      fetchUserInfo();
    }
  },[token])

  const fetchUserInfo = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(
        citizenProfileApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res?.data?.data) {
        const userData = res.data.data;
        setUser(userData);
        setFormData({
          firstName: userData.firstName || "",
          middleName: userData.middleName || "",
          lastName: userData.lastName || "",
          guardianName: userData.guardianName || "",
          phoneNo: userData.phoneNo || "",
          email: userData.email || "",
          userImgDoc: null,
          previewImg: userData.userImg || null,
        });
      }
    } catch (err) {
      console.error("User info fetch error:", err);
    }finally{
      setIsFrozen(false);
    }
  };

  const validateField = (name, value) => {
    if (!value) return "";

    switch (name) {
      case "firstName":
        return value.length < 2 ? "First name must be at least 2 characters" : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email format" : "";
      case "phoneNo":
        return !/^[6-9]\d{9}$/.test(value) ? "Invalid phone number" : "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const errorMsg = validateField(name, value);

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        userImgDoc: file,
        previewImg: URL.createObjectURL(file),
      }));
      setErrors((prev) => ({ ...prev, userImgDoc: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toastMsg("Please correct validation errors", "error");
      return;
    }
    setIsFrozen(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) data.append(key, value);
      });

      const response = await axios.post(citizenEditProfileApi, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data?.status) {
        toastMsg(response?.data?.message || "Profile updated successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toastMsg(response?.data?.message || "Update failed", "error");
        if (response?.data?.errors) setErrors(response.data.errors);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toastMsg("Something went wrong. Please try again.", "error");
    }finally{
      setIsFrozen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-800 bg-opacity-50 backdrop-blur-sm p-3 sm:p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center sticky top-0 bg-white border-b p-4 sm:p-5 rounded-t-2xl z-10">
          <h2 className="font-bold text-xl sm:text-2xl text-gray-800 flex items-center gap-2">
            <FaUserTie className="text-indigo-600" />
            Edit Profile
          </h2>
          <button
            className="text-gray-600 hover:text-red-500 transition"
            onClick={onClose}
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${
                isFrozen ? "pointer-events-none filter blur-sm" : ""
              } p-5 sm:p-8 space-y-8`}>
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-28 h-28">
              <img
                src={formData.previewImg || defaultAvatar}
                alt="User"
                className="w-full h-full object-cover rounded-full shadow-md border-4 border-indigo-100"
              />
              <label
                htmlFor="userImg"
                className="absolute bottom-1 right-1 bg-indigo-600 text-white text-xs rounded-full px-2 py-1 cursor-pointer hover:bg-indigo-700"
              >
                Edit
              </label>
              <input
                id="userImg"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800">
              {formData.firstName || "Your Name"}
            </h3>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={errors.firstName} />
            <InputField label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
            <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
            <InputField label="Guardian Name" name="guardianName" value={formData.guardianName} onChange={handleChange} icon={<FaUser className="text-indigo-500" />} />
            <InputField label="Phone No" name="phoneNo" value={formData.phoneNo} onChange={handleChange} icon={<FaPhone className="text-green-500" />} error={errors.phoneNo} />
            <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} icon={<FaEnvelope className="text-blue-500" />} error={errors.email} />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFrozen}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
            >
              Save Changes
            </button>
          </div>
          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 rounded">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

function InputField({ label, name, value, onChange, icon, type = "text", error }) {
  return (
    <div>
      <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">
        {label}
      </label>
      <div className={`flex items-center gap-2 bg-gray-50 rounded-lg p-2 shadow-sm focus-within:ring-2 ${error ? "ring-red-400" : "focus-within:ring-indigo-400"} transition`}>
        {icon && <span className="text-lg">{icon}</span>}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent outline-none w-full text-gray-800 font-medium"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default EditProfileModal;
