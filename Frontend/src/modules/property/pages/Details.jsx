import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  propDueApi,
  propertyDetailsApi,
  propPaymentApi,
  safDocListApi,
  safDocUploadApi,
  safPostNextLevelApi,
  wfPermissionApi,
} from "../../../api/endpoints";
import SectionCard from "../../../components/common/SectionCard";
import { motion } from "framer-motion";
import { FaCommentDollar, FaEdit, FaEye, FaFilePdf, FaTimes } from "react-icons/fa";
import ActionButton from "../../../components/common/ActionButton";
import { formatLocalDate, formatTimeAMPM } from "../../../utils/common";
import toast from "react-hot-toast";
import { getToken } from "../../../utils/auth";
import DetailGrid from "../../saf/components/DetailGrid";
import AditionalDetails from "../../saf/components/AditionalDetails";
import DocUploadModal from "../../saf/components/DocUploadModal";
import RemarksModal from "../../saf/components/RemarksModal";
import DocViewModal from "../../saf/components/DocViewModal";
import SAMModal from "../../saf/components/SAMModal";
import DemandViewModal from "../../saf/components/DemandViewModal";
import PaymentReceiptModal from "../../saf/components/PaymentReceiptModal";
import FamReceiptModal from "../../saf/components/FamReceiptModal";
import FieldVerificationView from "../../saf/components/FieldVerificationView";
import PropertyDetails from "../component/PropertyDetails";
import BasicEdit from "../component/BasicEdit";
import ReAssesment from "./ReAssesment";
import { modalVariants } from "../../../utils/motionVariable";
import DeactivateHoldingModal from "../component/DeactivateHoldingModal";
import OwnerDtlEdit from "../component/OwnerDtlEdit";
import GenerateNoticeModal from "../component/GenerateNoticeModal";
import ImagePreview from "../../../components/common/ImagePreview";

