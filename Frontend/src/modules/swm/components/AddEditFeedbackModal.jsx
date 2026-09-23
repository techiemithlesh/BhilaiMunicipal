import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { swmFeedbackAddApi, swmFeedbackDtlApi, swmFeedbackEditApi } from '../../../api/endpoints';
import toast from 'react-hot-toast';
import { Spinner } from '@nextui-org/react';
import { modalVariants } from "../../../utils/motionVariable";
import { motion } from "framer-motion";
import { FaTimes } from 'react-icons/fa';
import InputField from '../../../components/common/InputField';

function AddEditFeedbackModal({ item, onClose, onSuccess }) {
    const token = getToken();    
    const [isLoading, setIsLoading] = useState(true);
    const [isFrozen, setIsFrozen] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
      if (token) fetchInitialData();
    }, [token]);

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        if (item?.id) {
          const response = await axios.post(swmFeedbackDtlApi,{id:item?.id},{headers:{Authorization: `Bearer ${token}`,}});
          if(response?.data?.status){
            setFormData(response?.data?.data);
          }
        }
      } catch (error) {
        console.error("Error during initial data fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors && errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    };

    const handleFormSubmit = async () => {
      setIsFrozen(true);
      try {
        const url = item?.id ? swmFeedbackEditApi : swmFeedbackAddApi;
        const res = await axios.post(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.status) {
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
              {item?.id ? "Update" : "Add"} Feedback
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
                  label="Feedback"
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleInputChange}
                  error={errors?.feedback}
                />
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
                  {item?.id ? "Update" : "Add"} Feedback
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
  )
}

export default AddEditFeedbackModal
