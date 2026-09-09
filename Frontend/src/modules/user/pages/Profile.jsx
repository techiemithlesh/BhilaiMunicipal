import { useEffect, useState } from "react";
import AdminLayout from "../../../layout/AdminLayout";
import { Spinner } from "@nextui-org/react";
import useUserProfileAndWardMapped from "../../../hooks/UseUserProfile";
import {
  validateEmail,
  validateFirstName,
  validateMiddleName,
  validatePhoneNo,
} from "../../../utils/validation";
import {
  editLoginUserApi,
  getUserProfileUpdateUrl,
} from "../../../api/endpoints";
import axios from "axios";
import { getToken } from "../../../utils/auth";
import toast from "react-hot-toast";

const Profile = () => {
  const { profile, isLoading, error } = useUserProfileAndWardMapped();

  const token = getToken();

  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    guardianName: "",
    email: "",
    phoneNo: "",
    designation: "",
    userFor: "",
    userImgDoc: null,
    signatureImgDoc: null,
    userName: "",
    employeeCode: "",
  });

  const [userImgPreview, setUserImgPreview] = useState();
  const [signatureImgPreview, setSignatureImgPreview] = useState();

  const [errors, setErrors] = useState({
    firstName: "",
    userFor: "",
    middleName: "",
    lastName: "",
    guardianName: "",
    email: "",
    phoneNo: "",
    designation: "",
    userImgDoc: null,
    signatureImgDoc: null,
    userName: "",
    employeeCode: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        id: profile.id,
        firstName: profile.firstName || "",
        userFor: profile.userFor || "",
        middleName: profile.middleName || "",
        lastName: profile.lastName || "",
        guardianName: profile.guardianName || "",
        email: profile.email || "",
        phoneNo: profile.phoneNo || "",
        designation: profile.designation || "",
        // userImgDoc: profile.userImg || "",
        // signatureImgDoc: profile.signatureImg || "",
        userName: profile.userName || "",
        employeeCode: profile.employeeCode || "",
      });
      setUserImgPreview(profile?.userImg);
      setSignatureImgPreview(profile?.signatureImg);
    }
  }, [profile]);

  const validateField = (name, value) => {
    let errorMessage = "";

    if (!value) {
      return null;
    }

    switch (name) {
      case "firstName":
        errorMessage = validateFirstName(value);
        break;
      case "email":
        errorMessage = validateEmail(value);
        break;
      case "phoneNo":
        errorMessage = validatePhoneNo(value);
        break;
      default:
        break;
    }

    return errorMessage;
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const reader = new FileReader();

      reader.onload = function (e) {
        if (name === "userImgDoc" && e.target.result)
          setUserImgPreview(e.target.result);
        else {
          // setUserImgPreview(profile.userImg);
        }
        if (name === "signatureImgDoc" && e.target.result)
          setSignatureImgPreview(e.target.result);
        // else
        //   setUserImgPreview(profile.signatureImg);
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

    const errorMessage = validateField(
      name,
      type === "file" ? files[0] : value
    );

    setErrors((prevErros) => ({
      ...prevErros,
      [name]: errorMessage,
    }));
  };

  const userId = formData.id;
  const updateUrl = editLoginUserApi + `/${userId}`;

  const handleSubmit = () => {
    const data = new FormData();

    for (const key in formData) {
      data.append(key, formData[key]);
    }

    try {
      axios
        .post(updateUrl, data, {
          headers: {
            "Content-Type": "Multipart/Form-Data",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (res.data.status === true) {
            const data = res.data;
            toast.success(data.message, {
              position: "top-right",
            });
          } else {
            setErrors(res.data.errors);
          }
        });
    } catch (error) {
      setErrors(error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>Error fetching data ....</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-white shadow-md p-6 rounded-lg profile-card">
        <h2 className="mb-4 font-semibold text-2xl">Profile</h2>
        <form className="gap-4 grid grid-cols-1 md:grid-cols-4">
          <div className="mb-4">
            <label htmlFor="employeeCode" className="block text-gray-700">
              Employee Code
            </label>
            <input
              type="text"
              id="employeeCode"
              name="employeeCode"
              value={formData.employeeCode}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
              disabled
            />
            {errors?.employeeCode && (
              <span className="text-red-400">{errors?.employeeCode}</span>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="userName" className="block text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              disabled
              onChange={handleInputChange}
              readOnly
            />
            {errors?.userName && (
              <span className="text-red-400">{errors?.userName}</span>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="first_name" className="block text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="firstName"
              value={formData.firstName}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {errors?.firstName && (
              <span className="text-red-400">{errors?.firstName}</span>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="middle_name" className="block text-gray-700">
              Middle Name
            </label>
            <input
              type="text"
              id="middle_name"
              name="middleName"
              value={formData.middleName}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {errors?.middleName && (
              <span className="text-red-400">{errors?.middleName}</span>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="last_name" className="block text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="lastName"
              value={formData.lastName}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {errors?.lastName && (
              <span className="text-red-400">{errors?.lastName}</span>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="guardianName" className="block text-gray-700">
              Guardian Name
            </label>
            <input
              type="text"
              id="guardianName"
              name="guardianName"
              value={formData.guardianName}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {error?.guardianName && (
              <span className="text-red-400">{error?.guardianName}</span>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {errors?.email && (
              <span className="text-red-400">{errors?.email}</span>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="phoneNo" className="block text-gray-700">
              Phone No
            </label>
            <input
              type="tel"
              name="phoneNo"
              value={formData.phoneNo}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {errors?.phoneNo && (
              <span className="text-red-400">{errors?.phoneNo}</span>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="designation" className="block text-gray-700">
              Designation
            </label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
              onChange={handleInputChange}
            />
            {errors?.designation && (
              <span className="text-red-400">{errors?.designation}</span>
            )}
          </div>

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
            {/* {formData.userImgDoc && (
            )} */}
            {/* {errors.userImg && <span className="text-red-400">{errors.userImg}</span>} */}
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
            {/* {formData.signatureImgDoc && ( */}
            <img
              src={
                signatureImgPreview
                  ? signatureImgPreview
                  : formData.signatureImgDoc
              }
              style={{ width: "100px", height: "100px" }}
              alt={formData.userName}
            />
            {/* )} */}
            {/* {errors.signatureImg && <span className="text-red-400">{errors.signatureImg}</span>} */}
          </div>
        </form>
        <div className="text-center">
          <button
            className="px-4 py-2 border-large btn-primary"
            onClick={handleSubmit}
          >
            Update Profile
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
