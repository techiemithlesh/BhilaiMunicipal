import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken, getWithExpiry, removeStoreData } from "../../../utils/auth";
import axios from "axios";
import { waterAddExistingConsumerApi } from "../../../api/endpoints";
import SuccessModal from "../../property/component/SuccessModal";
import toast from "react-hot-toast";

export default function AddExistingPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const [formData, setFormData] = useState(null);
  const [masterData, setMasterData] = useState(null);
  const [submitResponse, setSubmitResponse] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const documentFile = location.state?.document || null;
  const meterTypeList = location.state?.meterTypeList || [];

  useEffect(() => {
    const savedFormData = getWithExpiry("waterAddExistingFormData");
    const savedMasterData = getWithExpiry("waterMasterData");

    if (!savedFormData) {
      navigate("/water/consumer/add-existing");
      return;
    }

    setFormData(savedFormData);
    setMasterData(savedMasterData || {});
  }, [navigate]);

  const getName = (list, id, key) => {
    if (!list || !id) return "N/A";
    const item = list.find((i) => i.id == id);
    return item ? item[key] : "N/A";
  };

  const handleSubmit = async () => {
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === "object") {
              Object.entries(item).forEach(([childKey, childValue]) => {
                if (childValue !== null && childValue !== undefined) {
                  payload.append(`${key}[${index}][${childKey}]`, childValue);
                }
              });
            } else {
              payload.append(`${key}[${index}]`, item);
            }
          });
        } else {
          payload.append(key, value);
        }
      });
      if (documentFile) {
        payload.append("document", documentFile);
      }

      const res = await axios.post(waterAddExistingConsumerApi, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res?.data?.status) {
        toast.success(res.data?.message);
        setSubmitResponse(res.data?.data);
        setModalOpen(true);
        removeStoreData("waterAddExistingFormData");
        removeStoreData("waterMasterData");
        removeStoreData("waterNewWardList");
      } else if (res?.data?.errors) {
        toast.error(
          Object.values(res.data.errors).flat().join("\n") ||
            "Submission failed."
        );
      } else {
        toast.error(res?.data?.message || "Submission failed.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      toast.error("An error occurred during submission.");
    }
  };

  if (isModalOpen && submitResponse) {
    return (
      <div className="flex flex-col gap-6 text-gray-700 text-lg">
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title="Consumer Added"
          message={
            <>
              The consumer has been added successfully. <br />
              <strong>Consumer No: {submitResponse.consumerNo}</strong>
            </>
          }
          buttonText="OK"
          onConfirm={() => {
            setModalOpen(false);
            navigate(`/water/consumer/detail/${submitResponse.id}`);
          }}
        />
      </div>
    );
  }

  if (!formData || !masterData) {
    return (
      <div className="flex flex-col gap-6 p-6 text-gray-700 text-lg">
        <h2 className="font-semibold text-xl">Loading...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-gray-700 text-lg">
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
              Category Type
            </label>
            <p className="text-gray-900 text-sm">{formData.category}</p>
          </div>
          {formData?.oldConsumerNo && (
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-500 text-sm">
                Old Consumer No.
              </label>
              <p className="text-gray-900 text-sm">
                {formData.oldConsumerNo}
              </p>
            </div>
          )}
        </div>
      </div>

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

      {(formData?.connectionDate || formData?.meterTypeId) && (
        <div className="flex flex-col gap-4 bg-white shadow p-6 border-purple-500 border-t-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 text-xl">
            Existing Connection Details
          </h3>
          <div className="gap-x-8 gap-y-4 grid grid-cols-1 md:grid-cols-2">
            {formData?.connectionDate && (
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-500 text-sm">
                  Date Of Connection
                </label>
                <p className="text-gray-900 text-sm">
                  {formData.connectionDate}
                </p>
              </div>
            )}
            {formData?.meterTypeId && (
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-500 text-sm">
                  Meter Type
                </label>
                <p className="text-gray-900 text-sm">
                  {getName(meterTypeList, formData.meterTypeId, "meterType")}
                </p>
              </div>
            )}
            {formData?.meterNo && (
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-500 text-sm">
                  Meter No
                </label>
                <p className="text-gray-900 text-sm">{formData.meterNo}</p>
              </div>
            )}
            {formData?.initialReading && (
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-500 text-sm">
                  Initial Reading
                </label>
                <p className="text-gray-900 text-sm">
                  {formData.initialReading}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
                  Mobile No.
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.ownerDtl.map((app, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 border border-gray-500 font-medium text-gray-900 text-sm whitespace-nowrap">
                    {app.ownerName}
                  </td>
                  <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                    {app.guardianName}
                  </td>
                  <td className="px-4 py-2 border border-gray-500 text-gray-500 text-sm whitespace-nowrap">
                    {app.mobileNo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-1 rounded-full font-semibold text-white leading-6 transition duration-300"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 px-6 py-1 rounded-full font-semibold text-white leading-6 transition duration-300"
        >
          Final Submit
        </button>
      </div>
    </div>
  );
}
