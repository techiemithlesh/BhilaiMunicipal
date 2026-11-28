import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEye, FaFileInvoiceDollar } from "react-icons/fa";
import HeaderCard from "../../../components/common/HeaderCard";
import SectionCard from "../../../components/common/SectionCard";
import DataTableFullData from "../../../components/common/DataTableFullData";
import ActionButton from "../../../components/common/ActionButton";
import { useLoading } from "../../../contexts/LoadingContext";
import {
  leaseRentDueApi,
  leaseRentUpdateHoldingApi,
} from "../leaseEndpoints";
import { getToken } from "../../../utils/auth";
import { formatLocalDate } from "../../../utils/common";
import LeaseDemandHistoryModal from "../components/LeaseDemandHistoryModal";
import LeaseGenerateDemandModal from "../components/LeaseGenerateDemandModal";
import LeasePaymentReceiptModal from "../components/LeasePaymentReceiptModal";
import DemandViewModal from "../components/DemandViewModal";
import { DUMMY_LEASE_DETAILS } from "../dummyLeaseData";
import { leaseDtlApi } from "../../../api/endpoints";
import { toastMsg } from "../../../utils/utils";

const isUrl = (value) => /^https?:\/\//i.test(value || "");

function LeaseDetails() {
  const { id } = useParams();
  const token = getToken();
  const { setIsLoadingGable } = useLoading();

  const [appData, setAppData] = useState(null);
  const [notFound, setNotFound] = useState("");
  const [holdingInput, setHoldingInput] = useState("");
  const [isUpdatingHolding, setIsUpdatingHolding] = useState(false);

  const [isDemandHistoryOpen, setIsDemandHistoryOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isGenerateDemandOpen, setIsGenerateDemandOpen] = useState(false);
  const [receiptTranId, setReceiptTranId] = useState(null);

  const fetchDetails = async () => {
    setIsLoadingGable(true);
    try {
      const response = await axios.post(
        leaseDtlApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response.data.data;
        setAppData(data);
        setHoldingInput(data?.holdingNo || "");
        setNotFound("");
      }
    } catch (error) {
      console.warn("Using dummy lease details fallback:", error);
      setNotFound("");
    } finally {
      setIsLoadingGable(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, token]);

  const handleHoldingUpdate = async () => {
    if (!holdingInput.trim()) {
      toastMsg("Please enter Holding No.","error");
      return;
    }
    setIsUpdatingHolding(true);
    try {
      const response = await axios.post(
        leaseRentUpdateHoldingApi,
        { id, holdingNo: holdingInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        toast.success(response.data.message || "Holding No updated successfully.");
        fetchDetails();
      } else {
        toast.error(response?.data?.message || "Unable to update Holding No.");
      }
    } catch (error) {
      console.error("Failed to update Holding No:", error);
      toast.error("An error occurred while updating Holding No.");
    } finally {
      setIsUpdatingHolding(false);
    }
  };

  const demandGenerated = () => {
    setIsGenerateDemandOpen(false);
    fetchDetails();
  };

  if (!appData) {
    return notFound ? (
      <div className="bg-white shadow p-6 border border-blue-800 rounded-lg text-gray-600 text-center">
        {notFound}
      </div>
    ) : null;
  }

  const primaryOwner = (appData.owners && appData.owners[0]) || {};
  const consumerName = appData.consumerName || primaryOwner.ownerName || "NA";
  const guardianName = appData.guardianName || primaryOwner.guardianName || "NA";
  const mobileNo = appData.mobileNo || primaryOwner.mobileNo || "NA";
  const relation = appData.relationType || primaryOwner.relationType || "NA";

  const width = appData.width ?? 0;
  const length = appData.length ?? 0;
  const totalArea = appData.totalArea ?? 0;

  const rents = [...(appData.leaseRents || appData.shopRents || [])].sort((a, b) =>
    String(b.effectiveDate || b.leaseStartDate || "").localeCompare(
      String(a.effectiveDate || a.leaseStartDate || "")
    )
  );

  const canGenerateDemand = appData.userPermission?.canGenerateDemand ?? true;

  const actions = [
    {
      label: "View Demand",
      onClick: () => setIsDemandHistoryOpen(true),
      icon: <FaEye />,
      show: true,
    },
    {
      label: "Make Payment",
      onClick: () => setIsPaymentOpen(true),
      icon: <FaEye />,
      show: true,
    },
    {
      label: "Generate Demand",
      onClick: () => setIsGenerateDemandOpen(true),
      icon: <FaFileInvoiceDollar />,
      show: canGenerateDemand && !appData.lockStatus,
      className: "bg-red-600 hover:bg-red-700",
    },
  ];

  return (
    <div className="mx-auto container">
      <div className="flex flex-col gap-5">
        {appData.lockStatus && (
          <HeaderCard statusText="Lease Deactivated" statusColor="text-red-500" />
        )}

        {/* Consumer / Lessee Details (Matching Image Layout) */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800 text-base">
              Lease Consumer Details
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-2.5 font-semibold text-gray-700 w-44">Ward No.</td>
                  <td className="px-2 py-2.5 text-gray-500 w-4">:</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    {appData.wardNo || "NA"}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700 w-44 border-l border-gray-200">
                    Consumer No.
                  </td>
                  <td className="px-2 py-2.5 text-gray-500 w-4">:</td>
                  <td className="px-4 py-2.5 font-bold text-gray-900">
                    {appData.leaseNo || "NA"}
                  </td>
                </tr>
                {/* <tr className="border-b border-gray-200">
                  <td className="px-4 py-2.5 font-semibold text-gray-700">Consumer Name</td>
                  <td className="px-2 py-2.5 text-gray-500">:</td>
                  <td className="px-4 py-2.5 text-gray-800">{consumerName}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700 border-l border-gray-200">
                    Guardian&apos;s Name
                  </td>
                  <td className="px-2 py-2.5 text-gray-500">:</td>
                  <td className="px-4 py-2.5 text-gray-800">{guardianName}</td>
                </tr> */}
                {/* <tr className="border-b border-gray-200">
                  <td className="px-4 py-2.5 font-semibold text-gray-700">Mobile No.</td>
                  <td className="px-2 py-2.5 text-gray-500">:</td>
                  <td className="px-4 py-2.5 text-gray-800">{mobileNo}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700 border-l border-gray-200">
                    Relation
                  </td>
                  <td className="px-2 py-2.5 text-gray-500">:</td>
                  <td className="px-4 py-2.5 text-gray-800">{relation}</td>
                </tr> */}
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-gray-700 align-top">
                    Holding No
                  </td>
                  <td className="px-2 py-2.5 text-gray-500 align-top">:</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col items-start gap-2">
                      <input
                        type="text"
                        value={holdingInput}
                        onChange={(e) => setHoldingInput(e.target.value)}
                        placeholder="Enter Holding No"
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleHoldingUpdate}
                        disabled={isUpdatingHolding}
                        className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 px-3 py-1 rounded text-white text-xs font-semibold uppercase tracking-wide"
                      >
                        {isUpdatingHolding ? "Updating..." : "UPDATE"}
                      </button>
                      {appData.holdingNo && appData.propertyDetailId && (
                        <a
                          href={`/property/details/${appData.propertyDetailId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs underline"
                        >
                          View Property ({appData.holdingNo})
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700 align-top border-l border-gray-200">
                    Address
                  </td>
                  <td className="px-2 py-2.5 text-gray-500 align-top">:</td>
                  <td className="px-4 py-2.5 text-gray-800 align-top">
                    {appData.address || "NA"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Area Details (Matching Image Layout) */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-700 px-1">Area Details</h3>
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-700 w-48">
                      Nigam Lease No.
                    </td>
                    <td className="px-2 py-2.5 text-gray-500 w-4">:</td>
                    <td colSpan={4} className="px-4 py-2.5 font-bold text-gray-900">
                      {appData.leaseRegNo||"-"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-700">Area Name</td>
                    <td className="px-2 py-2.5 text-gray-500">:</td>
                    <td className="px-4 py-2.5 text-gray-800">
                      {appData.areaName || "-"}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-700 w-44 border-l border-gray-200">
                      Use of land
                    </td>
                    <td className="px-2 py-2.5 text-gray-500 w-4">:</td>
                    <td className="px-4 py-2.5 text-gray-800">
                      {appData.usageType || "-"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-700">
                      Area Dimensions
                    </td>
                    <td className="px-2 py-2.5 text-gray-500">:</td>
                    <td className="px-4 py-2.5 text-gray-800">
                      W ({appData?.width}) <span className="text-gray-500">X</span> L ({appData?.length}) mtrs
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-700 border-l border-gray-200">
                      Total Area
                    </td>
                    <td className="px-2 py-2.5 text-gray-500">:</td>
                    <td className="px-4 py-2.5 text-gray-800">
                      {(appData?.width||0) * (appData?.length||0)} mtrs<sup>2</sup>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-700">Plot Address</td>
                    <td className="px-2 py-2.5 text-gray-500">:</td>
                    <td colSpan={4} className="px-4 py-2.5 text-gray-800">
                      {appData.plotAddress || appData.address || "NA"}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-2.5 font-semibold text-gray-700">Lease Amount</td>
                    <td className="px-2 py-2.5 text-gray-500">:</td>
                    <td colSpan={4} className="px-4 py-2.5 font-bold text-gray-900">
                      {Number(appData.leaseAmount ?? appData.monthlyRate ?? 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-gray-700">
                      Lease Start Date
                    </td>
                    <td className="px-2 py-2.5 text-gray-500">:</td>
                    <td colSpan={4} className="px-4 py-2.5 font-bold text-gray-900">
                      {formatLocalDate(appData.leaseStartDate || appData.allotmentDate) || "NA"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Additional Owners (if multiple lessees exist) */}
        {Array.isArray(appData.owners) && appData.owners.length > 0 && (
          <SectionCard
            title="Lessee / Consumer Details"
            headers={["SL", "Consumer Name", "Guardian's Name", "Relation", "Mobile No"]}
            data={appData.owners}
            renderRow={(owner, idx) => (
              <tr key={owner.id ?? idx}>
                <td className="px-3 py-2 border">{idx + 1}</td>
                <td className="px-3 py-2 border">{owner.ownerName}</td>
                <td className="px-3 py-2 border">{owner.guardianName}</td>
                <td className="px-3 py-2 border">{owner.relationType}</td>
                <td className="px-3 py-2 border">{owner.mobileNo}</td>
              </tr>
            )}
          />
        )}

        {/* Lease Rate History */}
        <SectionCard
          title="Lease Rate Details"
          headers={["SL", "Lease Amount", "Lease Start Date", "Document", "Status"]}
          data={rents}
          renderRow={(rent, idx) => (
            <tr key={rent.id ?? idx}>
              <td className="px-3 py-2 border">{idx + 1}</td>
              <td className="px-3 py-2 border">
                {rent.leaseAmount ?? rent.monthlyRate}
              </td>
              <td className="px-3 py-2 border">
                {formatLocalDate(rent.effectiveDate || rent.leaseStartDate)}
              </td>
              <td className="px-3 py-2 border">
                {isUrl(rent.docPath) ? (
                  <a
                    href={rent.docPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <FaEye /> View
                  </a>
                ) : (
                  rent.docPath || "NA"
                )}
              </td>
              <td className="px-3 py-2 border">
                {rent.isCurrent ? (
                  <span className="font-semibold text-green-700">Current</span>
                ) : (
                  "Old"
                )}
              </td>
            </tr>
          )}
        />

        {/* Payment Details */}
        <DataTableFullData
          title="Payment Details"
          headers={[
            { label: "SL" },
            { label: "Transaction No" },
            { label: "Payment Mode" },
            { label: "Date" },
            { label: "Demand From" },
            { label: "Demand Upto" },
            { label: "Demand Amount" },
            { label: "Penalty" },
            { label: "Paid Amount" },
            { label: "View" },
          ]}
          renderRow={(tran, idx) => (
            <tr key={tran.id ?? idx}>
              <td className="px-3 py-2 border">{idx + 1}</td>
              <td className="px-3 py-2 border">{tran.tranNo || "NA"}</td>
              <td className="px-3 py-2 border">{tran.paymentMode || "NA"}</td>
              <td className="px-3 py-2 border">{formatLocalDate(tran.tranDate)}</td>
              <td className="px-3 py-2 border">{formatLocalDate(tran.fromDate)}</td>
              <td className="px-3 py-2 border">{formatLocalDate(tran.uptoDate)}</td>
              <td className="px-3 py-2 border">{tran.demandAmt}</td>
              <td className="px-3 py-2 border">{tran.penaltyAmt}</td>
              <td className="px-3 py-2 border">{tran.payableAmt}</td>
              <td className="px-3 py-2 border">
                {tran.id && (
                  <button
                    onClick={() => setReceiptTranId(tran.id)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded font-medium text-white text-sm transition duration-200"
                  >
                    <FaEye className="text-base" />
                    <span>View</span>
                  </button>
                )}
              </td>
            </tr>
          )}
          data={appData.tranDtls || []}
          showingItem={[5, 10, 15, 50, 100]}
        />

        <div className="flex flex-wrap justify-center gap-3">
          {actions.map((btn, i) => (
            <ActionButton key={i} {...btn} />
          ))}
        </div>
      </div>

      {isDemandHistoryOpen && (
        <LeaseDemandHistoryModal
          id={appData.id}
          onClose={() => setIsDemandHistoryOpen(false)}
        />
      )}
      {isPaymentOpen && (
        <DemandViewModal
          id={appData?.id}
          actionType={"Payment"}
          onSuccess={fetchDetails}
          onClose={() => setIsPaymentOpen(false)}
          apiUrl={leaseRentDueApi}
        />
      )}
      {receiptTranId && (
        <LeasePaymentReceiptModal
          id={receiptTranId}
          onClose={() => setReceiptTranId(null)}
        />
      )}
      {isGenerateDemandOpen && (
        <LeaseGenerateDemandModal
          id={appData.id}
          consumerNo={appData.consumerNo}
          onClose={() => setIsGenerateDemandOpen(false)}
          onSuccess={demandGenerated}
        />
      )}
    </div>
  );
}

export default LeaseDetails;
