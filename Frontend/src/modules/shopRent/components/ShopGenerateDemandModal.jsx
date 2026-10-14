import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaTimes } from "react-icons/fa";
import { useLoading } from "../../../contexts/LoadingContext";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { shopRentGenerateDemandApi } from "../../../api/endpoints";

function ShopGenerateDemandModal({ id, consumerNo, onClose, onSuccess }) {
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
        shopRentGenerateDemandApi,
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
            disabled={isFrozen}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className={`space-y-3 text-gray-700 text-sm ${isFrozen ? "pointer-events-none" : ""}`}>
          <p>
            Generate the pending monthly demand for shop{" "}
            <span className="font-semibold text-black">{consumerNo}</span>.
          </p>
          <p className="text-gray-500">
            Demand is created from the month after the last demand up to the end of
            the current financial year.
          </p>
          {error && <p className="text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isFrozen}
            className={`items-center px-4 py-2 rounded text-white ${
              isFrozen ? "btn-secondary" : "btn-primary"
            }`}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isFrozen}
            className="items-center bg-white hover:bg-gray-100 px-4 py-2 border border-gray-300 rounded font-bold text-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ShopGenerateDemandModal;
