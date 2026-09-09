import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getWithExpiry, removeStoreData } from "../../../utils/auth";
import axios from "axios";
import { waterApplyApi, waterApplyReviewTaxApi } from "../../../api/endpoints";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import SuccessModal from "../../../modules/property/component/SuccessModal";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

export default function PreviewPage() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.citizenAuth.token);
  const [formData, setFormData] = useState(null);
  const [masterData, setMasterData] = useState(null);
  const [newWardList, setNewWardList] = useState([]);
  const [tax, setTax] = useState(null);
  const [submitResponse, setSubmitResponse] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Function to fetch tax details
  const reviewTax = async (data) => {
    try {
      if (data && token) {
        const response = await axios.post(
          waterApplyReviewTaxApi,
          { ...data, ulbId: ulbId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response?.data?.status) {
          setTax(response?.data?.data);
        } else {
          toast.error(
            response?.data?.message || "Failed to fetch tax details."
          );
        }
      }
    } catch (error) {
      console.error("Error fetching tax:", error);
      toast.error("An error occurred while fetching tax details.");
    }
  };

  useEffect(() => {
    const savedFormData = getWithExpiry("waterConnectionFormData");
    const savedMasterData = getWithExpiry("waterMasterData");
    const savedNewWardList = getWithExpiry("waterNewWardList");

    if (!savedFormData) {
      navigate("/citizen/application");
      return;
    }

    setFormData(savedFormData);
    setMasterData(savedMasterData || {});
    setNewWardList(savedNewWardList || []);

    reviewTax(savedFormData);
  }, [navigate, token]);
  const getName = (list, id, key) => {
    if (!list || !id) return "N/A";
    const item = list.find((i) => i.id == id);
    return item ? item[key] : "N/A";
  };

  const handelSubmit = async () => {
    try {
      const res = await axios.post(
        waterApplyApi,
        { ...formData, ulbId: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res?.data?.status) {
        toast.success(res.data?.message);
        setSubmitResponse(res.data?.data);
        setModalOpen(true);
        setFormData(null);
        setMasterData(null);
        setNewWardList(null);
        setTax(null);

        removeStoreData("waterConnectionFormData");
        removeStoreData("waterMasterData");
        removeStoreData("waterNewWardList");

        // Do NOT clear state here. Wait until the modal is closed.
      } else {
        toast.error(res?.data?.message || "Submission failed.");
      }
    } catch (error) {
      console.error("Error Submitting Data:", error);
      toast.error("An error occurred during submission.");
    }
  };

  if (isModalOpen && submitResponse) {
    return (
      <div className="flex flex-col gap-6 text-gray-700 text-lg">
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title="Application Submitted"
          message={
            <>
              Your application has been successfully received. <br />
              <strong>Application No: {submitResponse.applicationNo}</strong>
            </>
          }
          buttonText="OK"
          onConfirm={() => {
            setModalOpen(false);
            navigate("/water/app/search");
          }}
          showSecondaryButton
          secondaryButtonText="Upload Documents"
          onSecondaryAction={() => {
            setModalOpen(false);
            // Clear state and local storage AFTER modal is closed
            setFormData(null);
            setMasterData(null);
            setNewWardList([]);
            setTax(null);
            removeStoreData("waterConnectionFormData");
            removeStoreData("waterMasterData");
            removeStoreData("waterNewWardList");
            navigate(`/water/app/detail/${submitResponse.applicationId}`);
          }}
        />
      </div>
    );
  }

  if (!formData || !masterData) {
    return (
      <div className="flex flex-col gap-6 p-6 text-gray-700 text-lg">
        <h2 className="font-semibold text-xl">Loading...</h2>
        <p>Please wait while we load your application details.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-gray-700 text-lg">
      {/* Form Card 1: Property Details */}
      <div className="flex flex-col gap-4 bg-white shadow p-4 border-t-4 border-blue-500 rounded-lg">
        <h3 className="font-semibold text-gray-700 text-xl">
          Property Details
        </h3>
        <div className="gap-x-8 gap-y-4 grid grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Type of Connection
            </label>
            <p className="text-gray-900 text-sm">
              {getName(
                masterData?.connectionType,
                formData.connectionTypeId,
                "connectionType"
              )}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Connection Through
            </label>
            <p className="text-gray-900 text-sm">
              {getName(
                masterData?.connectionThrow,
                formData.connectionThroughId,
                "connectionThrough"
              )}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Property Type
            </label>
            <p className="text-gray-900 text-sm">
              {getName(
                masterData?.propertyType,
                formData.propertyTypeId,
                "propertyType"
              )}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Owner Type
            </label>
            <p className="text-gray-900 text-sm">
              {getName(
                masterData?.ownershipType,
                formData.ownershipTypeId,
                "ownershipType"
              )}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Category Type
            </label>
            <p className="text-gray-900 text-sm">{formData.category}</p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Pipeline Type
            </label>
            <p className="text-gray-900 text-sm">
              {getName(
                masterData?.pipelineType,
                formData.pipelineTypeId,
                "pipelineType"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card 2: Applicant Property Details */}
      <div className="flex flex-col gap-4 bg-white shadow p-6 border-yellow-500 border-t-4 rounded-lg">
        <h3 className="font-semibold text-gray-700 text-xl">
          Applicant Property Details
        </h3>
        <div className="gap-x-8 gap-y-4 grid grid-cols-1 md:grid-cols-2">
          {formData?.holdingNo && (
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-500 text-sm">
                Holding No.
              </label>
              <p className="text-gray-900 text-sm">{formData.holdingNo}</p>
            </div>
          )}
          {formData?.safNo && (
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-500 text-sm">
                Saf No.
              </label>
              <p className="text-gray-900 text-sm">{formData.safNo}</p>
            </div>
          )}
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Ward No.
            </label>
            <p className="text-gray-900 text-sm">
              {getName(masterData?.wardList, formData.wardMstrId, "wardNo")}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              New Ward No.
            </label>
            <p className="text-gray-900 text-sm">
              {newWardList.find((w) => w.id === formData.newWardMstrId)
                ?.wardNo || "N/A"}
            </p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Total Area (in Sq. Ft)
            </label>
            <p className="text-gray-900 text-sm">{formData.areaSqft}</p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Landmark
            </label>
            <p className="text-gray-900 text-sm">{formData.landmark}</p>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Pin Code
            </label>
            <p className="text-gray-900 text-sm">{formData.pinCode}</p>
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="mb-1 font-medium text-gray-500 text-sm">
              Address
            </label>
            <p className="text-gray-900 text-sm">{formData.address}</p>
          </div>
        </div>
      </div>

      {/* Applicant Details Table */}
      <div className="flex flex-col gap-4 bg-white shadow p-6 border-green-500 border-t-4 rounded-lg">
        <h3 className="font-semibold text-gray-700 text-xl">
          Applicant Details
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                  Owner Name
                </th>
                <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                  Guardian Name
                </th>
                <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                  DOB
                </th>
                <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                  Mobile No.
                </th>
                <th className="px-4 py-2 border border-gray-500 font-semibold text-gray-500 text-xs text-left uppercase tracking-wider">
                  Email ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.ownerDtl.map((app, idx) => (
                <tr key={app.id}>
                  <td className="px-4 py-2 border border-gray-500 font-medium text-gray-900 text-sm whitespace-nowrap">
                    {app.ownerName}
                  </td>
                  <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                    {app.guardianName}
                  </td>
                  <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                    {app.dob}
                  </td>
                  <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                    {app.mobileNo}
                  </td>
                  <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                    {app.email}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Details Table */}
      <div className="flex flex-col gap-4 bg-white shadow p-6 border-green-500 border-t-4 rounded-lg">
        <h3 className="font-semibold text-gray-700 text-xl">Tax Details</h3>
        {tax ? (
          <div className="overflow-x-auto">
            <div className="space-y-3 text-gray-700 text-base">
              <div>
                <span className="font-semibold">Rate:</span> ₹{tax?.rate?.rate}{" "}
                per {tax?.rate?.fromArea} - {tax?.rate?.uptoArea} sqft
              </div>
              <div>
                <span className="font-semibold">Effective From:</span>{" "}
                {tax?.rate?.effectiveFrom}
              </div>
              <div>
                <span className="font-semibold">Connection Fee:</span> ₹
                {tax?.connFee}
              </div>
              <div>
                <span className="font-semibold">Penalty:</span> ₹{tax?.penalty}
                {tax?.description && (
                  <span className="text-green-600 text-sm text-clip">
                    {" "}
                    ({tax?.description})
                  </span>
                )}
              </div>
              <div>
                <span className="font-semibold">Total Charge:</span>{" "}
                <span className="font-bold text-green-700 text-lg">
                  ₹{tax?.totalCharge}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Tax details not available.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-1 rounded-full font-semibold text-white leading-6 transition duration-300"
        >
          Back
        </button>
        <button
          onClick={handelSubmit}
          className="bg-green-600 hover:bg-green-700 px-6 py-1 rounded-full font-semibold text-white leading-6 transition duration-300"
        >
          Final Submit
        </button>
      </div>
    </div>
  );
}
