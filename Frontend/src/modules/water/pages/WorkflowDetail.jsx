import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  waterAppDetailApi,
  waterAppDocListApi,
  waterAppDocUploadApi,
  waterAppDocVerifyApi,
  waterAppPostNextLevelApi,
  waterAppUploadedDocListApi,
  wfPermissionApi,
} from "../../../api/endpoints";
import ApplicationDetails from "../../../components/common/ApplicationDetails ";
import SectionCard from "../../../components/common/SectionCard";
import DetailGrid from "../../../components/common/DetailGrid";
import RemarksAccordion from "../../../components/common/RemarksAccordion";
import {
  FaEdit,
  FaEject,
  FaEllipsisH,
  FaExchangeAlt,
  FaEye,
} from "react-icons/fa";
import ActionButton from "../../../components/common/ActionButton";
import RemarksModal from "../components/RemarksModal";
import toast from "react-hot-toast";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatTimeAMPM,
} from "../../../utils/common";
import PaymentReceiptModal from "../components/PaymentReceiptModal";
import DocUploadModal from "../components/DocUploadModal";
import DocViewModal from "../components/DocViewModal";
import DocVerifyModal from "../../../components/common/DocVerifyModal";
import { getToken } from "../../../utils/auth";
import FieldVerificationView from "../components/FieldVerificationView";

