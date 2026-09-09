import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaCommentDollar,
  FaEdit,
  FaEllipsisH,
  FaEye,
  FaUpload,
} from "react-icons/fa";
import { Link, useNavigate, useParams } from "react-router-dom";

import ActionButton from "../../../components/common/ActionButton";
import RemarksAccordion from "../../../components/common/RemarksAccordion";
import SectionCard from "../../../components/common/SectionCard";
import { getToken } from "../../../utils/auth";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatTimeAMPM,
} from "../../../utils/common";
import Details from "../../../components/common/ApplicationDetails ";
import DemandViewModal from "../components/DemandViewModal";
import DetailGrid from "../../../components/common/DetailGrid";
import DocUploadModal from "../components/DocUploadModal";
import FieldVerificationView from "../components/FieldVerificationView";
import PaymentReceiptModal from "../components/PaymentReceiptModal";
import RemarksModal from "../components/RemarksModal";
import {
  waterAppDetailApi,
  waterAppDocListApi,
  waterAppDocUploadApi,
  waterAppDueApi,
  waterAppPostNextLevelApi,
  wfPermissionApi,
} from "../../../api/endpoints";
import DocViewModal from "../components/DocViewModal";
import HeaderCard from "../../../components/common/HeaderCard";

const ApplicationDetails = () => {
  const { id } = useParams();
  const [appData, setAppData] = useState(null);
  const [headerData, setHeaderData] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [wfPermissions, setWfPermissions] = useState(null);
  const [wfId, setWfId] = useState(null);
  const [isDocUploadModal, setIsDocUploadModal] = useState(false);
  const [isDocViewModal, setIsDocViewModal] = useState(false);
  const [isDemandViewModal, setIsDemandViewModal] = useState(false);
  const [isDemandViewPayModal, setIsDemandViewPayModal] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState(null);
  const [isShowVerificationModal, setIsShowVerificationModal] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const token = getToken();
  const navigate = useNavigate();

  const actions = [
    {
      label: "View Demand",
      onClick: () => {
        setIsDemandViewModal(true);
      },
      icon: <FaEye />,
      show: appData?.paymentStatus == 0,
    },
    {
      label: "Proceed Payment",
      onClick: () => {
        setIsDemandViewPayModal(true);
      },
      icon: <FaCommentDollar />,
      show:
        appData?.paymentStatus == 0 &&
        (wfPermissions?.canTakePayment || wfPermissions?.hasFullPermission),
    },
    {
      label: "Upload Document",
      onClick: () => {
        setIsDocUploadModal(true);
      },
      icon: <FaUpload />, //(appData?.paymentStatus!=0) &&
      show:
        (wfPermissions?.canDocUpload || wfPermissions?.hasFullPermission) &&
        !appData?.isApproved &&
        (!appData?.isDocUpload ||
          appData?.isBtc ||
          appData?.currentRoleId == appData?.initiatorRoleId),
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
      label: "Send To Level",
      onClick: () => {
        setIsRemarksModalOpen(true);
      },
      icon: <FaEllipsisH />,
      show:
        (wfPermissions?.isInitiator || wfPermissions?.hasFullPermission) &&
        !appData?.isApproved &&
        (appData?.isBtc || appData?.currentRoleId == appData?.initiatorRoleId),
    },
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
      setHeaderData({
        applicationNo: data?.applicationNo,
        statusText: data?.appStatus,
      });

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
        { id: id, remarks: verificationRemarks, status: "FORWARD" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status) {
        toast.success(response?.data?.message);
        fetchDetails();
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

  return (
    <div className="mx-auto container">
      <div
        className={`flex flex-col gap-4 ${
          isFrozen ? "pointer-events-none filter blur-sm" : ""
        }`}
      >
        {appData ? (
          <>
            <HeaderCard
              applicationNo={headerData?.applicationNo}
              statusText={headerData?.statusText}
              statusColor={
                headerData?.statusText?.toLowerCase().includes("pending")
                  ? "text-red-500"
                  : "text-green-600"
              }
            />
            <Details assessmentType={appData?.assessmentType} fields={fields} />
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

            {isDocUploadModal && (
              <DocUploadModal
                id={appData?.id}
                onClose={() => setIsDocUploadModal(false)}
                fetchDataApi={waterAppDocListApi}
                docUploadApi={waterAppDocUploadApi}
                token={token}
              />
            )}

            {isDocViewModal && (
              <DocViewModal
                id={appData?.id}
                onClose={() => setIsDocViewModal(false)}
                token={token}
              />
            )}

            {isDemandViewModal && (
              <DemandViewModal
                id={appData?.id}
                onClose={() => setIsDemandViewModal(false)}
                apiUrl={waterAppDueApi}
                token={token}
              />
            )}
            {isDemandViewPayModal && (
              <DemandViewModal
                id={appData?.id}
                actionType={"Payment"}
                onSuccess={fetchDetails}
                onClose={() => setIsDemandViewPayModal(false)}
                apiUrl={waterAppDueApi}
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
                heading={`Enter Remarks`}
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
};

export default ApplicationDetails;
