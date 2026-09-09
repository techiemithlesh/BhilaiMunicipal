import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";
import { validateForm } from "../../../utils/validation";
import toast from "react-hot-toast";
import { Spinner } from "@nextui-org/react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import InputField from "../../../components/common/InputField";
import {
  getOccupancyTypeAddApi,
  getOccupancyTypeDtlApi,
  getOccupancyTypeEditApi,
} from "../../../api/endpoints";

function PropertyOccupancyTypeModal({ item, onClose, onSuccess }) {
  const token = getToken();
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [formData, setFormData] = useState({});

  const validationRules = {
    occupancyName: {
      required: true,
      regex: /^[A-Za-z0-9\-\,\_\s]+$/,
      message: "Usage Type must contain only letters and spaces.",
    },
    multFactor: {
      required: true,
      regex: /^(?:[0-9]*\.?[0-9]+)$/,
      message: "Only numeric values are allowed (integer or decimal).",
    },
  };

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
        getOccupancyTypeDtlApi,
        {
          id: item?.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        setFormData({
          ...response?.data?.data,
        });
      }
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFormSubmit = async () => {
    const clientErrors = validateForm(formData, validationRules);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      ...formData,
      ...(item?.id && { id: item.id }),
    };

    const api = item?.id ? getOccupancyTypeEditApi : getOccupancyTypeAddApi;
    setIsFrozen(true);

    try {
      const res = await axios.post(api, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res?.data?.status) {
        toast.success(res.data.message);
        onClose();
        onSuccess();
      } else {
        setErrors(res.data.errors || {});
      }
    } catch (err) {
      console.error("Submit error", err);
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
          className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-6xl max-h-[95vh]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              {item?.id ? "Update" : "Add"} Menu
            </h2>
            <button onClick={onClose}>
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
                  label="OccupancyType"
                  name="occupancyName"
                  value={formData.occupancyName ?? ""}
                  onChange={handleInputChange}
                  error={errors.occupancyName}
                />
                <InputField
                  label="Multi Factor"
                  name="multFactor"
                  type="number"
                  value={formData.multFactor ?? ""}
                  onChange={handleInputChange}
                  error={errors.multFactor}
                />
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
  );
}

export default PropertyOccupancyTypeModal;
