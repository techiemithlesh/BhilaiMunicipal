import axios from "axios";
import { useEffect, useState } from "react";
import { waterConsumerDuePaymentApi } from "../../../api/endpoints";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { FaTimes } from "react-icons/fa";
import PaymentModal from "./PaymentModal";
import toast from "react-hot-toast";
import PaymentReceiptModal from "./PaymentReceiptModal";
import DataTableFullData from "../../../components/common/DataTableFullData";
import { formatLocalDate } from "../../../utils/common"; // Make sure to import this

function DemandViewModal({
  id,
  onClose,
  onSuccess,
  actionType = "view",
  apiUrl,
}) {
  const token = getToken();
  const [demandList, setDemandList] = useState([]);
  const [demandData, setDemandData] = useState({});
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
        { id },
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
    try {
      const response = await axios.post(waterConsumerDuePaymentApi, paymentData, {
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
        setIsShowPaymentModal(false);
        toast.error(response?.data?.message || "Server Error!!!");
      }
    } catch (error) {
      console.error("payment error:", error);
    }
  };


  const headers = [
    { label: "#", key: "serial" },
    { label: "Demand From", key: "demandFrom" },
    { label: "Demand Upto", key: "demandUpto" },
    { label: "Demand Type", key: "meterType" },
    { label: "Demand Amount To", key: "balance" },
    { label: "Penalty", key: "latePenalty" },
    { label: "Total Tax", key: "totalTax" },
  ];

  // **CORRECTION HERE**: The renderRow function should not contain the mapping logic.
  // It should return a single <tr> element.
  const renderRow = (item, index) => (
    <tr key={item.id} className="hover:bg-gray-50 even:bg-gray-50 odd:bg-white border-t">
      <td className="p-2 border text-center">
        {index + 1}
      </td>
      <td className="p-2 border text-center">
        {formatLocalDate(item?.demandFrom)}
      </td>
      <td className="p-2 border text-center">
        {formatLocalDate(item?.demandUpto)}
      </td>
      <td className="p-2 border text-center">{item?.demandType}</td>
      <td className="p-2 border text-center">{item?.balance}</td>
      <td className="p-2 border text-center">{item?.latePenalty}</td>
      <td className="p-2 border text-center">{item?.totalTax}</td>
    </tr>
  );

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">View Demand</h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="relative flex-grow overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <DataTableFullData
              headers={headers}
              renderRow={renderRow} // Pass the rendering function
              data={demandList} // Pass the data for the current page
              showingItem={[5,10,15,50,100,500,1000]}
            />

            <div className="space-y-4 mt-6 text-sm">
              <div>
                <h3 className="mb-2 font-semibold text-blue-900">
                  Main Demand
                </h3>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">Demand:</span>
                    <span>{demandData?.demandAmount ?? "-"}</span>
                  </div>
                  <div className="flex text-red-500 justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">Penalty:</span>
                    <span>{demandData?.latePenalty ?? "-"}</span>
                  </div>
                  <div className="flex text-red-500 justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">Other Penalty:</span>
                    <span>{demandData?.otherPenalty ?? "-"}</span>
                  </div>
                  <div className="flex text-green-500 justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">Advance:</span>
                    <span>{demandData?.advanceAmount ?? "-"}</span>
                  </div>
                </div>
              </div>

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

          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}

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