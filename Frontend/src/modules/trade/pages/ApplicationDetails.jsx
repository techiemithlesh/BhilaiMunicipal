import { Link, useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../../layout/AdminLayout";
import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import axios from "axios";

import {
  tradeApplicationDetailsApi,
  tradeGetPaymentDueApi,
  wfPermissionApi,
  tradeDocListApi,
  tradeDocUploadApi,
  tradePostNextLevelApi,
} from "../../../api/endpoints";

import HeaderCard from "../../../components/common/HeaderCard";
import ApplicationInfo from "../../../components/common/ApplicationDetails ";
import SectionCard from "../../../components/common/SectionCard";
import RemarksAccordion from "../../../components/common/RemarksAccordion";
import ActionButton from "../../../components/common/ActionButton";
import PaymentModal from "../components/PaymentModal";
import PaymentReceiptModal from "../components/PaymentReceiptModal";
import DocUpload from "../../../components/common/DocUpload";
import DocViewModal from "../../../components/common/DocViewModal";
import RemarksModal from "../../../components/common/RemarksModal";
import { toastMsg } from "../../../utils/utils";
import { formatLocalDate, formatTimeAMPM } from "../../../utils/common";
import {
  FaCertificate,
  FaCommentDollar,
  FaEdit,
  FaEye,
  FaForward,
  FaHandPaper,
  FaNewspaper,
  FaRedo,
  FaUpload,
} from "react-icons/fa";
import LicenseCertificateModal from "../components/LicenseCertificateModal";

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);

  const [tradeDetails, setTradeDetails] = useState(null);
  const [headerData, setHeaderData] = useState({});
  const [remarks, setRemarks] = useState([]);
  const [wfPermissions, setWfPermissions] = useState(null);

  const [wfId, setWfId] = useState(null);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [verificationRemarks, setVerificationRemarks] = useState("");

  const token = getToken();

  const fetchDetails = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(
        tradeApplicationDetailsApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.status) {
        const data = res.data.data;

        setTradeDetails(data);
        setWfId(data.workflowId);

        setHeaderData({
          applicationNo: data.applicationNo,
          statusText: data.appStatus,
          applicationType: data.applicationType,
        });

        const formattedRemarks = (data.levelRemarks || []).map((item) => ({
          roleCode: item.senderRole,
          action: item.actions,
          userName: item.senderUserName,
          message: item.senderRemarks,
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "NA",
          time: item.createdAt ? formatTimeAMPM(item.createdAt) : "NA",
        }));

        setRemarks(formattedRemarks);
      }
    } catch (err) {
      console.error("Failed to fetch details", err);
    } finally {
      setLoading(false);
      setIsFrozen(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.post(
        wfPermissionApi,
        { wfId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.status) {
        setWfPermissions(res.data.data);
      }
    } catch (err) {
      console.error("Permission fetch failed", err);
    }
  };

  useEffect(() => {
    if (id && token) fetchDetails();
  }, [id, token]);

  useEffect(() => {
    if (wfId && token) fetchPermissions();
  }, [wfId, token]);

  const openReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setOpenReceiptModal(true);
  };

  const viewData = tradeDetails
    ? [
        { label: "Application No", value: tradeDetails.applicationNo },
        { label: "Application Type", value: tradeDetails.applicationType },
        { label: "License No", value: tradeDetails.licenseNo },
        { label: "Ward No", value: tradeDetails.wardNo },
        {
          label: "License For",
          value: tradeDetails.licenseForYears
            ? `${tradeDetails.licenseForYears} Year${
                tradeDetails.licenseForYears > 1 ? "s" : ""
              }`
            : "N/A",
        },
        ...(tradeDetails.newHoldingNo
          ? [
              {
                label: "Holding No",
                value: (
                  <Link
                    to={`/citizen/holding/details/${tradeDetails.propertyDetailId}`}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    {tradeDetails.newHoldingNo}
                  </Link>
                ),
              },
            ]
          : []),
        { label: "Ownership Type", value: tradeDetails.ownershipTypeName },
        {
          label: "Nature Of Business",
          value:
            tradeDetails.tradeItem?.map((t) => t.tradeItem).join(", ") || "N/A",
        },
        { label: "Area in Sqft", value: tradeDetails.areaInSqft },
        { label: "Address", value: tradeDetails.address },
        { label: "Landmark", value: tradeDetails.landmark },
        { label: "Pin Code", value: tradeDetails.pinCode },
        { label: "Firm Type", value: tradeDetails.firmTypeName },
        { label: "Firm Name", value: tradeDetails.firmName },
        {
          label: "Firm Establishment Date",
          value: tradeDetails.firmEstablishmentDate,
        },
        { label: "Applied Date", value: tradeDetails.applyDate },
        {
          label: "Owner of Business Premises",
          value: tradeDetails.premisesOwnerName,
        },
        { label: "Business Description", value: tradeDetails.firmDescription },
      ]
    : [];

  const actions = [
    {
      label: "Proceed Payment",
      icon: <FaCommentDollar />,
      onClick: () => setModalType("payment"),
      show:
        tradeDetails?.paymentStatus === 0 &&
        (wfPermissions?.canTakePayment || wfPermissions?.hasFullPermission),
    },
    {
      label: "Trade License",
      onClick: () => setModalType("viewTradeLicense"),
      icon: <FaCertificate />,
      show: tradeDetails?.isApproved,
    },
    {
      label: "Provisional License",
      onClick: () => setModalType("viewProvisionalLicense"),
      icon: <FaCertificate />,
      show: !tradeDetails?.isApproved && tradeDetails?.paymentStatus,
    },
    {
      label: "Upload Document",
      icon: <FaUpload />,
      onClick: () => setModalType("uploadDocuments"),
      show:
        (wfPermissions?.canDocUpload || wfPermissions?.hasFullPermission) &&
        !tradeDetails?.isApproved,
    },
    {
      label: "View Document",
      icon: <FaEye />,
      onClick: () => setModalType("viewDocuments"),
      show: true,
    },
    {
      label: "Send To Level",
      icon: <FaForward />,
      onClick: () => setModalType("postNext"),
      show: wfPermissions?.isInitiator || wfPermissions?.hasFullPermission,
    },

    {
      label: "Renew Application",
      icon: <FaRedo />,
      onClick: () => navigate(`/trade/renew-license/${tradeDetails?.id}`),
      show: tradeDetails?.isApproved,
    },
    {
      label: "Amendment",
      icon: <FaEdit />,
      onClick: () => navigate(`/trade/amendment-license/${tradeDetails?.id}`),
      show: tradeDetails?.isApproved,
    },
    {
      label: "Surrender",
      icon: <FaHandPaper />,
      onClick: () => navigate(`/trade/surrender-license/${tradeDetails?.id}`),
      show: tradeDetails?.isApproved,
    },
  ];

  const forwardBackward = () => {
    if (verificationRemarks.trim() === "")
      return toast.error("Remarks are required");

    setIsFrozen(true);
    postNextLevel();
  };

  const postNextLevel = async () => {
    try {
      const response = await axios.post(
        tradePostNextLevelApi,
        { id: id, remarks: verificationRemarks, status: "FORWARD" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status) {
        toastMsg(response?.data?.message, "success");
        fetchDetails();
      } else {
        toastMsg(response?.data?.message, "error");
      }
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setIsFrozen(false);
      setModalType("");
    }
  };

  if (loading)
    return (
      <>
        <div className="py-20 text-center">
          <span className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </>
    );

  return (
    <>
      <div className="mx-auto container py-4">
        <HeaderCard
          applicationNo={headerData.applicationNo}
          statusText={headerData.statusText}
          applicationType={headerData.applicationType}
          statusColor={
            headerData.statusText?.toLowerCase().includes("pending")
              ? "text-red-500"
              : "text-green-600"
          }
        />

        <ApplicationInfo fields={viewData} />

        <SectionCard
          title="Owner Details"
          headers={["SL", "Owner", "Guardian", "Mobile", "Email"]}
          data={tradeDetails.owners}
          renderRow={(o, idx) => (
            <tr key={idx}>
              <td className="border px-3 py-2">{idx + 1}</td>
              <td className="border px-3 py-2">{o.ownerName}</td>
              <td className="border px-3 py-2">{o.guardianName}</td>
              <td className="border px-3 py-2">{o.mobileNo}</td>
              <td className="border px-3 py-2">{o.email}</td>
            </tr>
          )}
        />

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

        <RemarksAccordion title="Level Remarks" remarks={remarks} />

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {actions
            .filter((btn) => btn.show)
            .map((btn, i) => (
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
        {modalType === "viewTradeLicense" && (
          <LicenseCertificateModal id={id} onClose={() => setModalType("")} />
        )}

        {modalType === "payment" && (
          <PaymentModal
            id={id}
            open={modalType === "payment"}
            onClose={() => setModalType("")}
            onSuccess={fetchDetails}
            apiUrl={tradeGetPaymentDueApi}
            token={token}
          />
        )}

        {modalType === "uploadDocuments" && (
          <DocUpload
            id={id}
            onClose={() => setModalType("")}
            fetchDataApi={tradeDocListApi}
            docUploadApi={tradeDocUploadApi}
            token={token}
          />
        )}

        {modalType === "viewDocuments" && (
          <DocViewModal
            id={id}
            onClose={() => setModalType("")}
            fetchDataApi={tradeDocListApi}
            token={token}
          />
        )}

        {modalType === "postNext" && (
          <RemarksModal
            onClose={() => setModalType("")}
            handelChange={(e) => setVerificationRemarks(e.target.value)}
            handleSubmit={forwardBackward}
            remarks={verificationRemarks}
            heading={`Enter Remarks`}
            btn={"Send"}
          />
        )}
      </div>

      {isFrozen && (
        <div className="fixed inset-0 z-[9999] bg-white/50 backdrop-blur-sm flex justify-center items-center">
          <div className="text-lg font-semibold text-gray-700">
            Processing...
          </div>
        </div>
      )}
    </>
  );
};

export default ApplicationDetails;
