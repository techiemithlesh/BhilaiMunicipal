import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getToken } from "../../../utils/auth";
import {
  FaCommentDollar,
  FaEdit,
  FaEye,
  FaFile,
  FaFortAwesome,
  FaUpload,
} from "react-icons/fa";
import axios from "axios";
import {
  waterConsumerDetailApi,
  waterConsumerDueApi,
} from "../../../api/endpoints";
import HeaderCard from "../../../components/common/HeaderCard";
import ApplicationDetails from "../../../components/common/ApplicationDetails ";
import SectionCard from "../../../components/common/SectionCard";
import DetailGrid from "../../../components/common/DetailGrid";
import ActionButton from "../../../components/common/ActionButton";
import { formatLocalDate, formatLocalDateTime } from "../../../utils/common";
import ImagePreview from "../../../components/common/ImagePreview";
import PaymentReceiptModal from "../components/PaymentReceiptModal";
import DemandViewModal from "../components/DemandViewModal";
import UpdateConnectionModal from "../components/UpdateConnectionModal";
import GenerateDemandModal from "../components/GenerateDemandModal";
import DataTableFullData from "../../../components/common/DataTableFullData";
import DemandHistoryModal from "../components/DemandHistoryModal";

function ConsumerDetails() {
  const { id } = useParams();
  const [appData, setAppData] = useState(null);
  const [headerData, setHeaderData] = useState([]);
  const [isDemandViewModal, setIsDemandViewModal] = useState(false);
  const [isDemandViewPayModal, setIsDemandViewPayModal] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isShowPaymentReceiptModal, setIsShowPaymentReceiptModal] =
    useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [isModalUpdateConnectionOpen, setIsModalUpdateConnectionOpen] =
    useState(false);
  const [isDemandGenerateModalOpen, setIsDemandGenerateModalOpen] =
    useState(false);
  const [isDemandHistoryModalOpen, setIsDemandHistoryModalOpen] =
    useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const token = getToken();

  const navigate = useNavigate();

  const actions = [
    {
      label: "View Demand",
      onClick: () => {
        setIsDemandHistoryModalOpen(true);
      },
      icon: <FaEye />,
      show: true,
    },
    {
      label: "Proceed Payment",
      onClick: () => {
        setIsDemandViewPayModal(true);
      },
      icon: <FaCommentDollar />,
      show: appData?.userPermission?.canTakePayment ?? false,
    },
    {
      label: "Update Connection",
      onClick: () => {
        setIsModalUpdateConnectionOpen(true);
      },
      icon: <FaUpload />,
      show: true,
    },
    {
      label: "Generate Demand",
      onClick: () => {
        setIsDemandGenerateModalOpen(true);
      },
      icon: <FaFortAwesome />,
      show:
        (appData?.userPermission?.canGenerateDemand ?? false) &&
        appData?.meterStatusId,
      className: `bg-red-600 hover:bg-red-700`,
    },
    {
      label: "View Application",
      to: `/water/app/detail/${appData?.applicationId}`,
      target: "_blank",
      icon: <FaFile />,
      show: appData?.applicationId,
      className: `bg-green-600 hover:bg-red-700`,
    },
    {
      label: "Edit",
      onClick: () => navigate(`/water/consumer/detail/${id}/edit`),
      icon: <FaEdit />,
      show: appData?.userPermission?.canAppEdit ?? false,
    },
  ];

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

    try {
      const response = await axios.post(
        waterConsumerDetailApi,
        { id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = response.data?.data;
      setAppData(data);
      setHeaderData({
        statusText: data?.appStatus,
      });
    } catch (error) {
      console.error("Failed to fetch SAF details", error);
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

  const fields = [
    { label: "Consumer No", value: appData?.consumerNo },
    { label: "Consumer Date", value: formatLocalDate(appData?.connectionDate) },
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

  const handelConnectionSubmit = async () => {
    setIsModalUpdateConnectionOpen(false);
    fetchDetails();
  };
  const demandGenerateSubmit = async () => {
    setIsDemandGenerateModalOpen(false);
    fetchDetails();
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
            {appData?.appStatus && (
              <HeaderCard
                statusText={headerData?.statusText}
                statusColor={"text-red-500"}
              />
            )}
            <ApplicationDetails fields={fields} />
            <SectionCard
              title="Owner Details"
              headers={["SL", "Owner", "Guardian", "Mobile", "Email", "Dob"]}
              data={appData?.owners}
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

            <DataTableFullData
              title="Payment Details"
              headers={[
                { label: "SL" },
                { label: "Transaction No" },
                { label: "Payment Mode" },
                { label: "Date" },
                { label: "Demand From" },
                { label: "Demand Upto" },
                { label: "Demand Amount Without Penalty" },
                { label: "Paid Demand" },
                { label: "Paid Penalty" },
                { label: "Total Paid Amount" },
                { label: "Balance Amount" },
                { label: "View" },
              ]}
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
                    {trans?.fromDate || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.uptoDate || "NA"}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.requestDemandAmount || ""}
                  </td>
                  <td className="px-3 py-2 border">{trans?.demandAmt || ""}</td>
                  <td className="px-3 py-2 border">
                    {trans?.penaltyAmt || ""}
                  </td>
                  <td className="px-3 py-2 border">
                    {trans?.payableAmt || ""}
                  </td>
                  <td className="px-3 py-2 border">{trans?.balance || ""}</td>
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
              data={appData?.tranDtls}
              showingItem={[5, 10, 15, 50, 100, 500, 1000]}
            />

            <DetailGrid
              title="Consumer Connection Details"
              note1="Note: In case, there is no Electric Connection. You have to upload Affidavit Form-I. (Please Tick)"
              data={[
                {
                  label: "Connection Type",
                  value: appData?.connectionDtl?.connectionType,
                },
                {
                  label: "Connection Date",
                  value:
                    formatLocalDate(appData?.connectionDtl?.connectionDate) ??
                    "NA",
                },
                {
                  label: "Meter No.",
                  value: appData?.connectionDtl?.meterNo ?? "N/A",
                },
                {
                  label: "Last Reading",
                  value: appData?.connectionDtl?.currentReading ?? "N/A",
                },
                {
                  label: "Last Reading Date",
                  value:
                    formatLocalDateTime(
                      appData?.connectionDtl?.currentReadingDate
                    ) ?? "N/A",
                },
                {
                  label: "Last Reading Img",
                  value: appData?.connectionDtl?.docPath ? (
                    <img
                      onClick={() =>
                        openPreviewModel(appData?.connectionDtl?.docPath)
                      }
                      src={appData?.connectionDtl?.docPath}
                      className="inline-block mr-3 ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
                    />
                  ) : (
                    "N/A"
                  ),
                },
                {
                  label: "User Name",
                  value: appData?.connectionDtl?.userName ?? "N/A",
                },
              ]}
            />

            {/* action buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {actions.map((btn, i) => (
                <ActionButton key={i} {...btn} />
              ))}
            </div>

            {isDemandViewModal && (
              <DemandViewModal
                id={appData?.id}
                onClose={() => setIsDemandViewModal(false)}
                apiUrl={waterConsumerDueApi}
              />
            )}
            {isDemandViewPayModal && (
              <DemandViewModal
                id={appData?.id}
                actionType={"Payment"}
                onSuccess={fetchDetails}
                onClose={() => setIsDemandViewPayModal(false)}
                apiUrl={waterConsumerDueApi}
              />
            )}
            {isModalUpdateConnectionOpen && (
              <UpdateConnectionModal
                lastConnectionTypeId={appData?.connectionDtl?.meterTypeId}
                onSuccess={handelConnectionSubmit}
                onClose={() => setIsModalUpdateConnectionOpen(false)}
                id={appData?.id}
              />
            )}
            {isDemandGenerateModalOpen && (
              <GenerateDemandModal
                lastConnectionDtl={appData?.connectionDtl}
                onSuccess={demandGenerateSubmit}
                onClose={() => setIsDemandGenerateModalOpen(false)}
                id={appData?.id}
              />
            )}

            {isDemandHistoryModalOpen && (
              <DemandHistoryModal
                onClose={() => setIsDemandHistoryModalOpen(false)}
                id={appData?.id}
                openPreviewModel={openPreviewModel}
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
          </>
        ) : (
          <div className="p-6 text-center">
            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin loader"></span>
            <p className="mt-2">Loading...</p>
          </div>
        )}

        {isModalPreviewOpen && (
          <ImagePreview
            imageSrc={previewImg}
            closePreview={closePreviewModel}
          />
        )}
      </div>
    </div>
  );
}

export default ConsumerDetails;
