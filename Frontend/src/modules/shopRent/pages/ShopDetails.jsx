import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FaEye, FaFileInvoiceDollar } from "react-icons/fa";
import HeaderCard from "../../../components/common/HeaderCard";
import ApplicationDetails from "../../../components/common/ApplicationDetails ";
import SectionCard from "../../../components/common/SectionCard";
import DataTableFullData from "../../../components/common/DataTableFullData";
import ActionButton from "../../../components/common/ActionButton";
import { useLoading } from "../../../contexts/LoadingContext";
import { shopRentDtlApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { formatLocalDate } from "../../../utils/common";
import ShopDemandHistoryModal from "../components/ShopDemandHistoryModal";
import ShopGenerateDemandModal from "../components/ShopGenerateDemandModal";
import ShopPaymentReceiptModal from "../components/ShopPaymentReceiptModal";

// The API returns a relative storage path for the rent document. Only a full URL can be opened.
const isUrl = (value) => /^https?:\/\//i.test(value || "");

function ShopDetails() {
  const { id } = useParams();
  const token = getToken();
  const { setIsLoadingGable } = useLoading();

  const [appData, setAppData] = useState(null);
  const [notFound, setNotFound] = useState("");
  const [isDemandHistoryOpen, setIsDemandHistoryOpen] = useState(false);
  const [isGenerateDemandOpen, setIsGenerateDemandOpen] = useState(false);
  const [receiptTranId, setReceiptTranId] = useState(null);

  const fetchDetails = async () => {
    if (!token) return;
    setIsLoadingGable(true);
    try {
      const response = await axios.post(
        shopRentDtlApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setAppData(response.data.data);
        setNotFound("");
      } else {
        setAppData(null);
        setNotFound(response?.data?.message || "Shop details not found.");
        toast.error(response?.data?.message || "Shop details not found.");
      }
    } catch (error) {
      console.error("Failed to fetch shop details", error);
      setNotFound("Unable to load shop details.");
    } finally {
      setIsLoadingGable(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, token]);

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

  const fields = [
    { label: "Consumer No.", value: appData.consumerNo },
    { label: "Ward No.", value: appData.wardNo },
    { label: "Area Name", value: appData.areaName },
    { label: "Shop No.", value: appData.shopNo },
    { label: "Nigam Reg. No.", value: appData.regNo },
    {
      label: "Holding No.",
      value: appData.holdingNo ? (
        appData.propertyDetailId ? (
          <a
            href={`/property/details/${appData.propertyDetailId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {appData.holdingNo}
          </a>
        ) : (
          appData.holdingNo
        )
      ) : null,
    },
    { label: "Shop Build Type", value: appData.shopType },
    { label: "Samiti Name", value: appData.samitiName },
    { label: "Yojna Name", value: appData.yojnaName },
    { label: "Premium Amount", value: appData.premiumAmt },
    { label: "Pincode", value: appData.pinCode },
    { label: "Address", value: appData.address },
    { label: "Allotment Date", value: formatLocalDate(appData.allotmentDate) },
    { label: "Apply Date", value: formatLocalDate(appData.applyDate) },
  ];

  const rents = [...(appData.shopRents || [])].sort((a, b) =>
    String(b.effectiveDate).localeCompare(String(a.effectiveDate))
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
      label: "Generate Demand",
      onClick: () => setIsGenerateDemandOpen(true),
      icon: <FaFileInvoiceDollar />,
      show: canGenerateDemand && !appData.lockStatus,
      className: "bg-red-600 hover:bg-red-700",
    },
  ];

  return (
    <div className="mx-auto container">
      <div className="flex flex-col gap-4">
        {appData.lockStatus && (
          <HeaderCard statusText="Shop Deactivated" statusColor="text-red-500" />
        )}

        <ApplicationDetails fields={fields} />

        <SectionCard
          title="Owner Details"
          headers={["SL", "Owner", "Guardian", "Relation", "Mobile"]}
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

        <SectionCard
          title="Monthly Rate Details"
          headers={["SL", "Monthly Rate", "Date of Effect", "Document", "Status"]}
          data={rents}
          renderRow={(rent, idx) => (
            <tr key={rent.id ?? idx}>
              <td className="px-3 py-2 border">{idx + 1}</td>
              <td className="px-3 py-2 border">{rent.monthlyRate}</td>
              <td className="px-3 py-2 border">{formatLocalDate(rent.effectiveDate)}</td>
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
        <ShopDemandHistoryModal id={appData.id} onClose={() => setIsDemandHistoryOpen(false)} />
      )}
      {receiptTranId && (
        <ShopPaymentReceiptModal id={receiptTranId} onClose={() => setReceiptTranId(null)} />
      )}
      {isGenerateDemandOpen && (
        <ShopGenerateDemandModal
          id={appData.id}
          consumerNo={appData.consumerNo}
          onClose={() => setIsGenerateDemandOpen(false)}
          onSuccess={demandGenerated}
        />
      )}
    </div>
  );
}

export default ShopDetails;
