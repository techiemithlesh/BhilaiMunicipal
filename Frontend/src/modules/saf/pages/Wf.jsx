import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  safApplicationDetailsApi,
  safDocListApi,
  safDocUploadApi,
  safDocVerifyApi,
  safPostNextLevelApi,
  safUploadedDocListApi,
  wfPermissionApi,
} from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import ApplicationDetails from "../../../components/common/ApplicationDetails ";
import SectionCard from "../../../components/common/SectionCard";
import DetailGrid from "../components/DetailGrid";
import AditionalDetails from "../components/AditionalDetails";
import RemarksAccordion from "../../../components/common/RemarksAccordion";
import {
  FaEdit,
  FaEject,
  FaEllipsisH,
  FaExchangeAlt,
  FaEye,
} from "react-icons/fa";
import ActionButton from "../../../components/common/ActionButton";
import DocVerifyModal from "../../../components/common/DocVerifyModal";
import RemarksModal from "../components/RemarksModal";
import toast from "react-hot-toast";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatTimeAMPM,
} from "../../../utils/common";
import PaymentReceiptModal from "../components/PaymentReceiptModal";
import SAMModal from "../components/SAMModal";
import FamReceiptModal from "../components/FamReceiptModal";
import DocUploadModal from "../components/DocUploadModal";
import FieldVerificationView from "../components/FieldVerificationView";
import SwmConsumerAdd from "../../property/component/Saf/SwmConsumerAdd";

