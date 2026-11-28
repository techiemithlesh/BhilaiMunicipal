import axios from "axios";
import { useEffect, useState } from "react";
import { useLoading } from "../../../contexts/LoadingContext";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import DataTableFullData from "../../../components/common/DataTableFullData";
import PaymentModal from "./PaymentModal";
import LeasePaymentReceiptModal from "./LeasePaymentReceiptModal";
import { leasePaymentApi } from "../../../api/endpoints";
import LeaseDemandReceiptModal from "./LeaseDemandReceiptModal";

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
  const { setIsLoadingGable } = useLoading();  
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (!isFrozen) return;
    setIsLoadingGable(true);
    return () => setIsLoadingGable(false);
  }, [isFrozen]);

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
      console.error("Error fetching lease demand:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const response = await axios.post(leasePaymentApi, paymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.data?.status) {
        onSuccess?.();
        fetchData();
        setPaymentReceiptId(response?.data?.data?.tranId);
        setIsShowPaymentModal(false);
        setIsShowPaymentReceiptModal(true);
        toast.success(response?.data?.message || "Payment Done");
      } else {
        const error = Object.values(response?.data?.errors || {}).flat()[0];
        toast.error(error || response?.data?.message || "Unable to record payment.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to record payment.");
    }
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Demand From", key: "fyear" },
    { label: "Demand Amount", key: "amount" },
    { label: "Penalty", key: "penalty" },
    { label: "Balance", key: "balance" },
  ];

  const renderRow = (item, index) => (
    <tr
      key={item.id ?? index}
      className="hover:bg-gray-50 even:bg-gray-50 odd:bg-white border-t"
    >
      <td className="p-2 border text-center">{index + 1}</td>
      <td className="p-2 border text-center">
        {item?.fyear}
      </td>
      <td className="px-3 py-2 border text-center">{item?.amount}</td>
      <td className="px-3 py-2 border text-center">{item?.penalty}</td>
      <td className="px-3 py-2 border text-center">{item?.balance}</td>
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-white whitespace-nowrap"
            >
              Print Demand Receipt
            </button>
            <button
              type="button"
              className="text-gray-600 hover:text-red-600"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="relative flex-grow overflow-y-auto">
          <div className={`${isFrozen ? "pointer-events-none" : ""}`}>
            <DataTableFullData
              headers={headers}
              renderRow={renderRow}
              data={demandList}
              showingItem={[5, 10, 15, 50, 100, 500, 1000]}
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
                  <div className="flex text-red-500 justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">GST:</span>
                    <span>{demandData?.gST ?? "-"}</span>
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

            {actionType === "Payment" && demandData.demandUptoList?.length > 0 && (
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
              id={id}
              apiUrl={apiUrl}
              demandData={demandData}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setIsShowPaymentModal(false)}
            />
          )}

          {isShowPaymentReceiptModal && (
            <LeasePaymentReceiptModal
              id={paymentReceiptId}
              onClose={() => setIsShowPaymentReceiptModal(false)}
            />
          )}
          {isReceiptOpen && (
            <LeaseDemandReceiptModal id={id} onClose={() => setIsReceiptOpen(false)} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default DemandViewModal;
