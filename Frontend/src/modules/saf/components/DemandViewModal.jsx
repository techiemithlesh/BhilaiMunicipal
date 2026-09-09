import axios from "axios";
import { useEffect, useState } from "react";
import { safPaymentApi } from "../../../api/endpoints";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { FaTimes } from "react-icons/fa";
import { formatLocalDate } from "../../../utils/common";
import PaymentModal from "./PaymentModal";
import toast from "react-hot-toast";
import PaymentReceiptModal from "./PaymentReceiptModal";
import { isArray } from "lodash";
import DemandPrintModal from "./DemandPrintModal";
import NttDataPayment from "./NttDataPayment";

function DemandViewModal({
  id,
  onClose,
  onSuccess,
  actionType = "view",
  apiUrl,
  submitApiUrl,
}) {

  const token = getToken();
  const [demandList, setDemandList] = useState([]);
  const [demandData, setDemandData] = useState({});
  const [isFrozen, setIsFrozen] = useState(false);
  const [isShowPaymentModal, setIsShowPaymentModal] = useState(false);
  const [isShowOnlinePaymentModal, setIsShowOnlinePaymentModal] = useState(false);
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);

  const [isDemandPrintModal, setIsDemandPrintModal] = useState(false);
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
      const response = await axios.post(submitApiUrl, paymentData, {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <h2 className="font-semibold text-blue-900 text-xl">
            View Demand
          </h2>

          <div className="flex items-center gap-3">
            {demandData?.totalPayableAmount > 0 && (
              <button
                onClick={() => setIsDemandPrintModal(true)}
                className="bg-blue-300 hover:bg-blue-400 px-6 py-2 rounded text-white"
              >
                Print Demand
              </button>
            )}

            <button
              className="text-gray-600 hover:text-red-600"
              onClick={onClose}
            >
              <FaTimes size={20} />
            </button>
          </div>
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
                    <th className="p-2 border" rowSpan={2}>
                      #
                    </th>
                    <th className="p-2 border" rowSpan={2}>
                      Fyear/Qtr
                    </th>
                    <th className="p-2 border" rowSpan={2}>
                      Due Date
                    </th>
                    <th className="p-2 border" colSpan={7}>
                      Tax
                    </th>
                    <th className="p-2 border" colSpan={7}>
                      Due
                    </th>
                    <th className="p-2 border" rowSpan={2}>
                      Month Deference
                    </th>
                    <th className="p-2 border" rowSpan={2}>
                      Penalty
                    </th>
                    <th className="p-2 border" rowSpan={2}>
                      Total Due
                    </th>
                  </tr>
                  <tr>
                    <th className="p-2 border">Holding Tax</th>
                    <th className="p-2 border">Latrine Tax</th>
                    <th className="p-2 border">Water Tax</th>
                    <th className="p-2 border">HealthCess Tax</th>
                    <th className="p-2 border">EducationCess Tax</th>
                    <th className="p-2 border">RWH Tax</th>
                    <th className="p-2 border">Total Tax</th>

                    <th className="p-2 border">Holding Tax</th>
                    <th className="p-2 border">Latrine Tax</th>
                    <th className="p-2 border">Water Tax</th>
                    <th className="p-2 border">HealthCess Tax</th>
                    <th className="p-2 border">EducationCess Tax</th>
                    <th className="p-2 border">RWH Tax</th>
                    <th className="p-2 border">Total Tax</th>
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
                            {item?.fyear}/{item?.qtr}
                          </td>
                          <td className="p-2 border text-center">
                            {formatLocalDate(item?.dueDate)}
                          </td>

                          <td className="p-2 border text-center">
                            {item?.holdingTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.latrineTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.waterTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.healthCessTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.educationCessTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.rwhTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.totalTax}
                          </td>

                          <td className="p-2 border text-center">
                            {item?.dueHoldingTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.dueLatrineTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.dueWaterTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.dueHealthCessTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.dueEducationCessTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.dueRwhTax}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.balanceTax}
                          </td>

                          <td className="p-2 border text-center">
                            {item?.monthDiff}
                          </td>
                          <td className="p-2 border text-center">
                            {item?.monthlyPenalty}
                          </td>
                          <td className="p-2 border text-center">
                            {parseFloat(item?.balanceTax ?? 0) +
                              parseFloat(item?.monthlyPenalty ?? 0)}
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
                <tfoot>
                  {demandData?.grantTax && (
                    <tr className="bg-black border-t text-white">
                      <td className="p-2 border text-center" colSpan={3}>
                        Total
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.holdingTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.latrineTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.waterTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.healthCessTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.educationCessTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.rwhTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.totalTax}
                      </td>

                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.dueHoldingTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.dueLatrineTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.dueWaterTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.dueHealthCessTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.dueEducationCessTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.dueRwhTax}
                      </td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.balanceTax}
                      </td>

                      <td className="p-2 border text-center">-</td>
                      <td className="p-2 border text-center">
                        {demandData?.grantTax?.monthlyPenalty}
                      </td>
                      <td className="p-2 border text-center">
                        {parseFloat(demandData?.grantTax?.balanceTax ?? 0) +
                          parseFloat(demandData?.grantTax?.monthlyPenalty ?? 0)}
                      </td>
                    </tr>
                  )}
                </tfoot>
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
                    <span className="font-medium">Current Demand:</span>
                    <span>{demandData?.currentDemandAmount ?? "-"}</span>
                  </div>
                  <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">Arrear Demand:</span>
                    <span>{demandData?.arrearDemandAmount ?? "-"}</span>
                  </div>
                   <div className="flex justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="font-medium">SWM Amount:</span>
                    <span>{demandData?.swmPayableAmount ?? "-"}</span>
                  </div>
                </div>
              </div>

              {/* Penalty Group */}
              <div>
                <h3 className="mb-2 font-semibold text-red-600">Penalties</h3>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">                  
                  <div className="flex justify-between bg-red-100 px-3 py-2 rounded">
                    <span className="font-medium">Monthly Penalty:</span>
                    <span>{demandData?.monthlyPenalty ?? "-"}</span>
                  </div>
                  {/* <div className="flex justify-between bg-red-100 px-3 py-2 rounded">
                    <span className="font-medium">Other Penalty:</span>
                    <span>{demandData?.otherPenalty ?? "-"}</span>
                  </div> */}
                  {demandData?.otherPenaltyList?.map((penalty, idx) => (
                    <div key={idx} className="flex justify-between bg-red-100 px-3 py-2 rounded">
                      <span className="font-medium">
                        {penalty?.penaltyType}:
                      </span>
                      <span>{penalty?.penaltyAmt ?? "-"}</span>
                    </div>
                  ))}
                  
                </div>
              </div>

              {/* Additional Tax */}
              {isArray(demandData?.additionalTaxList) && demandData?.additionalTaxList?.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-red-600">Additonal Tax</h3>                
                  {demandData?.additionalTaxList?.map((tax, idx) => (
                    <div key={idx} className="flex justify-between bg-red-100 px-3 py-2 rounded">
                      <span className="font-medium">
                        {tax?.taxType}:
                      </span>
                      <span>{tax?.amount ?? "-"}</span>
                    </div>
                  ))}
                  
              </div>
              )}

              {/* Rebate Group */}
              <div>
                <h3 className="mb-2 font-semibold text-green-700">Rebates</h3>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div className="flex justify-between bg-green-100 px-3 py-2 rounded">
                    <span className="font-medium">Special Rebate:</span>
                    <span>{demandData?.specialRebate ?? "-"}</span>
                  </div>
                  <div className="flex justify-between bg-green-100 px-3 py-2 rounded">
                    <span className="font-medium">JSK Rebate:</span>
                    <span>{demandData?.jskRebate ?? "-"}</span>
                  </div>
                  <div className="flex justify-between bg-green-100 px-3 py-2 rounded">
                    <span className="font-medium">Online Rebate:</span>
                    <span>{demandData?.onlineRebate ?? "-"}</span>
                  </div>
                  <div className="flex justify-between bg-green-100 px-3 py-2 rounded">
                    <span className="font-medium">First Qtr Rebate:</span>
                    <span>{demandData?.firstQuatreRebate ?? "-"}</span>
                  </div>

                </div>
              </div>

              {/* Total Payable */}
              <div>
                <h3 className="mb-2 font-semibold text-black">Total</h3>
                <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  <div className="flex justify-between bg-yellow-200 px-3 py-2 rounded font-semibold text-red-700">
                    <span>Total Payable Amount:</span>
                    <span>{demandData?.totalPayableAmount ?? "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment div */}
            {actionType === "Payment" && demandData?.totalPayableAmount > 0 && (
              <div className="mt-6 text-right">
                <button
                  onClick={() => setIsShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white"
                >
                  Pay Now
                </button>
                {/* <button
                  onClick={() => setIsShowOnlinePaymentModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white"
                >
                  Pay Online
                </button> */}
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
          {isShowOnlinePaymentModal &&(
            <NttDataPayment
              id={id}
              demandData={demandData}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setIsShowOnlinePaymentModal(false)}
            />
          )}
          {isDemandPrintModal &&(
            <DemandPrintModal 
              id={id}
              onClose={()=>setIsDemandPrintModal(false)}
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
