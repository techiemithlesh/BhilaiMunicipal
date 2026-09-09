import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { officerAddApi, officerDtlApi, officerEditApi } from '../../../api/endpoints';
import InputField from '../../../components/common/InputField';
import { Spinner } from '@nextui-org/react';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';
import { getToken } from '../../../utils/auth';

const UlbOfficerAddEditModal = ({ item, onClose, onSuccess }) => {

    const token = getToken();
    const [isLoading, setIsLoading] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [userImgPreview, setUserImgPreview] = useState();

    useEffect(() => {
        if (token && item?.id) {
            fetchInitialData();
        }
    }, [token, item]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                officerDtlApi,
                {
                    id: item?.id,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response?.data?.status) {
                const data = response.data.data;
                setFormData({
                    ...data,
                    img: "",
                });
                setUserImgPreview(data?.imgPath);
            }
        } catch (err) {
            console.error("Error loading data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            const reader = new FileReader();

            reader.onload = function (e) {
                if (name === "img" && e.target.result)
                setUserImgPreview(e.target.result);
            }
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
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const handleFormSubmit = async () => {
        const form = new FormData();

        Object.keys(formData).forEach((key) => {
            form.append(key, formData[key]);
        });
        setIsFrozen(true);
        try {
            const api = item?.id ? officerEditApi : officerAddApi;
            const res = await axios.post(api, form, {
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
                    className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-4xl max-h-[95vh]"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">
                            {item?.id ? "Update" : "Add"} Officer
                        </h2>
                        <button onClick={onClose}>
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="relative flex-grow pr-2 overflow-y-auto">
                        <div
                            className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""
                                } w-full space-y-4`}
                        >
                            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <InputField
                                    label="Officer Name"
                                    name="officerName"
                                    type='text'
                                    value={formData.officerName ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.officerName}
                                />
                                <InputField
                                    label="Designation"
                                    name="designation"
                                    type='text'
                                    value={formData.designation ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.designation}
                                />
                                <InputField
                                    label="Contact No."
                                    name="contactNo"
                                    type='tel'
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    value={formData.contactNo ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.contactNo}
                                />
                                <InputField
                                    label="Email"
                                    name="email"
                                    type='email'
                                    value={formData.email ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.email}
                                />
                                <InputField
                                    label="Showing Position"
                                    name="slNo"
                                    type='int'
                                    value={formData.slNo ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.slNo}
                                />
                            </div>
                                
                            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="mb-4">
                                    <label htmlFor="img" className="block text-gray-700">
                                        Officer Img
                                    </label>
                                    <input
                                        type="file"
                                        id="img"
                                        name="img"
                                        className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
                                        onChange={handleInputChange}
                                    />
                                    <img
                                        src={userImgPreview ? userImgPreview : formData.img}
                                        className="w-44 h-44 img-fluid"
                                        alt={formData.officerName}
                                    />
                                    {errors.img && <span className="text-red-400">{errors.img}</span>}
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
    )
}

export default UlbOfficerAddEditModal