function WorkflowDetail() {
  const { id, from } = useParams();
  const [appData, setAppData] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [wfPermissions, setWfPermissions] = useState(null);
  const [wfId, setWfId] = useState(null);
  const [isDocViewModal, setIsDocViewModal] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState(null);
  const [isShowVerificationModal, setIsShowVerificationModal] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [openModal, setOpenModal] = useState("");
  const [actionType, setActionType] = useState("");
  const token = getToken();

  const navigate = useNavigate();
  const closeModal = () => setOpenModal("");

  const actions = [
    {
      label: "Edit",
      onClick: () => navigate(`/water/app/detail/${appData?.id}/edit`),
      icon: <FaEdit />,
      show:
        (wfPermissions?.canAppEdit || wfPermissions?.hasFullPermission) &&
        !appData?.isApproved &&
        (!appData?.isDocUpload ||
          appData?.isBtc ||
          appData?.currentRoleId == appData?.initiatorRoleId),
    },
    {
      label: "Upload Document",
      onClick: () => setOpenModal("upload"),
      icon: <FaEdit />,
      show: wfPermissions?.canDocUpload,
    },
    {
      label: "View Document",
      onClick: () => {
        setIsDocViewModal(true);
      },
      icon: <FaEye />,
      show: true,
    },
    {
      label: "Verify Document",
      onClick: () => setOpenModal("verify"),
      icon: <FaEdit />,
      show: wfPermissions?.canDocVerify,
    },
    {
      label: "BTC",
      onClick: () => {
        setActionType("BTC");
        setIsRemarksModalOpen(true);
        setVerificationRemarks("");
      },
      icon: <FaExchangeAlt />,
      show: wfPermissions?.canBtc,
    },
    {
      label: "Backward",
      onClick: () => {
        setActionType("BACKWARD");
        setIsRemarksModalOpen(true);
        setVerificationRemarks("");
      },
      icon: <FaEject />,
      show: wfPermissions?.canBackward,
    },
    {
      label: "Forward",
      onClick: () => {
        setActionType("FORWARD");
        setIsRemarksModalOpen(true);
        setVerificationRemarks("");
      },
      icon: <FaEllipsisH />,
      show: wfPermissions?.canForward,
    },
    {
      label: "Approved",
      onClick: () => {
        setActionType("APPROVED");
        setIsRemarksModalOpen(true);
        setVerificationRemarks("");
      },
      icon: <FaEdit />,
      show: wfPermissions?.canAppApproved,
    },
  ];

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id, token]);

  useEffect(() => {
    if (wfId && token) {
      fetchWfPermission();
    }
  }, [wfId, token]);

  const fetchDetails = async () => {
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      const response = await axios.post(
        waterAppDetailApi,
        { id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      setAppData(data);
      setWfId(data.workflowId);

      const updatedRemarks = data?.levelRemarks?.map((item) => ({
        ...item,
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
    }
  };

  const fetchWfPermission = async () => {
    try {
      const response = await axios.post(
        wfPermissionApi,
        { wfId: wfId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      if (response?.data?.status) {
        setWfPermissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch Permission", error);
    }
  };

  const forwardBackward = () => {
    if (verificationRemarks.trim() === "")
      return toast.error("Remarks are required");
    postNextLevel();
    setIsRemarksModalOpen(false);
  };
  const postNextLevel = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        waterAppPostNextLevelApi,
        { id: id, remarks: verificationRemarks, status: actionType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status) {
        toast.success(response?.data?.message);
        switch (from) {
          case "btc":
            navigate("/water/app/btc/list");
            break;
          default:
            navigate("/water/app/inbox");
        }
      } else {
        toast.error(response?.data?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const fields = [
    { label: "Application No", value: appData?.applicationNo },
    { label: "Apply Date", value: appData?.applyDate },
    { label: "Ward No", value: appData?.wardNo },
    // Conditionally add SAF No.
    ...(appData?.safNo
      ? [
          {
            label: "SAF No.",
            value: (
              <Link
                to={`/saf/details/${appData?.safDetailId}`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                {appData?.safNo}
              </Link>
            ),
          },
        ]
      : []),
    // Conditionally add Holding No.
    ...(appData?.newHoldingNo
      ? [
          {
            label: "Holding No.",
            value: (
              <Link
                to={`/property/details/${appData?.propertyDetailId}`}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                {appData?.newHoldingNo}
              </Link>
            ),
          },
        ]
      : []),
    { label: "Property Type", value: appData?.propertyType },
    { label: "Ownership Type", value: appData?.ownershipType },
    { label: "Connection Through", value: appData?.connectionThrough },
    { label: "Pipeline Type", value: appData?.pipelineType },
    { label: "Area in Sqft", value: appData?.areaSqft },
    { label: "Address", value: appData?.address },
    { label: "Landmark", value: appData?.landmark },
    { label: "Pin Code", value: appData?.pinCode },
  ];

  const fetchDocs = async ({ id, token }) => {
    const res = await axios.post(
      waterAppUploadedDocListApi,
      { id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { status: res.data?.status, data: res.data?.data || [] };
  };

  const verifyDoc = async ({ id, status, remarks, token }) => {
    const res = await axios.post(
      waterAppDocVerifyApi,
      { id, verificationStatus: status, remarks },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { status: res.data?.status };
  };

  return (
    <div className="mx-auto container">
      <div
        className={`flex flex-col gap-4 ${
          isFrozen ? "pointer-events-none filter blur-sm" : ""
        }`}
      >
        {appData ? (
          <>
            <ApplicationDetails
              assessmentType={appData?.assessmentType}
              fields={fields}
            />
            <SectionCard
              title="Owner Details"
              headers={[
                "SL",
                "Owner",
                "Guardian",
                "Mobile",
                "Email",
                "Dob",
                "Applicant Image",
                "Applicant Document",
              ]}
              data={appData?.owners}
              renderRow={(owner, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">{owner.ownerName}</td>
                  <td className="px-3 py-2 border">{owner.guardianName}</td>
                  <td className="px-3 py-2 border">{owner.mobileNo}</td>
                  <td className="px-3 py-2 border">{owner.email}</td>

                  <td className="px-3 py-2 border">
                    {owner?.ownerPhoto ? (
                      <img
                        src={owner.ownerPhoto}
                        alt="Owner"
                        className="border rounded w-16 h-16 object-cover"
                      />
                    ) : (
                      "NA"
                    )}
                  </td>
                  <td className="px-3 py-2 border">
                    {owner?.ownerDoc ? (
                      <iframe
                        src={owner.ownerDoc}
                        title="Owner Document"
                        className="border rounded w-32 h-16"
                      />
                    ) : (
                      "NA"
                    )}
                  </td>
                </tr>
              )}
            />
            <DetailGrid
              title="Electricity Details"
              note="Note: In case, there is no Electric Connection. You have to upload Affidavit Form-I. (Please Tick)"
              data={[
                {
                  label: "Electricity K. No",
                  value: appData?.electConsumerNo,
                },
                { label: "ACC No.", value: appData?.electAccNo },
                {
                  label: "BIND/BOOK No.",
                  value: appData?.electBindBookNo ? "electBindBookNo" : "NA",
                },
                {
                  label: "Electricity Consumer Category",
                  value: appData?.electConsCategory,
                },
              ]}
            />

            {/* PAYMENT DETAILS */}
            <SectionCard
              title="Payment Details"
              headers={[
                "SL",
                "Transaction No",
                "Payment Mode",
                "Date",
                "From Quarter / Year",
                "Upto Quarter / Year",
                "Amount",
                "View",
              ]}
              data={appData?.tranDtls}
              renderRow={(trans, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">{trans?.tranNo || "NA"}</td>
                  <td className="px-3 py-2 border">
                    {trans?.paymentMode || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {formatLocalDate(trans?.tranDate) || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.fromFyear || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.uptoFyear || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.payableAmt || ""}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.id && (
                      <button
                        onClick={() => {
                          setIsShowPaymentReceiptModal(true);
                          setPaymentReceiptId(trans.id);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded font-medium text-white text-sm transition duration-200"
                      >
                        <FaEye className="text-base" />
                        <span>View</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            />
            {/* FIELD VERIFICATION */}
            <SectionCard
              title="Field Verification"
              headers={["SL", "Verified By", "Verification On", "View"]}
              data={appData?.tcVerifications}
              renderRow={(verification, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">
                    {verification?.verifiedBy || "NA"}
                    <span className="mx-1 text-blue-400 text-xs italic">
                      ({verification?.userName || "NA"})
                    </span>
                  </td>
                  <td className="px-3 py-2 border">
                    {formatLocalDateTime(verification?.createdAt) || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {verification?.id && (
                      <button
                        onClick={() => {
                          setIsShowVerificationModal(true);
                          setVerificationId(verification.id);
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded font-medium text-white text-sm transition duration-200"
                      >
                        <FaEye className="text-base" />
                        <span>View</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            />

            <RemarksAccordion title="Level Remarks" remarks={remarks} />

            {/* action buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {wfPermissions ? (
                <>
                  {actions.map((btn, i) => (
                    <ActionButton key={i} {...btn} />
                  ))}
                </>
              ) : (
                <div className="p-6 text-center">
                  <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin loader"></span>
                  <p className="mt-2">Loading...</p>
                </div>
              )}
            </div>

            {openModal === "upload" && (
              <DocUploadModal
                id={appData.id}
                onClose={() => closeModal()}
                fetchDataApi={waterAppDocListApi}
                docUploadApi={waterAppDocUploadApi}
                token={token}
              />
            )}
            {/* {openModal === "verify" && (
            <DocVerifyModal id={appData.id} onClose={() => closeModal()} />
            )} */}

            {openModal === "verify" && (
              <DocVerifyModal
                id={appData.id}
                onClose={() => closeModal()}
                fetchDocsApi={fetchDocs}
                verifyDocApi={verifyDoc}
              />
            )}

            {isDocViewModal && (
              <DocViewModal
                id={appData?.id}
                onClose={() => setIsDocViewModal(false)}
                token={token}
              />
            )}

            {isRemarksModalOpen && (
              <RemarksModal
                onClose={() => {
                  setIsRemarksModalOpen(false);
                }}
                handelChange={(e) => setVerificationRemarks(e.target.value)}
                handleSubmit={forwardBackward}
                remarks={verificationRemarks}
                heading={`Enter Remarks ${actionType}`}
                btn={"Send"}
              />
            )}

            {/* Payment receipt div */}
            {isShowPaymentReceiptModal && (
              <PaymentReceiptModal
                id={paymentReceiptId}
                onClose={() => setIsShowPaymentReceiptModal(false)}
              />
            )}

            {/* Verification Dtl modal */}
            {isShowVerificationModal && (
              <FieldVerificationView
                id={verificationId}
                onClose={() => setIsShowVerificationModal(false)}
                token={token}
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

export default WorkflowDetail;
