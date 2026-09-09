import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { tradePayDemandApi } from "../../../api/endpoints";
import { toast } from "react-hot-toast";

function PaymentModeModal({ open, onClose, onSubmit, loading }) {
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [details, setDetails] = useState({
    chequeNo: "",
    chequeDate: "",
    bankName: "",
    branchName: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPaymentMode("CASH");
    setDetails({
      chequeNo: "",
      chequeDate: "",
      bankName: "",
      branchName: "",
    });
    setErrors({});
  }, [open]);

  const validate = () => {
    const newErrors = {};
    if (paymentMode === "CHEQUE" || paymentMode === "DEMAND DRAFT") {
      if (!details.chequeNo.trim())
        newErrors.chequeNo =
          paymentMode === "CHEQUE"
            ? "Cheque No is required"
            : "DD No is required";
      if (!details.chequeDate.trim()) newErrors.chequeDate = "Date is required";
      if (!details.bankName.trim())
        newErrors.bankName = "Bank Name is required";
      if (!details.branchName.trim())
        newErrors.branchName = "Branch Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.error("Please fill all required fields.");
      return;
    }
    onSubmit(paymentMode, details);
  };

  if (!open) return null;
  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
      <div className="relative bg-white shadow-2xl p-8 border border-blue-100 rounded-xl w-full max-w-sm">
        <button
          className="top-4 right-4 absolute text-gray-500 hover:text-red-600"
          onClick={onClose}
        >
          <FaTimes size={22} />
        </button>
        <h3 className="mb-6 font-bold text-blue-700 text-xl text-center">
          Select Payment Mode
        </h3>
        <select
          className="bg-blue-50 mb-4 p-3 border rounded-lg focus:outline-blue-400 w-full"
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <option value="CASH">Cash</option>
          <option value="CHEQUE">Cheque</option>
          <option value="DEMAND DRAFT">Demand Draft</option>
        </select>
        {(paymentMode === "CHEQUE" || paymentMode === "DEMAND DRAFT") && (
          <div className="space-y-3 mb-4">
            <div>
              <input
                className={`p-3 border rounded-lg w-full ${
                  errors.chequeNo ? "border-red-400" : ""
                }`}
                name="chequeNo"
                placeholder={paymentMode === "CHEQUE" ? "Cheque No" : "DD No"}
                value={details.chequeNo}
                onChange={handleChange}
              />
              {errors.chequeNo && (
                <div className="mt-1 text-red-500 text-xs">
                  {errors.chequeNo}
                </div>
              )}
            </div>
            <div>
              <input
                className={`p-3 border rounded-lg w-full ${
                  errors.chequeDate ? "border-red-400" : ""
                }`}
                name="chequeDate"
                type="date"
                placeholder="Date"
                value={details.chequeDate}
                onChange={handleChange}
              />
              {errors.chequeDate && (
                <div className="mt-1 text-red-500 text-xs">
                  {errors.chequeDate}
                </div>
              )}
            </div>
            <div>
              <input
                className={`p-3 border rounded-lg w-full ${
                  errors.bankName ? "border-red-400" : ""
                }`}
                name="bankName"
                placeholder="Bank Name"
                value={details.bankName}
                onChange={handleChange}
              />
              {errors.bankName && (
                <div className="mt-1 text-red-500 text-xs">
                  {errors.bankName}
                </div>
              )}
            </div>
            <div>
              <input
                className={`p-3 border rounded-lg w-full ${
                  errors.branchName ? "border-red-400" : ""
                }`}
                name="branchName"
                placeholder="Branch Name"
                value={details.branchName}
                onChange={handleChange}
              />
              {errors.branchName && (
                <div className="mt-1 text-red-500 text-xs">
                  {errors.branchName}
                </div>
              )}
            </div>
          </div>
        )}
        <button
          className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-blue-500 hover:to-blue-600 disabled:opacity-60 shadow py-3 rounded-lg w-full font-semibold text-white transition"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Processing..." : "Proceed"}
        </button>
      </div>
    </div>
  );
}

