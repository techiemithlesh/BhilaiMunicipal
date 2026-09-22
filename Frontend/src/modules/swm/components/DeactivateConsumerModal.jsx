import React, { useState } from 'react';
import { getToken } from '../../../utils/auth';
import { toastMsg } from '../../../utils/utils';
import { Button, Spinner } from '@nextui-org/react';
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { modalVariants } from "../../../utils/motionVariable";
import FileUpload from '../../../components/common/FileUpload';
import axios from 'axios';
import { swmConsumerDeactivateApi } from '../../../api/endpoints';

function DeactivateConsumerModal({ id, onSubmit, onClose }) {

    const [form, setForm] = useState({});
    const [formError, setFormError] = useState({}); // Fixed: Initialized as an object instead of an array
    const [isFrozen, setIsFrozen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [document, setDocument] = useState([]);
    const token = getToken();

    const handleChange = (e) => { // Fixed typo in name
        const { name, value, type, checked } = e.target;
        let newValue = value;
        if (type === "checkbox") {
            newValue = checked;
        }
        setForm((prev) => ({
            ...prev,
            [name]: newValue
        }));
        
        if (formError && formError[name]) {
            setFormError((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const isModalFormValid = () => {
        const { remarks } = form;
        if (!remarks || remarks.trim() === "") return false;
        if (!document[0]?.file) {
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!isModalFormValid()) {
            toastMsg("Please fill all required fields.", 'error');
            return;
        }
        
        if (window.confirm("Are you sure you want to deactivate?")) {
            const payload = {
                ...form,
                id: id 
            };

            const formData = new FormData();
            formData.append("document", document[0]?.file);
            for (const name in payload) {
                if (Object.prototype.hasOwnProperty.call(payload, name)) {
                    formData.append(name, payload[name]);
                }
            }

            setIsFrozen(true);
            try {
                const response = await axios.post(swmConsumerDeactivateApi, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                if (response?.data?.status) {
                    toastMsg(response?.data?.message || "Successfully deactivated!", "success"); // Fixed: Replaced missing 'toast' object with 'toastMsg'
                    onClose();
                    onSubmit?.(); // Refresh the table after update
                } else if (response?.data?.errors) {
                    toastMsg(response?.data?.message || "Validation Error", "error");
                    setFormError(response?.data?.errors);
                } else {
                    toastMsg(response?.data?.message || "An unknown error occurred.", "error");
                }
            } catch (error) {
                console.error(error);
                toastMsg("An API error occurred.", "error");
            } finally {
                setIsFrozen(false);
            }
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
                    className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-6xl max-h-[95vh]"
                >
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h2 className="font-bold text-blue-600 text-lg">
                            Deactivate Consumer
                        </h2>
                        <button onClick={onClose}>
                            <FaTimes size={20} className="text-gray-500 hover:text-red-500" />
                        </button>
                    </div>
                    
                    <div className="relative flex-grow pr-2 overflow-y-auto">
                        <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""} w-full space-y-4`}>
                            <div className="gap-4 grid grid-cols-4">
                                <div>
                                    <label className="block mb-2 font-semibold text-sm">
                                        Supporting Document <span className="text-red-500">*</span>
                                    </label>
                                    <FileUpload
                                        className="pt-1"
                                        name="document"
                                        files={document}
                                        setFiles={setDocument}
                                        allowMultiple={false}
                                        acceptedFileTypes={[
                                            "image/png",
                                            "image/jpeg",
                                            "image/jpg",
                                            "image/bmp",
                                            "application/pdf",
                                        ]}
                                    />
                                    {formError?.document && (
                                        <span className="text-red-400 text-sm">
                                            {formError?.document}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block mb-1 font-semibold text-sm">
                                        Remarks <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form?.remarks || ""}
                                        name="remarks"
                                        onChange={handleChange}
                                        className="p-2 border rounded w-full"
                                        required
                                        disabled={isFrozen}
                                    />
                                    {formError?.remarks && (
                                        <span className="text-red-400 text-sm">
                                            {formError?.remarks}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isFrozen && (
                            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 rounded">
                                <Spinner label="Processing..." color="primary" />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-4 pt-4 border-t">
                        <Button
                            color="primary"
                            className="px-6"
                            isDisabled={!isModalFormValid() || isFrozen}
                            onPress={handleSubmit}
                            isLoading={isFrozen}
                        >
                            Proceed
                        </Button>
                        <Button
                            color="danger"
                            variant="light"
                            onPress={onClose}
                            disabled={isFrozen}
                            className="ml-3"
                        >
                            Close
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default DeactivateConsumerModal;