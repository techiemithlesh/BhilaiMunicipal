import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { useLoading } from "../../../contexts/LoadingContext";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { leaseRentGenerateDemandApi } from "../leaseEndpoints";

function LeaseGenerateDemandModal({ id, consumerNo, onClose, onSuccess }) {
  const token = getToken();
  const { setIsLoadingGable } = useLoading();
  const [isFrozen, setIsFrozen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isFrozen) return;
    setIsLoadingGable(true);
    return () => setIsLoadingGable(false);
  }, [isFrozen]);

  const handleSubmit = async () => {
    setError("");
    setIsFrozen(true);
    try {
      const response = await axios.post(
        leaseRentGenerateDemandApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        toast.success(response.data.message || "Demand Generated");
        onSuccess?.();
      } else {
        setError(response?.data?.message || "Unable to generate demand.");
      }
    } catch (err) {
      console.error("Generate demand failed:", err);
      setError("Unable to generate demand.");
    } finally {
      setIsFrozen(false);
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
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">Generate Demand</h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className={isFrozen ? "pointer-events-none opacity-60" : ""}>
          <p className="text-gray-700 text-sm">
            Generate demand for lease consumer{" "}
            <strong className="text-gray-900">{consumerNo || id}</strong>?
          </p>

          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded font-medium text-gray-800 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isFrozen}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-5 py-2 rounded font-medium text-white text-sm"
            >
              Generate
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LeaseGenerateDemandModal;
