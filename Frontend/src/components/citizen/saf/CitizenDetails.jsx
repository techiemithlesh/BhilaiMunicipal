import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  propertyDetailsApi,
  safApplicationDetailsApi,
  safDocListApi,
  safDocUploadApi,
  safDueApi,
  safPaymentApi,
  safPostNextLevelApi,
  wfPermissionApi,
} from "../../../api/endpoints";
import { motion } from "framer-motion";
import { FaCommentDollar, FaEye, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import AditionalDetails from "../../../modules/saf/components/AditionalDetails";
import DocUploadModal from "../../../modules/saf/components/DocUploadModal";
import RemarksModal from "../../../modules/saf/components/RemarksModal";
import DocViewModal from "../../../modules/saf/components/DocViewModal";
import SAMModal from "../../../modules/saf/components/SAMModal";
import DemandViewModal from "../../../modules/saf/components/DemandViewModal";
import PaymentReceiptModal from "../../../modules/saf/components/PaymentReceiptModal";
import FamReceiptModal from "../../../modules/saf/components/FamReceiptModal";
import FieldVerificationView from "../../../modules/saf/components/FieldVerificationView";
import SectionCard from "../../common/SectionCard";
import DetailGrid from "../../../modules/saf/components/DetailGrid";
import ActionButton from "../../common/ActionButton";
import { formatLocalDate, formatTimeAMPM } from "../../../utils/common";
import PropertyDetails from "../../../modules/property/component/PropertyDetails";
import BasicEdit from "../../../modules/property/component/BasicEdit";
import ReAssesment from "../../../modules/property/pages/ReAssesment";
import { modalVariants } from "../../../utils/motionVariable";
import { useSelector } from "react-redux";
import SAFHeaderCard from "../../../modules/saf/components/SAFHeader";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const CitizenDetails = () => {
  const { propId, safId } = useParams();
  const [propDetails, setPropDetails] = useState(null);
  const [headerData, setHeaderData] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [wfPermissions, setWfPermissions] = useState(true);
  const [wfId, setWfId] = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [paymentReceiptId, setPaymentReceiptId] = useState(null);
  const [samReceiptId, setSamReceiptId] = useState(null);
  const [verificationId, setVerificationId] = useState(null);
  const [isDocUploadModal, setIsDocUploadModal] = useState(false);
  const [isDocViewModal, setIsDocViewModal] = useState(false);
  const [isDemandViewModal, setIsDemandViewModal] = useState(false);
  const [isDemandViewPayModal, setIsDemandViewPayModal] = useState(false);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState(false);
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);
  const [isShowSamModal, setIsShowSamModal] = useState(false);
  const [isShowFamModal, setIsShowFamModal] = useState(false);
  const [isShowVerificationModal, setIsShowVerificationModal] = useState(false);
  const [isBasicEditModal, setIsBasicEditModal] = useState(false);
  const [isReAssesmentModal, setIsReAssesmentModal] = useState(false);
  const token = useSelector((state) => state.citizenAuth.token);
  const navigate = useNavigate();
  const actions = [
    {
      label: "View Demand",
      onClick: () => {
        setIsDemandViewModal(true);
      },
      icon: <FaEye />,
      show: true,
      // show: propDetails?.paymentStatus == 0,
    },
    {
      label: "Proceed Payment",
      onClick: () => {
        setIsDemandViewPayModal(true);
      },
      icon: <FaCommentDollar />,
      show: propDetails?.paymentStatus == 0,
    },
    {
      label: "ReAssessment",
      onClick: () => navigate(`/citizen/holding/reassessment/${propId}`),
      icon: <FaEye />,
      // show: true,
      show: Boolean(propId) && propDetails?.paymentStatus == 0,
    },
    {
      label: "Mutation",
      onClick: () => navigate(`/citizen/holding/mutation/${propId}`),
      icon: <FaEye />,
      // show: true,
      show: Boolean(propId) && propDetails?.paymentStatus == 0,
    },
    {
      label: "Edit",
      onClick: () => navigate(`/citizen/saf/edit/${safId}`),
      icon: <FaEye />,
      show:
        !propDetails?.isApproved &&
        (!propDetails?.isDocUpload ||
          propDetails?.isBtc ||
          propDetails?.currentRoleId == propDetails?.initiatorRoleId) &&
        Boolean(safId) &&
        propDetails?.paymentStatus == 0,
      // show: Boolean(safId) && propDetails?.paymentStatus == 0,
    },
  ];

  useEffect(() => {
    if (wfId && token) {
      fetchWfPermission();
    }
  }, [wfId, token]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [propId, safId, token]);

  const fetchPropertyDetails = async () => {
    if (propId) {
      fetchDetails(propId, propertyDetailsApi);
    }
    if (safId) {
      fetchDetails(safId, safApplicationDetailsApi);
    }
  };

  const fetchDetails = async (id, endpoint) => {
    if (!token) {
      console.warn("No token found.");
      return;
    }

    try {
      const response = await axios.post(
        endpoint,
        { id: id, ulbId: ulbId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      setPropDetails(data);
      setWfId(data.workflowId);
      setHeaderData({
        applicationNo: data?.safNo,
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
        { id: propId, remarks: verificationRemarks, status: "FORWARD" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status) {
        toast.success(response?.data?.message, {
          position: "top-right",
        });
        fetchPropertyDetails();
      } else {
        toast.error(response?.data?.message || "Something went wrong", {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setIsFrozen(false);
    }
  };

  // console.log("propDetails", propDetails);

  return (
    <div
      className={`container flex flex-col gap-6 rounded-md ${
        isFrozen ? "pointer-events-none filter blur-sm" : ""
      }`}
    >
      {propDetails ? (
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
          <PropertyDetails data={propDetails} />
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
            data={propDetails.owners}
            renderRow={(owner, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 border">{idx + 1}</td>
                <td className="px-3 py-2 border">{owner.ownerName}</td>
                <td className="px-3 py-2 border">{owner.guardianName}</td>
                <td className="px-3 py-2 border">{owner.relationType}</td>
                <td className="px-3 py-2 border">{owner.mobileNo}</td>
                <td className="px-3 py-2 border">{owner.email}</td>
                <td className="px-3 py-2 border">{owner?.aadharNo ?? "NA"}</td>
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
                value: propDetails.electConsumerNo,
              },
              { label: "ACC No.", value: propDetails.electAccNo },
              {
                label: "BIND/BOOK No.",
                value: propDetails?.electBindBookNo ? "electBindBookNo" : "NA",
              },
              {
                label: "Electricity Consumer Category",
                value: propDetails.electConsCategory,
              },
            ]}
          />
          <DetailGrid
            title="Building Plan/Water Connection Details"
            data={[
              {
                label: "Building Plan Approval No",
                value: propDetails.buildingPlanApprovalNo || "NA",
              },
              {
                label: "Building Plan Approval Date",
                value: propDetails.buildingPlanApprovalDate || "NA",
              },
              {
                label: "Water Consumer No",
                value: propDetails?.waterConnNo || "NA",
              },
              {
                label: "Water Connection Date",
                value: propDetails?.waterConnDate || "NA",
              },
            ]}
          />
          <DetailGrid
            title="Property Details"
            data={[
              { label: "Khata No", value: propDetails?.khataNo || "NA" },
              { label: "Plot No", value: propDetails?.plotNo || "NA" },
              {
                label: "Village/Mauja Name",
                value: propDetails?.villageMaujaName || "NA",
              },
              {
                label: "Area of Plot (in Decimal)",
                value: propDetails?.areaOfPlot || "NA",
              },
            ]}
          />
          <DetailGrid
            title="Property Address"
            data={[
              {
                label: "Property Address",
                value: propDetails?.propAddress || "NA",
              },
              { label: "City", value: propDetails?.propCity || "NA" },
              { label: "Pin", value: propDetails?.propPinCode || "NA" },
              { label: "State", value: propDetails?.propState || "NA" },
              { label: "District", value: propDetails?.propDist || "NA" },
              {
                label: "If Corresponding Address Different",
                value: propDetails?.isCorrAddDiffer ? "Yes" : "No",
              },
            ]}
          />
          {String(propDetails?.isCorrAddDiffer) === "true" && (
            <DetailGrid
              title="Correspondence Address"
              data={[
                {
                  label: "Correspondence Address",
                  value: propDetails?.corrAddress || "NA",
                },
                { label: "City", value: propDetails?.corrCity || "NA" },
                { label: "Pin", value: propDetails?.corrPinCode || "NA" },
                { label: "State", value: propDetails?.corrState || "NA" },
                { label: "District", value: propDetails?.corrDist || "NA" },
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
            data={propDetails.floors}
            renderRow={(floor, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 border">{idx + 1}</td>
                <td className="px-3 py-2 border">{floor?.floorName || "NA"}</td>
                <td className="px-3 py-2 border">{floor?.usageType || "NA"}</td>
                <td className="px-3 py-2 border">
                  {floor?.occupancyName || "NA"}
                </td>
                <td className="px-3 py-2 border">
                  {floor?.constructionType || "NA"}
                </td>
                <td className="px-3 py-2 border">{floor?.builtupArea || ""}</td>
                <td className="px-3 py-2 border">{floor?.dateFrom ?? "NA"}</td>
                <td className="px-3 py-2 border">{floor?.dateUpto ?? ""}</td>
              </tr>
            )}
          />

          {/* SWM CONSUMER DETAILS */}

          {Array.isArray(propDetails?.swmConsumer) &&
            propDetails.swmConsumer.length > 0 && (
              <DetailGrid
                title="SWM Consumer Details"
                data={propDetails.swmConsumer.map((consumer, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg shadow-sm p-4 space-y-4 ${
                      index % 2 == 0 ? "bg-white" : "bg-gray-200"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-semibold text-base">Consumer No.</h3>
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

          {/* WATER ONE TIME DETAILS */}
          <DetailGrid
            note={
              "Note: Water Tax is a one-time tax and is applicable only if you are doing your assessment for the first time or if you have never paid it earlier."
            }
            data={[
              {
                label: "Water Connection Facility",
                value: propDetails?.waterConnectionFacilityType || "NA",
              },
              {
                label: "Water Tax Type",
                value: propDetails?.waterTaxType || "NA",
              },
            ]}
          />

          {/* ADDITIONAL INFORMATION */}
          <AditionalDetails data={propDetails} />
          {/* TAX DETAILS */}
          <SectionCard
            title="Tax Details"
            headers={[
              "SL",
              "ARV",
              "Effect From",
              "Holding Tax",
              "Water Tax",
              "Conservancy/Latrine Tax",
              "Education Cess",
              "RWH Penalty",
              "Quarterly Tax",
            ]}
            data={propDetails.taxDtl}
            renderRow={(tax, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2 border">{idx + 1}</td>
                <td className="px-3 py-2 border">{tax?.arv || "NA"}</td>
                <td className="px-3 py-2 border">
                  {tax?.qtr && tax?.fyear ? `${tax.qtr} / ${tax.fyear}` : "NA"}
                </td>

                <td className="px-3 py-2 border">{tax?.holdingTax || ""}</td>
                <td className="px-3 py-2 border">{tax?.rwhTax || ""}</td>
                <td className="px-3 py-2 border">{tax?.latrineTax || ""}</td>
                <td className="px-3 py-2 border">
                  {tax?.educationCess ?? "NA"}
                </td>
                <td className="px-3 py-2 border">{tax?.rwhTax ?? ""}</td>
                <td className="px-3 py-2 border">{tax?.quarterlyTax ?? ""}</td>
              </tr>
            )}
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
            data={propDetails.tranDtls}
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
                <td className="px-3 py-2 border">{trans?.fromFyear || "NA"}</td>
                <td className="px-3 py-2 border">{trans?.uptoFyear || "NA"}</td>
                <td className="px-3 py-2 border">{trans?.payableAmt || ""}</td>
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
              id={propDetails.id}
              onClose={() => setIsDocUploadModal(false)}
              fetchDataApi={safDocListApi}
              docUploadApi={safDocUploadApi}
              token={token}
              ulbId={ulbId}
            />
          )}

          {isDocViewModal && (
            <DocViewModal
              id={propDetails.id}
              onClose={() => setIsDocViewModal(false)}
              token={token}
            />
          )}

          {isDemandViewModal && (
            <DemandViewModal
              id={propDetails.id}
              onClose={() => setIsDemandViewModal(false)}
              apiUrl={safDueApi}
            />
          )}
          {isDemandViewPayModal && (
            <DemandViewModal
              id={propDetails.id}
              actionType={"Payment"}
              onSuccess={fetchPropertyDetails}
              onClose={() => setIsDemandViewPayModal(false)}
              apiUrl={safDueApi}
              submitApiUrl={safPaymentApi}
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

          {/* same modal */}
          {isShowSamModal && (
            <SAMModal
              id={samReceiptId}
              onClose={() => setIsShowSamModal(false)}
            />
          )}

          {isShowFamModal && (
            <FamReceiptModal id={1} onClose={() => setIsShowFamModal(false)} />
          )}

          {/* Verification Dtl modal */}
          {isShowVerificationModal && (
            <FieldVerificationView
              id={verificationId}
              onClose={() => setIsShowVerificationModal(false)}
            />
          )}

          {/* Basic Edit Modal */}
          {isBasicEditModal && (
            <BasicEdit
              propDetails={propDetails}
              onClose={() => setIsBasicEditModal(false)}
            />
          )}

          {/* Reassesment Modal */}
          {isReAssesmentModal && (
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-blue-900 text-xl">
                    Reassessment
                  </h2>
                  <button
                    className="text-gray-600 hover:text-red-600"
                    onClick={() => setIsReAssesmentModal(false)}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>{" "}
                <div className="flex flex-col flex-grow gap-4 overflow-scroll scrollbar-hide">
                  <ReAssesment
                    propId={propId}
                    onClose={() => setIsReAssesmentModal(false)}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 text-center" role="status" aria-label="Loading">
          <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin"></span>
          <p className="mt-2">Loading...</p>
        </div>
      )}
    </div>
  );
};

export default CitizenDetails;
