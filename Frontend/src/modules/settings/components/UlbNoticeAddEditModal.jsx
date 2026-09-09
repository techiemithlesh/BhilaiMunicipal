import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { noticeAddApi, noticeDtlApi, noticeEditApi } from '../../../api/endpoints';
import { Spinner } from '@nextui-org/react';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import toast from 'react-hot-toast';
import InputField from '../../../components/common/InputField';

function UlbNoticeAddEditModal({
    item,
    onClose,
    onSuccess,
}) {

    const token = getToken();
    const [isLoading, setIsLoading] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [formData, setFormData] = useState({});

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (token && item?.id) {
            fetchInitialData();
        }
    }, [token, item]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                noticeDtlApi,
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
                    doc: "",
                });
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
            const api = item?.id ? noticeEditApi : noticeAddApi;
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
                            {item?.id ? "Update" : "Add"} Notice
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
                            <div className="gap-4 grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1">
                                <InputField
                                    label="Notice Date"
                                    name="noticeDate"
                                    type='date'
                                    value={formData.noticeDate ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.noticeDate}
                                />
                                <div>
                                    <label htmlFor="subject" className='block font-semibold text-gray-700 text-sm' >Subject</label>
                                    <textarea
                                        className={`w-full mt-1 p-2 border ${errors?.subject ? "border-red-500" : "border-gray-300"
                                            } rounded-md`}
                                        name="subject"
                                        id="subject"
                                        rows={5}
                                        cols={70}
                                        minLength={15}
                                        placeholder="Enter Subject"
                                        onChange={handleInputChange}
                                        value={formData.subject || ""}
                                    />
                                    {errors?.subject && <p className="mt-1 text-red-500 text-sm">{errors?.subject}</p>}

                                </div>
                                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    <div>
                                        {/* <label className="block font-semibold text-gray-700 text-sm">
                                            Document
                                        </label>
                                        <FileUpload
                                            name="doc"
                                            files={docFiles}
                                            setFiles={setDocFiles}
                                            allowMultiple={false}
                                            acceptedFileTypes={["PDF","image/png", "image/jpeg"]}
                                        /> */}
                                        <label htmlFor="doc" className="block text-gray-700">
                                            Document
                                        </label>
                                        <input
                                            type="file"
                                            id="doc"
                                            name="doc"
                                            className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
                                            onChange={handleInputChange}
                                        />
                                        {errors?.doc && (
                                            <span className="text-red-500">{errors?.doc}</span>
                                        )}
                                    </div>
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

export default UlbNoticeAddEditModal
