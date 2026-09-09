import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../../../layout/AdminLayout";

import {
  tradeApplicationDetailsApi,
  tradeGetUploadedDocListApi,
  tradeDocVerifyApi,
  tradePostNextLevelApi,
  wfPermissionApi,
  tradeDocListApi,
  tradeDocUploadApi,
} from "../../../api/endpoints";

import ApplicationInfo from "../../../components/common/ApplicationDetails ";
import SectionCard from "../../../components/common/SectionCard";
import RemarksAccordion from "../../../components/common/RemarksAccordion";
import RemarksModal from "../../../components/common/RemarksModal";
import DocUpload from "../../../components/common/DocUpload";
import DocVerifyModal from "../../../components/common/DocVerifyModal";
import ActionButton from "../../../components/common/ActionButton";

import { getToken } from "../../../utils/auth";
import { formatLocalDate, formatTimeAMPM } from "../../../utils/common";
import { toast } from "react-hot-toast";

import { FaEdit, FaExchangeAlt, FaEject, FaEllipsisH } from "react-icons/fa";
import EditApplication from "../components/EditApplication";

const WorkflowDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const token = getToken();

  const [loading, setLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);

  const [tradeDetails, setTradeDetails] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [wfPermissions, setWfPermissions] = useState(null);
  const [wfId, setWfId] = useState(null);

  const [openModal, setOpenModal] = useState("");
  const [remarksModal, setRemarksModal] = useState({
    open: false,
    type: "",
    value: "",
  });

  /** FETCH MAIN DETAILS */
  const fetchDetails = async () => {
    setIsFrozen(true);
    try {
      const res = await axios.post(
        tradeApplicationDetailsApi,
        { id: itemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.status) {
        const data = res.data.data;

        setTradeDetails(data);
        setWfId(data.workflowId);

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

  /** FETCH WORKFLOW PERMISSIONS */
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
    if (itemId && token) fetchDetails();
  }, [itemId, token]);

  useEffect(() => {
    if (wfId && token) fetchPermissions();
  }, [wfId, token]);

  /** WORKFLOW ACTION BUTTONS */
  const actions = [
    {
      label: "Edit",
      icon: <FaEdit />,
      onClick: () =>setOpenModal("edit"),
      show: wfPermissions?.canAppEdit,
    },
    {
      label: "Upload Document",
      icon: <FaEdit />,
      onClick: () => setOpenModal("upload"),
      show: wfPermissions?.canDocUpload,
    },
    {
      label: "Verify Document",
      icon: <FaEdit />,
      onClick: () => setOpenModal("verify"),
      show: wfPermissions?.canDocVerify,
    },
    {
      label: "BTC",
      icon: <FaExchangeAlt />,
      onClick: () => setRemarksModal({ open: true, type: "BTC", value: "" }),
      show: wfPermissions?.canBtc,
    },
    {
      label: "Backward",
      icon: <FaEject />,
      onClick: () =>
        setRemarksModal({ open: true, type: "BACKWARD", value: "" }),
      show: wfPermissions?.canBackward,
    },
    {
      label: "Forward",
      icon: <FaEllipsisH />,
      onClick: () =>
        setRemarksModal({ open: true, type: "FORWARD", value: "" }),
      show: wfPermissions?.canForward,
    },
    {
      label: "Approved",
      icon: <FaEdit />,
      onClick: () =>
        setRemarksModal({ open: true, type: "APPROVED", value: "" }),
      show: wfPermissions?.canAppApproved,
    },
  ];

  /** POST REMARKS & ACTION */
  const submitAction = async () => {
    if (remarksModal.value.trim() === "")
      return toast.error("Remarks are required");

    setIsFrozen(true);
    try {
      const response = await axios.post(
        tradePostNextLevelApi,
        {
          id: itemId,
          remarks: remarksModal.value,
          status: remarksModal.type,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response?.data?.status) {
        toast.success(response.data.message);
        navigate("/trade/inbox");
      } else {
        toast.error(response.data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setIsFrozen(false);
    }
  };


  const fetchTradeDocs = async ({ id, token }) => {
    const res = await axios.post(
      tradeGetUploadedDocListApi,
      { id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { status: res.data?.status, data: res.data?.data || [] };
  };

  const verifyTradeDoc = async ({ id, status, remarks, token }) => {
    const res = await axios.post(
      tradeDocVerifyApi,
      { id, verificationStatus: status, remarks },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { status: res.data?.status };
  };

  if (loading)
    return (
      <>
        <div className="py-20 text-center">
          <span className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="mt-3 text-gray-600">Loading details...</p>
        </div>
      </>
    );

  const viewData = [
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
  ];

  return (
    <>
      <div className="mx-auto container py-4">
        {/* APPLICATION INFO */}
        <ApplicationInfo fields={viewData} />

        {/* OWNER SECTION */}
        <div className="section-block">
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
        </div>

        {/* PAYMENT SECTION */}
        <SectionCard
          title="Payment Details"
          headers={[
            "SL",
            "Transaction No",
            "Payment Mode",
            "Date",
            "Amount",
            "Payment Received From",
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
            </tr>
          )}
        />

        {/* REMARKS */}
        <div className="section-block">
            
        <RemarksAccordion title="Level Remarks" remarks={remarks} />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {actions
            .filter((btn) => btn.show)
            .map((btn, i) => (
              <ActionButton key={i} {...btn} />
            ))}
        </div>

        {/* ========= MODALS ========= */}

        {/* UPLOAD DOCUMENT */}
        {openModal === "upload" && (
          <DocUpload
            id={itemId}
            onClose={() => setOpenModal("")}
            fetchDataApi={tradeDocListApi}
            docUploadApi={tradeDocUploadApi} 
            token={token}
          />
        )}

        {openModal === "edit" && (
          <EditApplication
            id={itemId}
            onClose={() => setOpenModal("")}
            onSuccess={fetchDetails}
          />
        )}

        {/* VERIFY DOCS */}
        {openModal === "verify" && (
          <DocVerifyModal
          id={itemId}
          onClose={() => setOpenModal("")}
          onSuccess={fetchDetails}
          fetchDocsApi={fetchTradeDocs}
          verifyDocApi={verifyTradeDoc}
          />
        )}

        {/* REMARKS MODAL */}
        {remarksModal.open && (
          <RemarksModal
            onClose={() =>
              setRemarksModal({ open: false, type: "", value: "" })
            }
            handelChange={(e) =>
              setRemarksModal((r) => ({ ...r, value: e.target.value }))
            }
            handleSubmit={submitAction}
            remarks={remarksModal.value}
            heading={`Enter remarks to ${remarksModal.type}`}
            btn={"Submit"}
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

export default WorkflowDetail;
