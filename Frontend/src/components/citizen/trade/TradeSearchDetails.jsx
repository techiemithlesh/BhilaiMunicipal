import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import RemarksAccordion from "../../common/RemarksAccordion";
import { setTradeFormData } from "../../../store/slices/citizenTradeSlice";
import {
  tradeApplicationDetailsApi,
  tradeDocListApi,
  tradeDocUploadApi,
  tradeGetPaymentDueApi,
} from "../../../api/endpoints";
import SAFHeaderCard from "../../../modules/saf/components/SAFHeader";
import { useDispatch, useSelector } from "react-redux";
import { FaCommentDollar, FaEdit, FaEye, FaUpload } from "react-icons/fa";
import { formatLocalDate, formatTimeAMPM } from "../../../utils/common";
import ActionButton from "../../common/ActionButton";
import RemarksModal from "../../../modules/saf/components/RemarksModal";
import DocViewModal from "../../common/DocViewModal";
import DocUploadModal from "../../../modules/saf/components/DocUploadModal";
import ApplicationDetails from "../../common/ApplicationDetails ";
import SectionCard from "../../common/SectionCard";
import EditApplication from "../../../modules/trade/components/EditApplication";
import LicenseCertificateModal from "../../../modules/trade/components/LicenseCertificateModal";
import PaymentReceiptModal from "../../../modules/trade/components/PaymentReceiptModal";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