function Wf() {
  const { safDtlId } = useParams();
  const [safDetails, setSafDetails] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [wfPermissions, setWfPermissions] = useState(null);
  const [wfId, setWfId] = useState(null);
  const [openModal, setOpenModal] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState(null);
  const [isShowSamModal, setIsShowSamModal] = useState(false);
  const [isShowFamModal, setIsShowFamModal] = useState(false);
  const [samReceiptId, setSamReceiptId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [isShowVerificationModal, setIsShowVerificationModal] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

  const navigate = useNavigate();
  const token = getToken();

  const closeModal = () => setOpenModal("");

  const actions = [
    {
      label: "Edit",
      onClick: () => navigate(`/saf/details/${safDtlId}/edit`),
      icon: <FaEdit />,
      show: wfPermissions?.canAppEdit,
    },
    {
      label: "Upload Document",
      onClick: () => setOpenModal("upload"),
      icon: <FaEdit />,
      show: wfPermissions?.canDocUpload,
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
    if (safDtlId) {
      fetchDetails();
    }
  }, [safDtlId, token]);

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
        safApplicationDetailsApi,
        { id: safDtlId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      setSafDetails(data);
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
        time: item?.createdAt ? formatTimeAMPM(item.createdAt) : "NA", // Ideally, derive from createdAt if needed
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
      setWfPermissions(data);
    } catch (error) {
      console.error("Failed to fetch Permission", error);
    }
  };

  const handelChange = (e) => {
    setVerificationRemarks(e.target.value);
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
        safPostNextLevelApi,
        { id: safDtlId, remarks: verificationRemarks, status: actionType },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status) {
        toast.success(response?.data?.message);
        navigate("/saf/inbox");
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
    { label: "Application No", value: safDetails?.safNo },
    { label: "Apply Date", value: safDetails?.applyDate },
    { label: "Ward No", value: safDetails?.wardNo },
    { label: "Assessment Type", value: safDetails?.assessmentType },
    { label: "Property Type", value: safDetails?.propertyType },
    { label: "Ownership Type", value: safDetails?.ownershipType },
    { label: "Road Width", value: safDetails?.roadWidth },
    { label: "Plot No", value: safDetails?.plotNo },
    { label: "Area of Plot (In Sqft)", value: safDetails?.areaOfPlot },
    { label: "Built Up Area (In Sqft)", value: safDetails?.builtupArea },
    {
      label: "Rain Water Harvesting",
      value: safDetails?.rainWaterHarvesting === true ? "Yes" : "No",
    },
    { label: "Address", value: safDetails?.propAddress },
    { label: "Circle", value: safDetails?.zone },

    ...(safDetails?.propTypeMstrId === 1
      ? [
          { label: "Apartment Name", value: safDetails?.apartmentName },
          { label: "Flat Registry Date", value: safDetails?.flatRegistryDate },
        ]
      : []),
  ];

  const fetchSafDocs = async ({ id, token }) => {
    const res = await axios.post(
      safUploadedDocListApi,
      { id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { status: res.data?.status, data: res.data?.data || [] };
  };

  const verifySafDoc = async ({ id, status, remarks, token }) => {
    const res = await axios.post(
      safDocVerifyApi,
      { id, verificationStatus: status, remarks },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { status: res.data?.status };
  };

  console.log("safDetails:", safDetails);

  return (
    <div className="mx-auto container">
      <div
        className={`flex flex-col gap-4 ${
          isFrozen ? "pointer-events-none filter blur-sm" : ""
        }`}
      >
        {safDetails ? (
          <>
            <ApplicationDetails
              assessmentType={safDetails?.assessmentType}
              fields={fields}
            />
            <SectionCard
              title="Owner Details"
              headers={[
                "SL",
                "Owner",
                "Guardian",
                "Relation",
                "Mobile",
                "Email",
                "Aadhar No",
                "PAN No",
                "Gender",
                "Dob",
                "Armed Force",
                "Specially Abled",
                "Applicant Image",
                "Applicant Document",
              ]}
              data={safDetails.owners}
              renderRow={(owner, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">{owner.ownerName}</td>
                  <td className="px-3 py-2 border">{owner.guardianName}</td>
                  <td className="px-3 py-2 border">{owner.relationType}</td>
                  <td className="px-3 py-2 border">{owner.mobileNo}</td>
                  <td className="px-3 py-2 border">{owner.email}</td>
                  <td className="px-3 py-2 border">
                    {owner?.aadharNo ?? "NA"}
                  </td>
                  <td className="px-3 py-2 border">{owner?.panNo ?? "NA"}</td>
                  <td className="px-3 py-2 border">{owner?.gender ?? "NA"}</td>
                  <td className="px-3 py-2 border">
                    {owner?.isArmedForce ? "YES" : "NO"}
                  </td>
                  <td className="px-3 py-2 border">
                    {owner?.isSpeciallyAbled ? "YES" : "NO"}
                  </td>
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
                  value: safDetails.electConsumerNo,
                },
                { label: "ACC No.", value: safDetails.electAccNo },
                {
                  label: "BIND/BOOK No.",
                  value: safDetails?.electBindBookNo ? "electBindBookNo" : "NA",
                },
                {
                  label: "Electricity Consumer Category",
                  value: safDetails.electConsCategory,
                },
              ]}
            />
            <DetailGrid
              title="Building Plan/Water Connection Details"
              data={[
                {
                  label: "Building Plan Approval No",
                  value: safDetails.buildingPlanApprovalNo || "NA",
                },
                {
                  label: "Building Plan Approval Date",
                  value: safDetails.buildingPlanApprovalDate || "NA",
                },
                {
                  label: "Water Consumer No",
                  value: safDetails?.waterConnNo || "NA",
                },
                {
                  label: "Water Connection Date",
                  value: safDetails?.waterConnDate || "NA",
                },
              ]}
            />
            <DetailGrid
              title="Property Details"
              data={[
                { label: "Khata No", value: safDetails?.khataNo || "NA" },
                { label: "Plot No", value: safDetails?.plotNo || "NA" },
                {
                  label: "Village/Mauja Name",
                  value: safDetails?.villageMaujaName || "NA",
                },
                {
                  label: "Area of Plot (in Decimal)",
                  value: safDetails?.areaOfPlot || "NA",
                },
              ]}
            />
            <DetailGrid
              title="Property Address"
              data={[
                {
                  label: "Property Address",
                  value: safDetails?.propAddress || "NA",
                },
                { label: "City", value: safDetails?.propCity || "NA" },
                { label: "Pin", value: safDetails?.propPinCode || "NA" },
                { label: "State", value: safDetails?.propState || "NA" },
                { label: "District", value: safDetails?.propDist || "NA" },
                {
                  label: "If Corresponding Address Different",
                  value: safDetails?.isCorrAddDiffer ? "Yes" : "No",
                },
              ]}
            />
            {String(safDetails?.isCorrAddDiffer) === "true" && (
              <DetailGrid
                title="Correspondence Address"
                data={[
                  {
                    label: "Correspondence Address",
                    value: safDetails?.corrAddress || "NA",
                  },
                  { label: "City", value: safDetails?.corrCity || "NA" },
                  { label: "Pin", value: safDetails?.corrPinCode || "NA" },
                  { label: "State", value: safDetails?.corrState || "NA" },
                  { label: "District", value: safDetails?.corrDist || "NA" },
                ]}
              />
            )}
            {/* FLOOR DETAILS */}
            <SectionCard
              title="Floor Details"
              note="Built Up :<span> It refers to the entire carpet area along with the thickness of the external walls of the apartment. It includes the thickness of the internal walls and the columns."
              headers={[
                "SL",
                "Floor No",
                "Usege Type",
                "Occupancy Type",
                "Construction Type",
                "Built Up Area (in Sq. Ft)",
                "From Date",
                "Upto Date (Leave blank for current date)",
              ]}
              data={safDetails.floors}
              renderRow={(floor, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">
                    {floor?.floorName || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {floor?.usageType || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {floor?.occupancyName || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {floor?.constructionType || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {floor?.builtupArea || ""}
                  </td>
                  <td className="px-3 py-2 border">
                    {floor?.dateFrom ?? "NA"}
                  </td>
                  <td className="px-3 py-2 border">{floor?.dateUpto ?? ""}</td>
                </tr>
              )}
            />

            {/* SWM */}

            {Array.isArray(safDetails?.swmConsumer) &&
              safDetails.swmConsumer.length > 0 && (
                <DetailGrid
                  title="SWM Consumer Details"
                  data={safDetails.swmConsumer.map((consumer, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg shadow-sm p-4 space-y-4 ${
                        index % 2 == 0 ? "bg-white" : "bg-gray-200"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="font-semibold text-base">
                          Consumer No.
                        </h3>
                        <span className="text-sm text-gray-600">
                          {consumer.consumerNo || "NA"}
                        </span>
                      </div>

                      {/* Consumer Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Occupancy Type</p>
                          <p className="font-medium">
                            {consumer.occupancyType || "NA"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Category</p>
                          <p className="font-medium">
                            {consumer.category || "NA"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Sub Category</p>
                          <p className="font-medium">
                            {consumer.subCategoryType || "NA"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Effective From</p>
                          <p className="font-medium">
                            {formatLocalDate(consumer.dateOfEffective)}
                          </p>
                        </div>
                      </div>

                      {/* Owners */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Owner(s)</h4>

                        <div className="space-y-2">
                          <SectionCard
                            headers={[
                              "SL",
                              "Owner",
                              "Guardian",
                              "Relation",
                              "Mobile",
                            ]}
                            data={consumer.owners}
                            renderRow={(owner, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 border">{idx + 1}</td>
                                <td className="px-3 py-2 border">
                                  {owner?.ownerName || "NA"}
                                </td>
                                <td className="px-3 py-2 border">
                                  {owner?.guardianName || "NA"}
                                </td>
                                <td className="px-3 py-2 border">
                                  {owner?.relationType || "NA"}
                                </td>
                                <td className="px-3 py-2 border">
                                  {owner?.mobileNo || "NA"}
                                </td>
                              </tr>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                />
              )}

            {/* ONE TIME WATER PAYMENT DETAILS */}

            <DetailGrid
              note={"Note: Water Tax is a one-time tax and is applicable only if you are doing your assessment for the first time or if you have never paid it earlier."}
              data={[
                {
                  label: "Water Connection Facility",
                  value: safDetails?.waterConnectionFacilityType || "NA",
                },
                {
                  label: "Water Tax Type",
                  value: safDetails?.waterTaxType || "NA",
                },
              ]}
            />

            {/* ADDITIONAL INFORMATION */}
            <AditionalDetails data={safDetails} />
            {/* TAX DETAILS */}

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
              data={safDetails.tranDtls}
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
              data={safDetails.tcVerifications}
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
            {/* MEMO DETAILS */}
            <SectionCard
              title="Memo Details"
              headers={[
                "SL",
                "Memo No",
                "Generated On",
                "Generated By",
                "ARV",
                "Quarterly Tax",
                "Effect From",
                "Memo Type",
                "Holding No",
                "View",
              ]}
              data={safDetails.memoDtls}
              renderRow={(item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 border">{idx + 1}</td>
                  <td className="px-3 py-2 border">{item?.memoNo || "NA"}</td>
                  <td className="px-3 py-2 border">
                    {formatLocalDateTime(item?.createdAt)}
                  </td>
                  <td className="px-3 py-2 border">{item?.userName || "NA"}</td>
                  <td className="px-3 py-2 border">{item?.arv || "NA"}</td>
                  <td className="px-3 py-2 border">
                    {item?.quarterlyTax || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {item?.qtr || "NA"} / {item?.fyear || "NA"}
                  </td>
                  <td className="px-3 py-2 border">{item?.memoType || "NA"}</td>
                  <td className="px-3 py-2 border">
                    {item?.holdingNo || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {item?.id && (
                      <button
                        onClick={() => {
                          setIsShowSamModal(true);
                          setSamReceiptId(item.id);
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
                id={safDetails.id}
                onClose={() => closeModal()}
                fetchDataApi={safDocListApi}
                docUploadApi={safDocUploadApi}
                token={token}
              />
            )}
            {openModal === "verify" && (
              <DocVerifyModal
                id={safDetails.id}
                onClose={() => closeModal()}
                fetchDocsApi={fetchSafDocs}
                verifyDocApi={verifySafDoc}
              />
            )}

            {isRemarksModalOpen && (
              <RemarksModal
                onClose={() => {
                  setIsRemarksModalOpen(false);
                }}
                handelChange={handelChange}
                handleSubmit={forwardBackward}
                remarks={verificationRemarks}
                heading={`Enter ${actionType} Remarks`}
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

            {/* same modal */}
            {isShowSamModal && (
              <SAMModal
                id={samReceiptId}
                onClose={() => setIsShowSamModal(false)}
              />
            )}

            {isShowFamModal && (
              <FamReceiptModal
                id={1}
                onClose={() => setIsShowFamModal(false)}
              />
            )}
            {/* Verification Dtl modal */}
            {isShowVerificationModal && (
              <FieldVerificationView
                id={verificationId}
                onClose={() => setIsShowVerificationModal(false)}
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
      {isFrozen && (
        <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
          <div className="font-semibold text-gray-800 text-lg">
            Processing...
          </div>
        </div>
      )}
    </div>
  );
}

export default Wf;
