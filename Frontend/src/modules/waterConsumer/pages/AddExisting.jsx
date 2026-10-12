import { useEffect, useState } from "react";
import { FaCheck, FaCopy, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import FormCard from "../../../components/common/FormCard";
import DetailsTable from "../../../components/common/DetailsTable";
import FileUpload from "../../../components/common/FileUpload";
import { getToken, getWithExpiry, setWithExpiry } from "../../../utils/auth";
import axios from "axios";
import {
  validateHoldingNoApi,
  waterAddExistingConsumerApi,
  waterGetMasterDataApi,
  waterMeterTypeListApi,
} from "../../../api/endpoints";
import toast from "react-hot-toast";
import { appendToFormData } from "../../../utils/common";
import SuccessModal from "../../../components/common/SuccessModal";

// Moved static configuration objects outside the component to prevent recreation on every render
const REGEX_RULES = {
  ownerName: {
    charRegex: /^[A-Za-z,.\s]$/,
    regex: /^[A-Za-z,.\s]*$/,
  },
  guardianName: {
    charRegex: /^[A-Za-z,.\s]$/,
    regex: /^[A-Za-z,.\s]*$/,
  },
  mobileNo: {
    charRegex: /^[0-9]$/,
    regex: /^[0-9]{0,10}$/,
  },
};

const getValidationHandlers = (fieldName) => {
  const { charRegex, regex } = REGEX_RULES[fieldName] || {};
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

const INITIAL_FORM_STATE = {
  category: "APL",
  connectionTypeId: 2,
  connectionThroughId: "",
  propertyTypeId: "",
  noOfRoom: 1,
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
  meterTypeId: 2,
  meterNo: "",
  initialReading: "",
};

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
  const [supportingDocumentFiles, setSupportingDocumentFiles] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isFormSubmit, setIsFormSubmit] = useState(false);
  const [submitResponse, setSubmitResponse] = useState({});
  
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState(() => {
    return INITIAL_FORM_STATE;
  });

  // Fetch Master Data & Meter Types
  useEffect(() => {
    if (!token) return;

    const savedMasterData = getWithExpiry("waterMasterData");
    if (savedMasterData) {
      setMasterData(savedMasterData);
      setWardList(savedMasterData?.wardList || []);
      setPropertyTypeList(savedMasterData?.propertyType || []);
      setConnectionTypeList(savedMasterData?.connectionType || []);
      setConnectionThrowList(savedMasterData?.connectionThrow || []);
      setCategoryTypeList(savedMasterData?.categoryType || []);
    } else {
      const fetchMasterData = async () => {
        try {
          const response = await axios.post(waterGetMasterDataApi, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
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
      fetchMasterData();
    }

    const fetchMeterTypes = async () => {
      try {
        const response = await axios.post(waterMeterTypeListApi, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response?.data?.status) {
          setMeterTypeList(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching meter types:", error);
      }
    };
    fetchMeterTypes();
  }, [token]);

  const validateHoldingNo = async (holdingNo) => {
    if (!holdingNo) return;
    try {
      const response = await axios.post(validateHoldingNoApi, { holdingNo }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.data?.status) {
        const data = response?.data?.data;
        setFormData((prev) => ({
          ...prev,
          safNo: "",
          wardMstrId: data?.wardMstrId ?? prev.wardMstrId,
          address: data?.propAddress ?? prev.address,
          ownerDtl: data?.owners?.length ? data.owners : prev.ownerDtl,
        }));
      } else {
        setValidationError((prev) => ({ ...prev, holdingNo: ["Invalid Holding No"] }));
        setFormData((prev) => ({ ...prev, holdingNo: "" }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApplicantChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }));
  };

  const handleAddApplicant = () => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [
        ...prev.ownerDtl,
        { id: applicantCounter, ownerName: "", guardianName: "", mobileNo: "" },
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
      const parsedValue = parseInt(value, 10);

      if (name === "propertyTypeId" && ![1, 2].includes(parsedValue)) {
        updated.category = "APL";
      }
      if (name === "meterTypeId" && parsedValue !== 1) {
        updated.meterNo = "";
        updated.initialReading = "";
        updated.isMeterWorking = "";
        updated.fixRate = "";
      }
      if (name === "propertyTypeId" && ![3, 4].includes(parsedValue)) {
        updated.noOfRoom = 1;
      }
      if (name === "isMeterWorking" && parsedValue === 1) {
        updated.fixRate = "";
      }
      return updated;
    });

    if (validationError?.[name]) {
      setValidationError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentFiles[0]?.file) {
      toast.error("Connection Declaration document is required.");
      return;
    }
    if (!supportingDocumentFiles[0]?.file) {
      toast.error("Supporting document is required.");
      return;
    }
    setIsFormSubmit(true);
    try {
      const payload = appendToFormData(formData);
      if (documentFiles[0]?.file) payload.append("document", documentFiles[0].file);
      if (supportingDocumentFiles[0]?.file) payload.append("supportingDocument", supportingDocumentFiles[0].file);

      const response = await axios.post(waterAddExistingConsumerApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status) {
        toast.success(response?.data?.message);        
        setSubmitResponse(response.data?.data);
        setModalOpen(true);
      } else {
        setValidationError(response?.data?.errors || {});
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }finally {
        setIsFormSubmit(false);
    }
  };

  // Field configurations
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
      isDisabled: true,
      options: connectionTypeList.map((item) => ({ label: item.connectionType, value: item.id })),
    },
    {
      name: "connectionThroughId",
      label: "Connection Through",
      type: "select",
      error: validationError?.connectionThroughId || "",
      value: formData.connectionThroughId || "",
      required: true,
      options: connectionThrowList.map((item) => ({ label: item.connectionThrough, value: item.id })),
    },
    {
      name: "propertyTypeId",
      label: "Property Type",
      type: "select",
      error: validationError?.propertyTypeId || "",
      value: formData.propertyTypeId || "",
      required: true,
      options: propertyTypeList.map((item) => ({ label: item.propertyType, value: item.id })),
    },
    {
      name: "category",
      label: "Category Type",
      type: "select",
      error: validationError?.category || "",
      value: formData.category || "",
      required: true,
      isDisabled: ![1, 2].includes(parseInt(formData.propertyTypeId, 10)),
      options: categoryTypeList.map((item) => ({ label: item, value: item })),
    },
    {
      name: "holdingNo",
      label: "Holding No",
      type: "text",
      error: validationError?.holdingNo || "",
      value: formData.holdingNo || "",
      required: Number(formData.connectionThroughId) === 1,
      isHidden: Number(formData.connectionThroughId) !== 1,
      placeholder: "Enter Holding No",
      onBlur: (e) => validateHoldingNo(e.target.value),
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
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
      required: true,
      placeholder: "Enter Landmark",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
    },
    {
      name: "pinCode",
      label: "Pin Code",
      type: "text",
      error: validationError?.pinCode || "",
      value: formData.pinCode || "",
      maxLength: 6,
      required: true,
      placeholder: "Enter Pin",
      charRegex: /^[0-9]$/,
      regex: /^[1-9][0-9]{0,5}$/,
    },
    {
      name: "address",
      label: "Address",
      type: "textarea",
      error: validationError?.address || "",
      value: formData.address || "",
      minLength: 5,
      required: true,
      placeholder: "Enter Full Address",      
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
    },
  ];

  const connectionFields = [
    {
      name: "noOfRoom",
      label: [3, 4].includes(Number(formData?.propertyTypeId))
        ? Number(formData?.propertyTypeId) === 3 ? "No Of Room" : "No Of Tables"
        : "No Of Connection",
      type: "number",
      min: 1,
      error: validationError?.noOfRoom || "",
      value: formData?.noOfRoom || "",
      required: true,
      readOnly: ![3, 4].includes(Number(formData?.propertyTypeId)),
    },
    {
      name: "meterTypeId",
      label: "Type of Connection",
      type: "select",
      error: validationError?.meterTypeId || "",
      value: formData?.meterTypeId || "",
      required: true,
      options: meterTypeList?.map((item) => ({ label: item.meterType, value: item.id })),
    },
    ...(Number(formData?.meterTypeId) === 1
      ? [
          {
            name: "isMeterWorking",
            label: "Is Meter Working",
            type: "radio",
            error: validationError?.isMeterWorking || "",
            value: formData?.isMeterWorking,
            required: true,
            options: [
              { label: "Meter Working", value: 1 },
              { label: "Meter Not Working", value: 0 },
            ],
          },
        ]
      : []),
    ...(Number(formData?.meterTypeId) === 1 && Number(formData?.isMeterWorking) === 0
      ? [
          {
            name: "fixRate",
            label: "Rate Per Month",
            type: "number",
            error: validationError?.fixRate || "",
            value: formData?.fixRate || "",
            required: true,
          },
        ]
      : []),
    {
      name: "meterNo",
      label: "Meter No.",
      type: "text",
      error: validationError?.meterNo || "",
      value: formData?.meterNo || "",
      required: Number(formData?.meterTypeId) === 1,
      isHidden: Number(formData?.meterTypeId) !== 1,
      placeholder: "Enter Meter No",
    },
    {
      name: "connectionDate",
      label: "Connection Date",
      type: "date",
      error: validationError?.connectionDate || "",
      value: formData?.connectionDate || "",
      required: true,
    },
    {
      name: "initialReading",
      label: "Initial Reading",
      type: "number",
      error: validationError?.initialReading || "",
      value: formData?.initialReading || "",
      required: Number(formData?.meterTypeId) === 1,
      isHidden: Number(formData?.meterTypeId) !== 1,
    },
  ];

  const arrearTaxFields = [
    {
      name: "demandFrom",
      label: "Demand From",
      type: "date",
      error: validationError?.demandFrom || "",
      value: formData?.demandFrom || "",
      required: false,
    },
    {
      name: "arrearAmount",
      label: "Arrear Amount",
      type: "number",
      min: 0,
      error: validationError?.arrearAmount || "",
      value: formData?.arrearAmount || "",
      required: false,
    },
  ];

  const applicantColumns = ["Owner Name", "Guardian Name", "Mobile No.", "Action"];
  
  const applicantRenderers = {
    "Owner Name": (_, row, index) => (
      <>
        <input
          type="text"
          value={row.ownerName}
          {...getValidationHandlers("ownerName")}
          onChange={(e) => handleApplicantChange(row.id, "ownerName", e.target.value)}
          placeholder="Owner Name"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError?.[`ownerDtl.${index}.ownerName`] ? "border-red-500" : ""
          }`}
        />
        {validationError?.[`ownerDtl.${index}.ownerName`] && (
          <div className="mt-1 text-red-600 text-xs">{validationError[`ownerDtl.${index}.ownerName`]}</div>
        )}
      </>
    ),
    "Guardian Name": (_, row, index) => (
      <>
        <input
          type="text"
          value={row.guardianName}
          {...getValidationHandlers("guardianName")}
          onChange={(e) => handleApplicantChange(row.id, "guardianName", e.target.value)}
          placeholder="Guardian Name"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError?.[`ownerDtl.${index}.guardianName`] ? "border-red-500" : ""
          }`}
        />
        {validationError?.[`ownerDtl.${index}.guardianName`] && (
          <div className="mt-1 text-red-600 text-xs">{validationError[`ownerDtl.${index}.guardianName`]}</div>
        )}
      </>
    ),
    "Mobile No.": (_, row, index) => (
      <>
        <input
          type="text"
          value={row.mobileNo}
          {...getValidationHandlers("mobileNo")}
          onChange={(e) => handleApplicantChange(row.id, "mobileNo", e.target.value)}
          placeholder="Mobile No."
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError?.[`ownerDtl.${index}.mobileNo`] ? "border-red-500" : ""
          }`}
        />
        {validationError?.[`ownerDtl.${index}.mobileNo`] && (
          <div className="mt-1 text-red-600 text-xs">{validationError[`ownerDtl.${index}.mobileNo`]}</div>
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

  const handleCopyConsumerNo = () => {
    const consumerNo = submitResponse?.consumerNo;
    if (!consumerNo) return;

    navigator.clipboard.writeText(consumerNo);
    setCopied(true);
    toast.success("Consumer No. copied to clipboard!");

    // Reset checkmark icon after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  if (isModalOpen) {
    return (
      <div className="flex flex-col gap-6 text-gray-700 text-lg">
        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title="Application Submitted"
          message={
            <>
              Your application has been successfully received. <br />
              <span className="inline-flex items-center gap-2 mt-2">
                <strong>Consumer No: {submitResponse?.consumerNo}</strong>
                <button
                  type="button"
                  onClick={handleCopyConsumerNo}
                  title="Copy Consumer No"
                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                >
                  {copied ? (
                    <FaCheck className="text-green-600 text-base" />
                  ) : (
                    <FaCopy className="text-base" />
                  )}
                </button>
              </span>
            </>
          }
          buttonText="OK"
          onConfirm={() => {
            setModalOpen(false);
            setFormData(INITIAL_FORM_STATE);
            setSupportingDocumentFiles([]);
            setDocumentFiles([]);
            navigate("/water/consumer/add-existing");
          }}
          showSecondaryButton
          secondaryButtonText="View Details"
          onSecondaryAction={() => {
            setModalOpen(false);
            navigate(`/water/consumer/detail/${submitResponse?.consumerId}`);
          }}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-gray-700 text-lg">
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

      <FormCard title="Add Existing Connection" formFields={formFields1} onChange={handleChange} />
      <FormCard title="Applicant Property Details" formFields={addressFields} onChange={handleChange} />
      
      <DetailsTable
        title="Applicant Details"
        columns={applicantColumns}
        data={formData.ownerDtl}
        renderers={applicantRenderers}
      />

      <FormCard title="Connection Details" formFields={connectionFields} onChange={handleChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow p-4 border-t-4 border-blue-500 rounded-lg">
          <label className="block mb-1 font-medium text-gray-700 text-sm">
            Connection Declaration <span className="text-red-500">*</span>
          </label>
          <FileUpload
            name="document"
            files={documentFiles}
            setFiles={setDocumentFiles}
            allowMultiple={false}
            required={true}
            acceptedFileTypes={[".pdf", ".png", ".jpg", ".jpeg"]}
            maxFileSize="2MB"
            error={validationError?.document}
          />
        </div>

        <div className="bg-white shadow p-4 border-t-4 border-blue-500 rounded-lg">
          <label className="block mb-1 font-medium text-gray-700 text-sm">
            Supporting Document <span className="text-red-500">*</span>
          </label>
          <FileUpload
            name="supportingDocument"
            files={supportingDocumentFiles}
            setFiles={setSupportingDocumentFiles}
            allowMultiple={false}
            required={true}
            acceptedFileTypes={[".pdf"]}
            maxFileSize="10MB"
            error={validationError?.supportingDocument}
          />
        </div>
      </div>

      <FormCard title="Arrear Tax" formFields={arrearTaxFields} onChange={handleChange} />

      {/* <div className="flex justify-center items-center">
        <button type="submit" className="items-center rounded-full text-white leading-4 btn-primary">
          Submit
        </button>
      </div> */}
        <div className="flex justify-center items-center">
          {isFormSubmit ? (
              <button
                  type="button"
                  className="rounded-full text-white px-6 py-2 bg-gray-500 hover:bg-gray-700"
              >
                  Loading....
              </button>
          ) : (
              <button
                  type="submit"
                  className="rounded-full text-white px-6 py-2 bg-blue-600 hover:bg-blue-700"
              >
                  Submit
              </button>

          )}
      </div>
    </form>
  );
}