export default function TradeSearchDetails() {
  const { id, licenseType, applicationType } = useParams();
  const [isFrozen, setIsFrozen] = useState(false);
  const [headerData, setHeaderData] = useState([]);
  const [tradeDetails, setTradeDetails] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [remarks, setRemarks] = useState([]);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.citizenAuth.token);
  const [modals, setModals] = useState("");
  const navigate = useNavigate();

  const actions = [
    {
      label: "Proceed Payment",
      onClick: () => setModals("payment"),
      icon: <FaCommentDollar />,
      show: !tradeDetails?.paymentStatus,
    },
    {
      label: "View Trade License",
      onClick: () => setModals("viewTradeLicense"),
      icon: <FaEye />,
      show: tradeDetails?.isApproved,
    },
    {
      label: "Upload Document",
      onClick: () => setModals("uploadDocuments"),
      icon: <FaUpload />, //(tradeDetails?.paymentStatus!=0) &&
      show:
        !tradeDetails?.isApproved &&
        (!tradeDetails?.isDocUpload ||
          tradeDetails?.isBtc ||
          tradeDetails?.currentRoleId == tradeDetails?.initiatorRoleId),
    },
    {
      label: "View Document",
      onClick: () => setModals("viewDocuments"),
      icon: <FaEye />,
      show: true,
    },
    {
      label: "Edit",
      onClick: () => setModals("Edit"),
      icon: <FaEdit />,
      show:
        !tradeDetails?.paymentStatus &&
        !tradeDetails?.isApproved &&
        (!tradeDetails?.isDocUpload ||
          tradeDetails?.isBtc ||
          tradeDetails?.currentRoleId == tradeDetails?.initiatorRoleId),
    },
    {
      label: "SURRENDER",
      onClick: () =>
        navigate(`/citizen/trade/surrender-license/${id}/SURRENDER`),
      icon: <FaEdit />,
      show: tradeDetails?.isApproved && tradeDetails?.isRenewable,
    },
    {
      label: "RENEWAL",
      onClick: () => navigate(`/citizen/trade/apply-license/${id}/RENEWAL`),
      icon: <FaEdit />,
      show: tradeDetails?.isApproved && tradeDetails?.isRenewable,
    },
  ];

  useEffect(() => {
    if (applicationType) {
      if (applicationType) {
        dispatch(setTradeFormData({ applicationType }));
      }
    }
  }, [applicationType]);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, token]);

  const fetchDetails = async () => {
    if (!token) {
      console.warn("No token found.");
      return;
    }
    setIsFrozen(true);
    try {
      const response = await axios.post(
        tradeApplicationDetailsApi,
        { id: id, ulbId: ulbId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data?.data;
      setTradeDetails(data);
      setHeaderData({
        applicationNo: data?.applicationNo,
        statusText: data?.appStatus,
        applicationType: data?.assessmentType,
      });

      const updatedRemarks = data?.levelRemarks?.map((item) => ({
        roleCode: item?.senderRole,
        action: item?.actions,
        userName: item?.senderUserName,
        message: item?.senderRemarks,
        date: item?.createdAt
          ? new Date(item?.createdAt).toLocaleDateString()
          : "NA",
        time: item?.createdAt ? formatTimeAMPM(item.createdAt) : "NA",
      }));

      setRemarks(updatedRemarks);
    } catch (error) {
      console.error("Failed to fetch SAF details", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const openReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setOpenReceiptModal(true);
  };

  const viewData = [
    { label: "Application No", value: tradeDetails?.applicationNo },
    { label: "Application Type", value: tradeDetails?.applicationType },
    { label: "License No", value: tradeDetails?.licenseNo },
    { label: "Ward No", value: tradeDetails?.wardNo },
    { label: "New Ward No", value: tradeDetails?.newWardNo },
    {
      label: "License For",
      value: tradeDetails?.licenseForYears
        ? tradeDetails?.licenseForYears +
          " Year" +
          (tradeDetails?.licenseForYears > 1 ? "s" : "")
        : "N/A",
    },
    ...(tradeDetails?.newHoldingNo
      ? [
          {
            label: "Holding No.",
            value: (
              <Link
                to={`/citizen/holding/details/${tradeDetails?.propertyDetailId}`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                {tradeDetails?.newHoldingNo}
              </Link>
            ),
          },
        ]
      : []),
    { label: "Ownership Type", value: tradeDetails?.ownershipType },
    {
      label: "Nature Of Business",
      value: tradeDetails?.natureOfBusiness,
      info: tradeDetails?.natureOfBusiness,
    },
    { label: "Area in Sqft", value: tradeDetails?.areaInSqft },
    { label: "Address", value: tradeDetails?.address },
    { label: "Landmark", value: tradeDetails?.landmark },
    { label: "Pin Code", value: tradeDetails?.pinCode },
    { label: "Application Type", value: tradeDetails?.applyDate },
    { label: "Firm Type", value: tradeDetails?.firmType },
    { label: "Firm Name", value: tradeDetails?.firmName },
    {
      label: "Firm Establishment Date",
      value: tradeDetails?.firmEstablishmentDate,
    },
    { label: "Applied Date", value: tradeDetails?.applyDate },
    {
      label: "Owner of Business Premises",
      value: tradeDetails?.premisesOwnerName,
    },
    { label: "Business Description", value: tradeDetails?.firmDescription },
  ];

  return (
    <div className="mx-auto container">
      <div
        className={`flex flex-col gap-4 ${
          isFrozen ? "pointer-events-none filter blur-sm" : ""
        }`}
      >
        {tradeDetails ? (
          <>
            <SAFHeaderCard
              applicationNo={headerData?.applicationNo}
              statusText={headerData?.statusText}
              applicationType={headerData?.applicationType}
              statusColor={
                headerData?.statusText?.toLowerCase().includes("pending")
                  ? "text-red-500"
                  : "text-green-600"
              }
            />

            <ApplicationDetails fields={viewData} />
            <SectionCard
              title="Owner Details"
              headers={["SL", "Owner", "Guardian", "Mobile", "Email"]}
              data={tradeDetails?.owners}
              renderRow={(owner, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">{owner.ownerName}</td>
                  <td className="px-3 py-2 border">{owner.guardianName}</td>
                  <td className="px-3 py-2 border">{owner.mobileNo}</td>
                  <td className="px-3 py-2 border">{owner.email}</td>
                </tr>
              )}
            />

            {/* <PaymentDetailsTable data={tradeDetails?.tranDtls} /> */}

            <SectionCard
              title="Payment Details"
              headers={[
                "SL",
                "Transaction No",
                "Payment Mode",
                "Date",
                "Amount",
                "Payment Received From",
                "View",
              ]}
              data={tradeDetails.tranDtls}
              renderRow={(t, idx) => (
                <tr key={idx}>
                  <td className="border px-3 py-2">{idx + 1}</td>
                  <td className="border px-3 py-2">{t.tranNo || "NA"}</td>
                  <td className="border px-3 py-2">{t.paymentMode || "NA"}</td>
                  <td className="border px-3 py-2">
                    {formatLocalDate(t.tranDate)}
                  </td>
                  <td className="border px-3 py-2">{t.payableAmt}</td>
                  <td className="border px-3 py-2">{t.userType}</td>

                  <td className="border px-3 py-2">
                    {t.id && (
                      <button
                        onClick={() => openReceipt(t)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <FaEye /> View
                      </button>
                    )}
                  </td>
                </tr>
              )}
            />

            <RemarksAccordion title="Remarks From Level" remarks={remarks} />
            <div className="flex flex-wrap justify-center gap-3">
              {actions.map((btn, i) => (
                <ActionButton key={i} {...btn} />
              ))}
            </div>

            {openReceiptModal && selectedReceipt && (
              <PaymentReceiptModal
                onClose={() => setOpenReceiptModal(false)}
                id={selectedReceipt?.id}
              />
            )}

            {/* TRADE LICENSE CERTIFICATE */}
            {modals === "viewTradeLicense" && (
              <LicenseCertificateModal id={id} onClose={() => setModals("")} />
            )}

            {modals === "Edit" && (
              <EditApplication
                id={id}
                onClose={() => setModals("")}
                onSuccess={fetchDetails}
              />
            )}
            {modals === "payment" && (
              <PaymentModal
                id={id}
                open={modals === "payment"}
                onClose={() => setModals("")}
                apiUrl={tradeGetPaymentDueApi}
                token={token}
              />
            )}
            {modals === "uploadDocuments" && (
              <DocUploadModal
                id={id}
                onClose={() => setModals("")}
                fetchDataApi={tradeDocListApi}
                docUploadApi={tradeDocUploadApi}
                token={token}
                ulbId={ulbId}
              />
            )}
            {modals === "viewDocuments" && (
              <DocViewModal
                id={id}
                onClose={() => setModals("")}
                fetchDataApi={tradeDocListApi}
                token={token}
              />
            )}
            {modals === "postNext" && (
              <RemarksModal
                onClose={() => setModals("")}
                handelChange={(e) => setVerificationRemarks(e.target.value)}
                handleSubmit={forwardBackward}
                remarks={verificationRemarks}
                heading={`Enter Remarks`}
                btn={"Send"}
              />
            )}
          </>
        ) : (
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