const Details = () => {
  const { propId } = useParams();
  const [propDetails, setPropDetails] = useState(null);
  const [wfPermissions, setWfPermissions] = useState(true);
  const [wfId, setWfId] = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const [ids, setIds] = useState({
    paymentReceipt: null,
    samReceipt: null,
    verification: null,
  });
  const [modal, setModal] = useState({
    docUpload: false,
    docView: false,
    demandView: false,
    demandPay: false,
    remarks: false,
    paymentReceipt: false,
    sam: false,
    fam: false,
    verification: false,
    basicEdit: false,
    ownerDetailEdit: false,
    reAssessment: false,
    deactivateHolding: false,
    noticeGenerate:false,
  });
  const token = getToken();
  const navigate = useNavigate();

  const actions = [
    {
      label: "View Demand",
      onClick: () => setModal((m) => ({ ...m, demandView: true })),
      icon: <FaEye />,
      show: true,
      disabled:propDetails?.lockStatus,
    },
    {
      label: "Proceed Payment",
      onClick: () => setModal((m) => ({ ...m, demandPay: true })),
      icon: <FaCommentDollar />,
      show: propDetails?.userPermission?.canTakePayment ?? false,
      disabled:propDetails?.lockStatus,
    },
    {
      label: "Basic Edit",
      onClick: () => setModal((m) => ({ ...m, basicEdit: true })),
      icon: <FaEye />,
      show: propDetails?.userPermission?.canAppEdit ?? false,
      disabled:propDetails?.lockStatus,
    },
    {
      label: "Owner Detail Edit",
      onClick: () => setModal((m) => ({ ...m, ownerDetailEdit: true })),
      icon: <FaEye />,
      show: propDetails?.userPermission?.canAppEdit ?? false,
      disabled:propDetails?.lockStatus,
    },
    {
      label: "Deactivate Holding",
      onClick: () => setModal((m) => ({ ...m, deactivateHolding: true })),
      icon: <FaEye />,
      show: propDetails?.userPermission?.canAppLock ?? false,
      disabled:propDetails?.lockStatus,
    },
    {
      label: "View Saf",
      onClick: () =>
        window.open(`/saf/details/${propDetails?.safDetailId}`, "_blank"),
      icon: <FaEye />,
      show: true,
    },
    {
      label: "ReAssessment",
      onClick: () => navigate(`/property/details/${propId}/Reassessment`),
      icon: <FaEye />,
      show: propDetails?.userPermission?.canAdd ?? false,
      disabled:propDetails?.lockStatus,
    },
    {
      label: "Mutation",
      onClick: () => navigate(`/property/details/${propId}/Mutation`),
      icon: <FaEye />,
      show: propDetails?.userPermission?.canAdd ?? false,
      disabled:propDetails?.lockStatus,
    },
    
    {
      label: "Generate Notice",
      onClick: () => setModal((m) => ({ ...m, noticeGenerate: true })),
      icon: <FaEye />,
      show: propDetails?.userPermission?.canGenerateNotice?? false,
      disabled:propDetails?.lockStatus,
    },
  ];

  useEffect(() => {
    if (propId) fetchDetails();
  }, [propId, token]);
  useEffect(() => {
    if (wfId && token) fetchWfPermission();
  }, [wfId, token]);

  const fetchDetails = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        propertyDetailsApi,
        { id: propId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data?.data;
      setPropDetails(data);  
    } catch (error) {
      console.error("Failed to fetch SAF details", error);
    }
  };

  const fetchWfPermission = async () => {
    try {
      const response = await axios.post(
        wfPermissionApi,
        { wfId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) setWfPermissions(response.data?.data);
    } catch (error) {
      console.error("Failed to fetch Permission", error);
    }
  };

  const handelChange = (e) => setVerificationRemarks(e.target.value);

  const forwardBackward = () => {
    if (verificationRemarks.trim() === "")
      return toast.error("Remarks are required");
    postNextLevel();
    setModal((m) => ({ ...m, remarks: false }));
  };
  const postNextLevel = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        safPostNextLevelApi,
        { id: propId, remarks: verificationRemarks, status: "FORWARD" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        toast.success(response?.data?.message);
        fetchDetails();
      } else {
        toast.error(response?.data?.message || "Something went wrong", {position: "top-right"});
      }
    } catch (error) {
      console.error("Failed to post", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const openPreviewModel = (link) => {
    setIsModalPreviewOpen(true);
    setPreviewImg(link);
  };

  const closePreviewModel = () => {
    setIsModalPreviewOpen(false);
    setPreviewImg("");
  };

  return (
    <div className="space-y-6 w-full">
      <div
        className={`flex flex-col gap-4 ${
          isFrozen ? "pointer-events-none filter blur-sm" : ""
        }`}
      >
        {propDetails ? (
          <>
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
                  <td className="px-3 py-2 border">
                    {owner?.aadharNo ?? "NA"}
                  </td>
                  <td className="px-3 py-2 border">{owner?.panNo ?? "NA"}</td>
                  <td className="px-3 py-2 border">{owner?.gender ?? "NA"}</td>
                  <td className="px-3 py-2 border">{owner?.dob ?? "NA"}</td>
                  <td className="px-3 py-2 border">
                    {owner?.isArmedForce ? "YES" : "NO"}
                  </td>
                  <td className="px-3 py-2 border">
                    {owner?.isSpeciallyAbled ? "YES" : "NO"}
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
                  value: propDetails?.electBindBookNo
                    ? "electBindBookNo"
                    : "NA",
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
            <AditionalDetails data={propDetails} />
            {/* Additional Document */}
            {propDetails?.additionalDoc && Array.isArray(propDetails?.additionalDoc) && propDetails?.additionalDoc?.length>0 &&(
              <>
                <SectionCard
                  title="Additional Document"
                  headers={[
                    "SL",
                    "Document Name",
                    "File",
                  ]}
                  data={propDetails?.additionalDoc}
                  renderRow={(item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 border">{idx + 1}</td>
                      <td className="px-3 py-2 border">{item.documentName}</td>
                      <td className="px-3 py-2 border text-center">
                        {item.docPath ? (
                          <>
                            {item.docPath.toLowerCase().endsWith(".pdf") ? (
                              <FaFilePdf
                                size={40}
                                className="mx-auto text-red-600 cursor-pointer"
                                onClick={() => openPreviewModel(item?.docPath)}
                                title="Click to view PDF"
                              />
                            ) : (
                              <img
                                src={item?.docPath}
                                onClick={() => openPreviewModel(item?.docPath)}
                                className="inline-block ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
                              />
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                      </td>
                    </tr>
                  )}
                />
                {isModalPreviewOpen && (
                  <ImagePreview
                    imageSrc={previewImg}
                    closePreview={closePreviewModel}
                  />
                )}
              </>
            )}
            <SectionCard
              title="Tax Details"
              headers={[
                "SL",
                "ARV",
                "Effect From",
                "Property Tax",
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
                    {tax?.qtr && tax?.fyear
                      ? `${tax.qtr} / ${tax.fyear}`
                      : "NA"}
                  </td>
                  <td className="px-3 py-2 border">{tax?.propertyTax || ""}</td>
                  <td className="px-3 py-2 border">{tax?.holdingTax || ""}</td>
                  <td className="px-3 py-2 border">{tax?.waterTax || ""}</td>
                  <td className="px-3 py-2 border">{tax?.latrineTax || ""}</td>
                  <td className="px-3 py-2 border">
                    {tax?.educationCess ?? "NA"}
                  </td>
                  <td className="px-3 py-2 border">{tax?.rwhTax ?? ""}</td>
                  <td className="px-3 py-2 border">
                    {tax?.quarterlyTax ?? ""}
                  </td>
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
                          setModal((m) => ({ ...m, paymentReceipt: true }));
                          setIds((ids) => ({
                            ...ids,
                            paymentReceipt: trans.id,
                          }));
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
            <div className="flex flex-wrap justify-center gap-3">
              {wfPermissions ? (
                actions.map((btn, i) => <ActionButton key={i} {...btn} />)
              ) : (
                <div className="p-6 text-center">
                  <span className="inline-block border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 animate-spin loader"></span>
                  <p className="mt-2">Loading...</p>
                </div>
              )}
            </div>
            {modal.docUpload && (
              <DocUploadModal
                id={propDetails.id}
                onClose={() => setModal((m) => ({ ...m, docUpload: false }))}
                fetchDataApi={safDocListApi}
                docUploadApi={safDocUploadApi}
                token={token}
              />
            )}
            {modal.docView && (
              <DocViewModal
                id={propDetails.id}
                onClose={() => setModal((m) => ({ ...m, docView: false }))}
                token={token}
              />
            )}
            {modal.demandView && (
              <DemandViewModal
                id={propDetails.id}
                onClose={() => setModal((m) => ({ ...m, demandView: false }))}
                apiUrl={propDueApi}
              />
            )}
            {modal.demandPay && (
              <DemandViewModal
                id={propDetails.id}
                actionType={"Payment"}
                onSuccess={fetchDetails}
                onClose={() => setModal((m) => ({ ...m, demandPay: false }))}
                apiUrl={propDueApi}
                submitApiUrl={propPaymentApi}
              />
            )}
            {modal.remarks && (
              <RemarksModal
                onClose={() => setModal((m) => ({ ...m, remarks: false }))}
                handelChange={handelChange}
                handleSubmit={forwardBackward}
                remarks={verificationRemarks}
                heading={`Enter Remarks`}
                btn={"Send"}
              />
            )}
            {modal.paymentReceipt && (
              <PaymentReceiptModal
                id={ids.paymentReceipt}
                onClose={() =>
                  setModal((m) => ({ ...m, paymentReceipt: false }))
                }
              />
            )}
            {modal.sam && (
              <SAMModal
                id={ids.samReceipt}
                onClose={() => setModal((m) => ({ ...m, sam: false }))}
              />
            )}
            {modal.fam && (
              <FamReceiptModal
                id={propDetails.id}
                onClose={() => setModal((m) => ({ ...m, fam: false }))}
              />
            )}
            {modal?.noticeGenerate &&(
              <GenerateNoticeModal
                id={propDetails?.id}
                onClose={() => setModal((m) => ({ ...m, noticeGenerate: false }))}
                permissionSet={propDetails?.userPermission}
              />
            )}
            {modal.verification && (
              <FieldVerificationView
                id={ids.verification}
                onClose={() => setModal((m) => ({ ...m, verification: false }))}
              />
            )}
            {modal.basicEdit && (
              <BasicEdit
                propDetails={propDetails}
                onClose={() => setModal((m) => ({ ...m, basicEdit: false }))}
                token={token}
              />
            )}
            {modal.ownerDetailEdit && (
              <OwnerDtlEdit
                propDetails={propDetails}
                onClose={() =>
                  setModal((m) => ({ ...m, ownerDetailEdit: false }))
                }
                token={token}
              />
            )}
            {modal.deactivateHolding && (
              <DeactivateHoldingModal
                propDetails={propDetails}
                onSuccess={fetchDetails}
                onCloseModal={() =>
                  setModal((m) => ({ ...m, deactivateHolding: false }))
                }
              />
            )}
            {modal.reAssessment && (
              <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={modalVariants}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-blue-900 text-xl">
                      Reassessment
                    </h2>
                    <button
                      className="text-gray-600 hover:text-red-600"
                      onClick={() =>
                        setModal((m) => ({ ...m, reAssessment: false }))
                      }
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                  <div className="flex flex-col flex-grow gap-4 overflow-scroll scrollbar-hide">
                    <ReAssesment
                      propId={propId}
                      onClose={() =>
                        setModal((m) => ({ ...m, reAssessment: false }))
                      }
                    />
                  </div>
                </motion.div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-blue-600 border-t-transparent rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Details;