export default function PaymentModal({ id, open, onClose,onSuccess, apiUrl, token }) {
  if (!open) return null;

  const [demandData, setDemandData] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);

  useEffect(() => {
    if (token && id) fetchData();
    // eslint-disable-next-line
  }, [id, token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        apiUrl,
        { id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        setDemandData(response.data.data || {});
      } else {
        toast.success(response?.data?.message || "All Due Are Clear");
        if (onClose) onClose();
      }
    } catch (error) {
      toast.error("Error fetching demand details.");
    } finally {
      setIsFrozen(false);
    }
  };

  const handlePay = () => {
    setShowModeModal(true);
  };

  const handleModeSubmit = async (paymentMode, details) => {
    setIsPaying(true);
    setShowModeModal(false);

    const payload = {
      id,
      paymentType: "FULL",
      paymentMode,
      chequeNo: details.chequeNo || "",
      chequeDate: details.chequeDate || "",
      bankName: details.bankName || "",
      branchName: details.branchName || "",
    };

    // ❌ don't await here, pass the raw Promise
    const myPromise = axios.post(tradePayDemandApi, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.promise(myPromise, {
      loading: "Processing payment...",
      success: (res) => {
        if (res?.data?.status) {
          if(onSuccess)onSuccess();
          if (onClose) onClose();
          return "Payment successful!";
        }
        return res?.data?.message || "Payment failed. Please try again.";
      },
      error: "Payment failed. Please try again.",
    });

    try {
      await myPromise; // ✅ await here so you can finally reset
    } finally {
      setIsPaying(false);
    }
  };

  const {
    rate = {},
    yearDiff,
    monthDiff,
    licenseCharge,
    currentCharge,
    arrearCharge,
    latePenalty,
    totalCharge,
  } = demandData;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
      <div className="relative bg-white shadow-2xl p-8 border border-blue-100 rounded-xl w-full max-w-md">
        <button
          className="top-4 right-4 absolute text-gray-500 hover:text-red-600"
          onClick={onClose}
        >
          <FaTimes size={22} />
        </button>
        <h2 className="mb-6 font-bold text-blue-700 text-2xl text-center">
          Trade Demand Details
        </h2>
        <div className="space-y-3 text-gray-700 text-base">
          <div>
            <span className="font-semibold">Rate:</span> ₹{rate?.rate} per{" "}
            {rate?.fromArea} - {rate?.uptoArea} sqft
          </div>
          <div>
            <span className="font-semibold">Effective From:</span>{" "}
            {rate?.effectiveFrom}
          </div>
          <div>
            <span className="font-semibold">License Charge:</span> ₹
            {licenseCharge}
          </div>
          <div>
            <span className="font-semibold">Current Charge:</span> ₹
            {currentCharge}
          </div>
          <div>
            <span className="font-semibold">Arrear Charge:</span> ₹
            {arrearCharge}
          </div>
          <div>
            <span className="font-semibold">Late Penalty:</span> ₹{latePenalty}
          </div>
          <div>
            <span className="font-semibold">Total Charge:</span>{" "}
            <span className="font-bold text-green-700 text-lg">
              ₹{totalCharge}
            </span>
          </div>
          <div>
            <span className="font-semibold">Year Difference:</span> {yearDiff}
          </div>
          <div>
            <span className="font-semibold">Month Difference:</span> {monthDiff}
          </div>
        </div>
        <button
          className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-blue-500 hover:to-blue-600 disabled:opacity-60 shadow mt-8 py-3 rounded-lg w-full font-semibold text-white transition"
          onClick={handlePay}
          disabled={isPaying || isFrozen}
        >
          {isPaying ? "Processing..." : `Pay ₹${totalCharge}`}
        </button>
        <PaymentModeModal
          open={showModeModal}
          onClose={() => setShowModeModal(false)}
          onSubmit={handleModeSubmit}
          loading={isPaying}
        />
        {(isFrozen || isPaying) && (
          <div className="z-10 absolute inset-0 flex justify-center items-center bg-white bg-opacity-70 rounded-xl">
            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-10 h-10 animate-spin"></span>
            <span className="ml-3 font-semibold text-blue-700">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
