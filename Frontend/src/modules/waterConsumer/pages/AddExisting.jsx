import { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import FormCard from "../../../components/common/FormCard";
import DetailsTable from "../../../components/common/DetailsTable";
import FileUpload from "../../../components/common/FileUpload";
import { getToken, getWithExpiry, setWithExpiry } from "../../../utils/auth";
import axios from "axios";
import {
  validateHoldingNoApi,
  validateSafNoApi,
  waterAddExistingConsumerTestApi,
  waterGetMasterDataApi,
  waterMeterTypeListApi,
} from "../../../api/endpoints";
import toast from "react-hot-toast";


export default function AddExisting() {
  const navigate = useNavigate();
  const token = getToken();

  const [applicantCounter, setApplicantCounter] = useState(2);
  const [wardList, setWardList] = useState([]);
  const [propertyTypeList, setPropertyTypeList] = useState([]);
  const [connectionTypeList, setConnectionTypeList] = useState([]);
  const [connectionThrowList, setConnectionThrowList] = useState([]);
  const [categoryTypeList, setCategoryTypeList] = useState([]);
  const [meterTypeList, setMeterTypeList] = useState([]);
  const [masterData, setMasterData] = useState(null);
  const [validationError, setValidationError] = useState({});
  const [documentFiles, setDocumentFiles] = useState([]);

  const [formData, setFormData] = useState(() => {
    const savedData = getWithExpiry("waterAddExistingFormData");
    if (savedData) return { ...savedData, connectionTypeId: 2 };
    return {
      category: "APL",
      connectionTypeId: 2,
      connectionThroughId: "",
      propertyTypeId: "",
      ownerDtl: [
        {
          id: 1,
          ownerName: "",
          guardianName: "",
          mobileNo: "",
        },
      ],
      wardMstrId: "",
      landmark: "",
      pinCode: "",
      address: "",
      holdingNo: "",
      safNo: "",
      oldConsumerNo: "",
      connectionDate: "",
      meterTypeId: 1,
      meterNo: "",
      initialReading: "",
    };
  });

  useEffect(() => {

    const savedMasterData = getWithExpiry("waterMasterData");
    if (savedMasterData) {
      setMasterData(savedMasterData);
      setWardList(savedMasterData?.wardList || []);
      setPropertyTypeList(savedMasterData?.propertyType || []);
      setConnectionTypeList(savedMasterData?.connectionType || []);
      setConnectionThrowList(savedMasterData?.connectionThrow || []);
      setCategoryTypeList(savedMasterData?.categoryType || []);
    } else {
      const getMasterData = async () => {
        try {
          const response = await axios.post(
            waterGetMasterDataApi,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response?.data?.status) {
            const data = response?.data?.data;
            setMasterData(data);
            setWardList(data?.wardList || []);
            setPropertyTypeList(data?.propertyType || []);
            setConnectionTypeList(data?.connectionType || []);
            setConnectionThrowList(data?.connectionThrow || []);
            setCategoryTypeList(data?.categoryType || []);
            setWithExpiry("waterMasterData", data, 15);
          }
        } catch (error) {
          console.error("Error fetching master data:", error);
        }
      };
      if (token) getMasterData();
    }

    const getMeterTypes = async () => {
      try {
        const response = await axios.post(
          waterMeterTypeListApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.status) setMeterTypeList(response.data.data || []);
      } catch (error) {
        console.error("Error fetching meter types:", error);
      }
    };
    if (token) getMeterTypes();
  }, [token]);


  const validateHoldingNo = async (holdingNo) => {
    if (!holdingNo) return;
    try {
      const response = await axios.post(
        validateHoldingNoApi,
        { holdingNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setFormData((prev) => ({
          ...prev,
          safNo: "",
          wardMstrId: data?.wardMstrId,
          address: data?.propAddress,
          ownerDtl: data?.owners || [],
        }));
      } else {
        setValidationError((prev) => ({
          ...prev,
          holdingNo: ["Invalid Holding No"],
        }));
        setFormData((prev) => ({ ...prev, holdingNo: "" }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const validateSafNo = async (safNo) => {
    if (!safNo) return;
    try {
      const response = await axios.post(
        validateSafNoApi,
        { safNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setFormData((prev) => ({
          ...prev,
          holdingNo: "",
          wardMstrId: data?.wardMstrId,
          ownerDtl: data?.owners || [],
        }));
      } else {
        setValidationError((prev) => ({ ...prev, safNo: ["Invalid SAF No"] }));
        setFormData((prev) => ({ ...prev, safNo: "" }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApplicantChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleAddApplicant = () => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [
        ...prev.ownerDtl,
        {
          id: applicantCounter,
          ownerName: "",
          guardianName: "",
          mobileNo: "",
        },
      ],
    }));
    setApplicantCounter((prev) => prev + 1);
  };

  const handleRemoveApplicant = (id) => {
    setFormData((prev) =>
      prev.ownerDtl.length > 1
        ? { ...prev, ownerDtl: prev.ownerDtl.filter((a) => a.id !== id) }
        : prev
    );
  };

  const handleChange = (name, value) => {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "meterTypeId" && value != 1) {
        updated = { ...updated, meterNo: "", initialReading: "" };
      }
      if (name === "propertyTypeId" && value != 1) {
        updated = { ...updated, category: "APL" };
      }
      return updated;
    });
    if (validationError && validationError[name]) {
      setValidationError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.meterTypeId == 1 && !documentFiles[0]?.file) {
      toast.error("Meter Declaration document is required for Meter connections.");
      return;
    }
    try {
      const payload = { ...formData };
      const response = await axios.post(
        waterAddExistingConsumerTestApi,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.status) {
        toast.success("Form validated successfully!");
        setWithExpiry("waterAddExistingFormData", formData, 15);
        setWithExpiry("waterMasterData", masterData, 15);
        navigate("/water/consumer/add-existing/preview", {
          state: { document: documentFiles[0]?.file || null, meterTypeList },
        });
      } else {
        console.error("API Validation Errors:", response?.data?.errors);
        setValidationError(response?.data?.errors);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const formFields1 = [
    {
      name: "oldConsumerNo",
      label: "Old Consumer No. (If Any)",
      type: "text",
      error: validationError?.oldConsumerNo || "",
      value: formData.oldConsumerNo || "",
      required: false,
      placeholder: "Enter Old Consumer No",
    },
    {
      name: "connectionTypeId",
      label: "Type of Connection",
      type: "select",
      error: validationError?.connectionTypeId || "",
      value: formData.connectionTypeId || "",
      required: true,
      isDisabled: true, // prefilled to Existing (Regularization)
      options: connectionTypeList.map((item) => ({
        label: item.connectionType,
        value: item.id,
      })),
    },
    {
      name: "connectionThroughId",
      label: "Connection Through",
      type: "select",
      error: validationError?.connectionThroughId || "",
      value: formData.connectionThroughId || "",
      required: true,
      options: connectionThrowList.map((item) => ({
        label: item.connectionThrough,
        value: item.id,
      })),
    },
    {
      name: "propertyTypeId",
      label: "Property Type",
      type: "select",
      error: validationError?.propertyTypeId || "",
      value: formData.propertyTypeId || "",
      required: true,
      options: propertyTypeList.map((item) => ({
        label: item.propertyType,
        value: item.id,
      })),
    },
    {
      name: "category",
      label: "Category Type",
      type: "select",
      error: validationError?.category || "",
      value: formData.category || "",
      required: true,
      isDisabled: formData.propertyTypeId != 1,
      options: categoryTypeList.map((item) => ({ label: item, value: item })),
    },
    {
      name: "holdingNo",
      label: "Holding No",
      type: "text",
      error: validationError?.holdingNo || "",
      value: formData.holdingNo || "",
      required: formData.connectionThroughId==1,
      isHidden: formData.connectionThroughId != 1,
      placeholder: "Enter Holding No",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
      onBlur: (e) => validateHoldingNo(e.target.value),
    },
  ];

  const addressFields = [
    {
      name: "wardMstrId",
      label: "Ward No.",
      type: "select",
      error: validationError?.wardMstrId || "",
      value: formData.wardMstrId || "",
      required: true,
      options: wardList.map((item) => ({ label: item.wardNo, value: item.id })),
    },
    {
      name: "landmark",
      label: "Landmark",
      type: "text",
      error: validationError?.landmark || "",
      value: formData.landmark || "",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
      required: true,
      placeholder: "Enter Landmark",
    },
    {
      name: "pinCode",
      label: "Pin Code",
      type: "text",
      error: validationError?.pinCode || "",
      value: formData.pinCode || "",
      charRegex: /^[0-9]$/,
      regex: /^[1-9][0-9]{0,5}$/,
      maxLength: 6,
      required: true,
      placeholder: "Enter Pin",
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      error: validationError?.address || "",
      value: formData.address || "",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
      minLength: 5,
      required: true,
      placeholder: "Enter Full Address",
    },
  ];

  const existingConnectionFields = [
    {
      name: "meterTypeId",
      label: "Meter Type",
      type: "select",
      error: validationError?.meterTypeId || "",
      value: formData.meterTypeId || "",
      required: false,
      options: meterTypeList.map((item) => ({
        label: item.meterType,
        value: item.id,
      })),
    },
    {
      name: "connectionDate",
      label: formData.meterTypeId == 2 ? "Effect From" : "Date Of Connection",
      type: "date",
      error: validationError?.connectionDate || "",
      value: formData.connectionDate || "",
      required: false,
    },
    {
      name: "meterNo",
      label: "Meter No",
      type: "text",
      error: validationError?.meterNo || "",
      value: formData.meterNo || "",
      required: formData.meterTypeId == 1,
      isHidden: formData.meterTypeId != 1,
      placeholder: "Enter Meter No",
    },
    {
      name: "initialReading",
      label: "Initial Reading",
      type: "number",
      error: validationError?.initialReading || "",
      value: formData.initialReading || "",
      required: formData.meterTypeId == 1,
      isHidden: formData.meterTypeId != 1,
      placeholder: "Enter Initial Reading",
    },
  ];

  const regexRules = {
    ownerName: {
      charRegex: /^[A-Za-z,.\s]$/,
      regex: /^[A-Za-z,.\s]*$/,
      finalRegex: /^[A-Za-z,.\s]{2,50}$/,
    },
    guardianName: {
      charRegex: /^[A-Za-z,.\s]$/,
      regex: /^[A-Za-z,.\s]*$/,
      finalRegex: /^[A-Za-z,.\s]{2,50}$/,
    },
    mobileNo: {
      charRegex: /^[0-9]$/,
      regex: /^[0-9]{0,10}$/,
      finalRegex: /^[0-9]{10}$/,
    },
    email: {
      charRegex: /^[A-Za-z0-9@._-]$/,
      regex: /^[A-Za-z0-9@._-]*$/,
      finalRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  };

  const getValidationHandlers = (fieldName) => {
    const { charRegex, regex } = regexRules[fieldName] || {};
    return {
      onBeforeInput: (e) => {
        if (charRegex && !charRegex.test(e.data)) e.preventDefault();
      },
      onPaste: (e) => {
        const pasted = e.clipboardData.getData("text");
        if (regex && !regex.test(pasted)) e.preventDefault();
      },
    };
  };

  const applicantColumns = [
    "Owner Name",
    "Guardian Name",
    "Mobile No.",
    "Action",
  ];
  const applicantRenderers = {
    "Owner Name": (_, row, index) => (
      <>
        <input
          type="text"
          value={row.ownerName}
          {...getValidationHandlers("ownerName")}
          onChange={(e) =>
            handleApplicantChange(row.id, "ownerName", e.target.value)
          }
          placeholder="Owner Name"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.ownerName`]
              ? "border-red-500"
              : ""
          }`}
        />
        {validationError && validationError[`ownerDtl.${index}.ownerName`] && (
          <div className="mt-1 text-red-600 text-xs">
            {validationError[`ownerDtl.${index}.ownerName`]}
          </div>
        )}
      </>
    ),
    "Guardian Name": (_, row, index) => (
      <>
        <input
          type="text"
          value={row.guardianName}
          {...getValidationHandlers("guardianName")}
          onChange={(e) =>
            handleApplicantChange(row.id, "guardianName", e.target.value)
          }
          placeholder="Guardian Name"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.guardianName`]
              ? "border-red-500"
              : ""
          }`}
        />
        {validationError &&
          validationError[`ownerDtl.${index}.guardianName`] && (
            <div className="mt-1 text-red-600 text-xs">
              {validationError[`ownerDtl.${index}.guardianName`]}
            </div>
          )}
      </>
    ),
    "Mobile No.": (_, row, index) => (
      <>
        <input
          type="text"
          value={row.mobileNo}
          {...getValidationHandlers("mobileNo")}
          onChange={(e) =>
            handleApplicantChange(row.id, "mobileNo", e.target.value)
          }
          placeholder="Mobile No."
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.mobileNo`]
              ? "border-red-500"
              : ""
          }`}
        />
        {validationError && validationError[`ownerDtl.${index}.mobileNo`] && (
          <div className="mt-1 text-red-600 text-xs">
            {validationError[`ownerDtl.${index}.mobileNo`]}
          </div>
        )}
      </>
    ),
    Action: (_, row, idx) => (
      <div className="flex justify-center gap-2">
        {formData.ownerDtl.length > 1 && (
          <button
            onClick={() => handleRemoveApplicant(row.id)}
            className="bg-red-600 hover:bg-red-700 p-2 rounded text-white"
            title="Delete"
            type="button"
          >
            <FaTrash />
          </button>
        )}
        {idx === formData.ownerDtl.length - 1 && (
          <button
            onClick={handleAddApplicant}
            className="bg-green-600 hover:bg-green-700 p-2 rounded text-white"
            title="Add"
            type="button"
          >
            <FaPlus />
          </button>
        )}
      </div>
    ),
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 text-gray-700 text-lg"
    >
      {Object.keys(validationError).length > 0 && (
        <div className="relative bg-red-100 px-4 py-3 border border-red-400 rounded text-red-700">
          <div className="my-2">
            <h4 className="font-bold">Validation Errors:</h4>
            <ul className="ml-5 list-disc">
              {Object.keys(validationError).map((key) => {
                const message = validationError[key];
                return (
                  <li key={key}>
                    {Array.isArray(message) ? message.join(", ") : message}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      <FormCard
        title="Add Existing Connection"
        formFields={formFields1}
        onChange={handleChange}
      />
      <FormCard
        title="Applicant Property Details"
        formFields={addressFields}
        onChange={handleChange}
      />
      <DetailsTable
        title="Applicant Details"
        columns={applicantColumns}
        data={formData.ownerDtl}
        renderers={applicantRenderers}
      />
      <FormCard
        title="Consumer Connection Details"
        formFields={existingConnectionFields}
        onChange={handleChange}
      />
      <div className="bg-white shadow p-4 border-t-4 border-blue-500 rounded-lg">
        <label className="block mb-1 font-medium text-gray-700 text-sm">
          {formData.meterTypeId == 1 ? "Meter Declaration" : "Supporting Document"}
          {formData.meterTypeId == 1 && <span className="text-red-500"> *</span>}
        </label>
        <FileUpload
          name="document"
          files={documentFiles}
          setFiles={setDocumentFiles}
          allowMultiple={false}
          required={formData.meterTypeId == 1}
          acceptedFileTypes={[".pdf", ".png", ".jpg", ".jpeg"]}
          maxFileSize="2MB"
        />
      </div>
      <div className="flex justify-center items-center">
        <button
          type="submit"
          className="items-center rounded-full text-white leading-4 btn-primary"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
