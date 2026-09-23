import { useState } from "react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

function PaymentModal({ demandData, onSubmit, onCancel }) {
  const [form, setForm] = useState({ paymentType: "FULL" });
  const [isFrozen, setIsFrozen] = useState(false);
  const isNonCash = form.paymentMode && form.paymentMode !== "CASH";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (confirm("Are Sure Want To Pay?")) {
      if (
        isNonCash &&
        (!form.chequeNo ||
          !form.chequeDate ||
          !form.bankName ||
          !form.branchName)
      ) {
        toast.error("Please fill all cheque/DD/NEFT/RTGS details.");
        return;
      }

      const payload = {
        paymentMode: form.paymentMode,
        paymentType: form.paymentType,
        amount:
          form.paymentType === "PART"
            ? form.amount ?? "0"
            : demandData?.payableAmount ?? "0",

        ...(isNonCash && {
          chequeNo: form.chequeNo,
          chequeDate: form.chequeDate,
          bankName: form.bankName,
          branchName: form.branchName,
        }),
      };
      setIsFrozen(true);
      onSubmit?.(payload);
    }
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.4 }}
        className="relative bg-white shadow-lg p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-blue-900 text-xl">Make Payment</h2>
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-red-600"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        >
          {/* Payment Type */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-sm">Payment Type</label>
            <select
              value={form.paymentType || ""}
              onChange={(e) =>
                setForm({ ...form, paymentType: e.target.value })
              }
              required
              className="px-3 py-2 border rounded"
            >
              <option value="" disabled>
                Select Type
              </option>
              <option value="FULL">Full</option>
              <option value="PART">Partial</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-sm">Payment Mode</label>
            <select
              value={form.paymentMode || ""}
              onChange={(e) =>
                setForm({ ...form, paymentMode: e.target.value })
              }
              required
              className="px-3 py-2 border rounded"
            >
              <option value="" disabled>
                Select Mode
              </option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="DD">DD</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
            </select>
          </div>

          {/* Amount */}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-sm">Amount</label>
            <input
              type="number"
              value={
                form.paymentType === "PART"
                  ? form.amount ?? ""
                  : demandData?.payableAmount ?? ""
              }
              step="any"
              min={0.01}
              max={demandData?.payableAmount}
              onChange={(e) =>
                form.paymentType === "PART" &&
                setForm({ ...form, amount: e.target.value })
              }
              readOnly={form.paymentType !== "PART"}
              required
              className={`border rounded px-3 py-2 ${
                form.paymentType !== "PART" ? "bg-gray-100 text-gray-700" : ""
              }`}
            />
          </div>

          {/* Non-Cash Fields */}
          {isNonCash && (
            <>
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">
                  Cheque/DD/Ref No
                </label>
                <input
                  type="text"
                  value={form.chequeNo || ""}
                  onChange={(e) =>
                    setForm({ ...form, chequeNo: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">
                  Cheque/DD Date
                </label>
                <input
                  type="date"
                  value={form.chequeDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, chequeDate: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">Bank Name</label>
                <input
                  type="text"
                  value={form.bankName || ""}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-sm">Branch Name</label>
                <input
                  type="text"
                  value={form.branchName || ""}
                  onChange={(e) =>
                    setForm({ ...form, branchName: e.target.value })
                  }
                  required
                  className="px-3 py-2 border rounded"
                />
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 col-span-full mt-5">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
            >
              Pay Now
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Loading Overlay */}
        {isFrozen && (
          <div className="z-20 absolute inset-0 flex justify-center items-center bg-white/70">
            <span className="font-medium text-gray-800 text-lg">
              Processing...
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default PaymentModal;
