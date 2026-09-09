import axios from "axios";
import { useEffect, useState } from "react";
import { waterAppDuePaymentApi } from "../../../api/endpoints";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import PaymentModal from "./PaymentModal";
import toast from "react-hot-toast";
import PaymentReceiptModal from "./PaymentReceiptModal";

function DemandViewModal({
  id,
  onClose,
  onSuccess,
  actionType = "view",
  apiUrl,
  ulbId,
  token,
}) {
  const [demandList, setDemandList] = useState([]);
  const [demandData, setDemandData] = useState({});
  const [paymentForm, setPaymentForm] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [isShowPaymentModal, setIsShowPaymentModal] = useState(false);
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState(null);

  useEffect(() => {
    if (token && id) fetchData();
  }, [id, token]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        apiUrl,
        { id, ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response?.data?.status) {
        setDemandList(response.data.data?.demandList || []);
        setDemandData(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching demand:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    paymentData.id = id;
    setPaymentForm(paymentData);
    try {
      const response = await axios.post(waterAppDuePaymentApi, paymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.data?.status) {
        onSuccess();
        fetchData();
        setPaymentReceiptId(response?.data?.data?.tranId);
        setTimeout(() => {
          setIsShowPaymentModal(false);
        }, 5000);
        setIsShowPaymentReceiptModal(true);
        toast.success(response?.data?.message || "Payment Done");
      } else {
        toast.error(response?.data?.message || "Server Error!!!");
      }
    } catch (error) {
      console.error("payment error:", error);
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
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">View Demand</h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Table Content */}
        <div className="relative flex-grow overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <div className="overflow-x-auto">
              <table className="border rounded min-w-full overflow-hidden text-sm text-left">
                <thead className="top-0 z-10 sticky bg-blue-800 text-white">
                  <tr>
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Charge Type</th>
                    <th className="p-2 border">Connection Fee</th>
                    <th className="p-2 border">Penalty</th>
                    <th className="p-2 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {demandList.length > 0 ? (
                    <>
                      {demandList.map((item, index) => (
                        <tr
                          key={index}
                          className="even:bg-gray-50 odd:bg-white border-t"
                        >
                          <td className="p-2 border text-center">
                            {index + 1}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.chargeFor}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.connFee}
                          </td>

                          <td className="p-2 border text-center">
                            {item?.penalty}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.amount}
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <tr>
                      <td
                        colSpan="21"
                        className="p-4 text-gray-500 text-center"
                      >
                        No documents found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="space-y-4 mt-6 text-sm">
              {/* Main Group */}
              <div>
                <h3 className="mb-2 font-semibold text-blue-900">
                  Main Demand
                </h3>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">Demand:</span>
                    <span>{demandData?.connectionFee ?? "-"}</span>
                  </div>
                  <div className="flex justify-between bg-gray-100 px-3 py-2 rounded text-red-500">
                    <span className="font-medium">Penalty:</span>
                    <span>{demandData?.realizationPenalty ?? "-"}</span>
                    {demandData?.description && (
                      <span className="text-green-400">
                        {" "}
                        [{demandData?.description ?? "-"}]
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Payable */}
              <div>
                <h3 className="mb-2 font-semibold text-black">Total</h3>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div className="flex justify-between bg-yellow-200 px-3 py-2 rounded font-semibold text-red-700">
                    <span>Total Payable Amount:</span>
                    <span>{demandData?.payableAmount ?? "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment div */}
            {actionType === "Payment" && demandData?.payableAmount > 0 && (
              <div className="mt-6 text-right">
                <button
                  onClick={() => setIsShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white"
                >
                  Pay Now
                </button>
              </div>
            )}
          </div>

          {isShowPaymentModal && (
            <PaymentModal
              demandData={demandData}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setIsShowPaymentModal(false)}
            />
          )}

          {/* Frozen Overlay */}
          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}

          {/* Payment receipt div */}
          {isShowPaymentReceiptModal && (
            <PaymentReceiptModal
              id={paymentReceiptId}
              onClose={() => setIsShowPaymentReceiptModal(false)}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default DemandViewModal;
