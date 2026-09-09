import { useEffect, useState } from "react";
import FormCard from "../../../components/common/FormCard";
// "../../../common/FormCard";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  getNewWardByOldWardApi,
  getTradeMstrDataApi,
  getTradeTaxDetailsApi,
  testTradePayloadApi,
  tradeApplicationDetailsApi,
  validateHoldingNoApi,
} from "../../../api/endpoints";
import toast from "react-hot-toast";
import { getToken, getWithExpiry, setWithExpiry } from "../../../utils/auth";
import { toastMsg } from "../../../utils/utils";
import DetailsTable from "../../../components/common/DetailsTable";
import { FaPlus, FaTrash } from "react-icons/fa";
import AdminLayout from "../../../layout/AdminLayout";

export default function ApplicationForm({ applicationType = "NEW LICENSE" , mstrData, formDetails }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = getToken();
  const { id } = useParams();
  const fromPriv = location.state?.fromPriv;
  // console.log("fromPriv",fromPriv);

  const [applicantCounter, setApplicantCounter] = useState(2);
  const [newWardList, setNewWardList] = useState([]);
  const [newWardLoading, setNewWardLoading] = useState(false);
  const [masterData, setMasterData] = useState(null);
  const [validationError, setValidationError] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(() => {
    const savedData = fromPriv ? getWithExpiry("tradeConnectionFormData"):null;
    if (savedData) {      
      const indexedOwners = Array.isArray(savedData.ownerDtl)
        ? savedData.ownerDtl.map((o, idx) => ({ ...o, index: idx + 1 }))
        : savedData.ownerDtl;
      if (indexedOwners?.length > 0)
        setApplicantCounter(indexedOwners.length + 1);

      return { ...savedData, ownerDtl: indexedOwners };
    }

    const initialData = (formDetails && JSON.parse(formDetails)) || {
      applicationType: applicationType ? applicationType : "NEW LICENSE",
      firmTypeId: "",
      ownershipTypeId: "",
      holdingNo: "",
      wardMstrId: "",
      newWardMstrId: "",
      areaInSqft: "",
      firmName: "",
      firmEstablishmentDate: "",
      address: "",
      landmark: "",
      pinCode: "",
      premisesOwnerName: "",
      firmDescription: "",
      natureOfBusiness: [],
      licenseForYears: 1,
      isTobaccoLicense:false,
      ownerDtl: [
        {
          index: 1,
          ownerName: "",
          guardianName: "",
          mobileNo: "",
          email: "",
        },
      ],
    };
    
    return initialData;
  });

  useEffect(() => {
    if (formDetails) {
      try {
        const parsedDetails = JSON.parse(formDetails);
        setFormData((prev) => ({ ...prev, ...parsedDetails }));
        
      } catch (e) {
        console.error("Invalid formDetails JSON:", e);
      }
    }

    const savedNewWardList = getWithExpiry("tradeNewWardList");
    if (savedNewWardList) {
      setNewWardList(savedNewWardList);
    }

    const savedMasterData = getWithExpiry("tradeMasterData");
    if (savedMasterData) {
      setMasterData(savedMasterData);
    } else {
      const getMasterData = async () => {
        try {
          let data = null;
          if (mstrData) {
            data = JSON.parse(mstrData);
          } else {
            const response = await axios.post(
              getTradeMstrDataApi,{},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response?.data?.status) data = response?.data?.data;
          }
          if (data) {
            setMasterData(data);
            setWithExpiry("tradeMasterData", data, 15);
          }
        } catch (error) {
          console.error("Error fetching master data:", error);
        }
      };
      if (token) getMasterData();
    }
    if (id &&  ["RENEWAL", "SURRENDER","AMENDMENT"].includes(applicationType) && token && !formData?.priviesLicenseId) {
      fetchLicenseDetails();
    }
  }, [formDetails, mstrData, token, id, applicationType]);

  useEffect(() => {
    if (formData.wardMstrId) {
      fetchNewWard(formData.wardMstrId);
    }
  }, [formData.wardMstrId, token]);

  useEffect(() => {
    if (
      formData.areaInSqft &&
      formData.firmEstablishmentDate &&
      formData.licenseForYears &&
      formData.natureOfBusiness.length>0 &&
      token
    ) {
      fetchTaxDetails();
    }
  }, [
    formData.areaInSqft,
    formData.firmEstablishmentDate,
    formData.licenseForYears,
    formData.applicationType,
    formData.natureOfBusiness,
    token,
  ]);

  const fetchNewWard = async (oldWardId) => {
    if (!oldWardId) {
      setNewWardList([]);
      setFormData((prev) => ({ ...prev, newWardMstrId: "" }));
      return;
    }
    try {
      setNewWardLoading(true);
      const response = await axios.post(
        getNewWardByOldWardApi,
        { oldWardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const newWards = response?.data?.data || [];
        setNewWardList(newWards);
        setWithExpiry("tradeNewWardList", newWards, 15);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setNewWardLoading(false);
    }
  };

  const handleValidateHoldingNo = async (holdingNo) => {
    if (!holdingNo) {
      return;
    }
    try {
      const response = await axios.post(
        validateHoldingNoApi,
        { holdingNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        if (!["RENEWAL", "SURRENDER","AMENDMENT"].includes(formData.applicationType)) {
          setFormData((prev) => ({
            ...prev,
            wardMstrId: data?.wardMstrId?.toString() ?? "",
            newWardMstrId: data?.newWardMstrId?.toString() ?? "",
            ownerDtl: Array.isArray(data?.owners)
              ? data.owners.map((o, idx) => ({ ...o, index: idx + 1 }))
              : prev.ownerDtl,
          }));
          setApplicantCounter(data?.owners?.length + 1 || 2);
        }
        setFormData((prev) => ({
          ...prev,
          premisesOwnerName: data?.owners?.[0]["ownerName"],
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

  const fetchLicenseDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        tradeApplicationDetailsApi,
        { id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === true) {
        const d = response.data.data;
        const mapped = {
          priviesLicenseId:d?.id,
          applicationType: applicationType,
          firmTypeId: d.firmTypeId?.toString() ?? "",
          ownershipTypeId: d.ownershipTypeId?.toString() ?? "",
          wardMstrId: d.wardMstrId?.toString() ?? "",
          newWardMstrId: d.newWardMstrId?.toString() ?? "",
          firmName: d.firmName ?? "",
          firmDescription: d.firmDescription ?? "",
          firmEstablishmentDate: d.firmEstablishmentDate ?? "",
          premisesOwnerName: d.premisesOwnerName ?? "",
          areaInSqft: d.areaInSqft ?? "",
          address: d.address ?? "",
          pinCode: d.pinCode ?? "",
          licenseForYears: d.licenseForYears?.toString() ?? "1",
          isTobaccoLicense: d.isTobaccoLicense ? 1 : 0,
          holdingNo: d.newHoldingNo ?? "",
          natureOfBusiness: d?.tradeItem?.map((item)=>({tradeItemTypeId:item?.id})),
          ownerDtl: Array.isArray(d.owners)
            ? d.owners.map((o, idx) => ({
                index: idx + 1,
                ownerName: o.ownerName ?? "",
                guardianName: o.guardianName ?? "",
                mobileNo: o.mobileNo ?? "",
                email: o.email ?? "",
              }))
            : [],
          taxDetails: d.taxDetails ?? {},
        };
        
        setFormData((prev) => ({ ...prev, ...mapped }));
        if (mapped.paymentMode) setPaymentMode(mapped.paymentMode);
      } else {
        toast.error("Error fetching application details.");
      }
    } catch (error) {
      console.error("Error fetching license details:", error);
    }
    setIsLoading(false);
  };

  const fetchTaxDetails = async () => {
    try {
      const payload = {
        applicationType: formData.applicationType,
        firmEstablishmentDate: formData.firmEstablishmentDate,
        areaInSqft: formData.areaInSqft,
        licenseForYears: formData.licenseForYears,
        natureOfBusiness:formData?.natureOfBusiness,
        isTobaccoLicense: 0,
      };
      if (["RENEWAL", "SURRENDER","AMENDMENT"].includes(formData.applicationType)) {
        payload["priviesLicenseId"] = id;
      }

      const response = await axios.post(getTradeTaxDetailsApi, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status == false && response.data.errors) {
        const errorMessages = Object.values(response.data.errors).flat().join(" ");
        toast.error(errorMessages, { duration: 10000 });
        return;
      }

      setFormData((prev) => ({ ...prev, taxDetails: response.data.data }));
    } catch (error) {
      console.error("Error fetching tax details:", error);
      toast.error("An error occurred while fetching tax details.", {
        duration: 10000,
      });
    }
  };

  const handleApplicantChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((a) =>
        a.index === index ? { ...a, [field]: value } : a
      ),
    }));
  };

  const handleAddApplicant = () => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [
        ...prev.ownerDtl,
        {
          index: applicantCounter,
          ownerName: "",
          guardianName: "",
          mobileNo: "",
          email: "",
        },
      ],
    }));
    setApplicantCounter((prev) => prev + 1);
  };

  const handleRemoveApplicant = (index) => {
    setFormData((prev) =>
      prev.ownerDtl.length > 1
        ? { ...prev, ownerDtl: prev.ownerDtl.filter((a) => a.index !== index) }
        : prev
    );
  };

  const handleChange = (name, value) => {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
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

  function filterBySelected(originalList, selected) {
    if (!originalList || !selected) return [];
    const selectedIds = selected.map((s) => s.tradeItemTypeId?.toString()).filter(Boolean);
    return originalList
      .filter((o) => selectedIds.includes(o.id.toString()))
      .map((o) => o.tradeItem);
  }

  const handleNatureOfBusinessChange = (name,value) => {
    // console.log("value",value)
    const selectedItems = value.map((id) => ({
      tradeItemTypeId: id.toString(),
    }));
    setFormData((prev) => ({ ...prev, [name]: selectedItems }));
  };

  const handlePaymentChange = (name, value) => {
    if (name === "paymentMode") {
      setPaymentMode(value);
    }
    handleChange(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {      
      const newData = {
        ...formData,
        url: location.pathname
      };

      setFormData(newData);

      const payload = { ...formData };

      const response = await axios.post(testTradePayloadApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.status) {
        toastMsg("Form submitted successfully!", "success");
        setWithExpiry("tradeConnectionFormData", newData, 15);
        setWithExpiry("tradeMasterData", masterData, 15);
        setWithExpiry("tradeNewWardList", newWardList, 15);
        navigate("/trade/application-preview");
      } else {
        console.error("API Validation Errors:", response?.data?.errors);
        setValidationError(response?.data?.errors);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error submitting form. Please check the console for details.");
    }finally{
      setIsLoading(false);
    }
  };

  const isReadOnly = ["RENEWAL", "SURRENDER","AMENDMENT"].includes(formData.applicationType);

  const formFields1 = [
    {
      label: "Application Type",
      name: "applicationType",
      type: "text",
      error: validationError?.applicationType || "",
      value: formData.applicationType || "",
      required: true,
      isDisabled: true,
    },
    {
      label: "Firm Type",
      name: "firmTypeId",
      type: "select",
      error: validationError?.firmTypeId || "",
      value: formData.firmTypeId || "",
      required: true,
      isDisabled: isReadOnly,
      options: masterData?.firmType?.map((item) => ({
        label: item.firmType,
        value: item.id,
      })),
    },
    {
      label: "Type of Ownership of Business Premises",
      name: "ownershipTypeId",
      type: "select",
      error: validationError?.ownershipTypeId || "",
      value: formData.ownershipTypeId || "",
      required: true,
      isDisabled: isReadOnly,
      options: masterData?.ownershipType?.map((item) => ({
        label: item.ownershipType,
        value: item.id,
      })),
    },
  ];

  const propertyDetails = [
    {
      name: "holdingNo",
      label: "Holding No",
      type: "text",
      error: validationError?.holdingNo || "",
      value: formData.holdingNo || "",
      required: isReadOnly,
      placeholder: "Enter Holding No",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
      onBlur: (e) => handleValidateHoldingNo(e.target.value),
      
    },
    {
      label: "Ward No.",
      name: "wardMstrId",
      type: "select",
      error: validationError?.wardMstrId || "",
      value: formData.wardMstrId || "",
      required: true,
      isDisabled: isReadOnly,
      options: masterData?.wardList?.map((item) => ({
        label: item.wardNo,
        value: item.id,
      })),
    },
    
    {
      label: "Total Area (in Sq. Ft)",
      name: "areaInSqft",
      type: "number",
      error: validationError?.areaInSqft || "",
      value: formData.areaInSqft || "",
      charRegex: /^[0-9.]$/,
      regex: /^\d*(\.\d{0,2})?$/,
      required: true,
      isDisabled: isReadOnly,
      placeholder: "Enter Total Area in Sqft",
    },
    {
      label: "Firm Name",
      name: "firmName",
      type: "text",
      error: validationError?.firmName || "",
      value: formData.firmName || "",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
      required: true,
      isDisabled: isReadOnly,
      placeholder: "Firm Name",
    },
    {
      name: "firmEstablishmentDate",
      label: "Firm Establishment Date",
      type: "date",
      error: validationError?.firmEstablishmentDate || "",
      value: formData.firmEstablishmentDate || "",
      required: true,
      isDisabled: isReadOnly,
      placeholder: "Enter Firm Establishment Date",
    },
    {
      name: "address",
      label: "Business Address",
      type: "text",
      value: formData.address,
      error: validationError?.address || "",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
      required: true,
      isDisabled: isReadOnly,
    },
    {
      name: "landmark",
      label: "Landmark",
      type: "text",
      value: formData.landmark,
      error: validationError?.landmark || "",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
      isDisabled: isReadOnly,
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
      isDisabled: isReadOnly,
    },
    {
      name: "premisesOwnerName",
      label: "Owner of Business Premises",
      type: "text",
      error: validationError?.premisesOwnerName || "",
      value: formData.premisesOwnerName,
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
      required: true,
      isDisabled: isReadOnly,
    },
    {
      name: "firmDescription",
      label: "Business Description",
      type: "text",
      error: validationError?.firmDescription || "",
      value: formData.firmDescription,
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
      required: true,
      isDisabled: isReadOnly,
    },
  ];

  const natureOfBusinessField = {
    name: "natureOfBusiness",
    label: "Nature of Business",
    type: "select",
    isMulti: true,
    options: masterData?.itemType,
    optionLabelKey: "tradeItem",
    optionValueKey: "id",
    value: formData.natureOfBusiness?.map((n) => {
      return n?.tradeItemTypeId || [];
    }),
    colSpan: 4,
    maxSelection: 3,
    selectedList: filterBySelected(
      masterData?.itemType,
      formData?.natureOfBusiness
    ),    
    required:true,
    isDisabled: isReadOnly,
  };

  const paymentFields = [
    {
      label: "License For Years",
      name: "licenseForYears",
      type: "select",
      required: true,
      options: [
        { label: "1 Year", value: 1 },
        { label: "2 Years", value: 2 },
        { label: "3 Years", value: 3 },
        { label: "4 Years", value: 4 },
        { label: "5 Years", value: 5 },
        { label: "6 Years", value: 6 },
        { label: "7 Years", value: 7 },
        { label: "8 Years", value: 8 },
        { label: "9 Years", value: 9 },
        { label: "10 Years", value: 10 },
      ],
    },
    {
      label: "Charge Applied",
      name: "licenseCharge",
      type: "text",
      isDisabled: true,
    },
    {
      label: "Arrears",
      name: "arrearCharge",
      type: "text",
      isDisabled: true,
    },
    {
      label: "Current Charge",
      name: "currentCharge",
      type: "text",
      isDisabled: true,
    },
    {
      label: "Penalty",
      name: "latePenalty",
      type: "text",
      isDisabled: true,
    },
    {
      label: "Total Charge",
      name: "totalCharge",
      type: "text",
      isDisabled: true,
    },
  ];

  const regexRules = {
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
    email: {
      charRegex: /^[A-Za-z0-9@._-]$/,
      regex: /^[A-Za-z0-9@._-]*$/,
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
    "Email ID",
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
            handleApplicantChange(row.index, "ownerName", e.target.value)
          }
          placeholder="Owner Name"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.ownerName`]
              ? "border-red-500"
              : ""
          }`}
          disabled={isReadOnly}
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
            handleApplicantChange(row.index, "guardianName", e.target.value)
          }
          placeholder="Guardian Name"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.guardianName`]
              ? "border-red-500"
              : ""
          }`}
          disabled={isReadOnly}
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
            handleApplicantChange(row.index, "mobileNo", e.target.value)
          }
          placeholder="Mobile No."
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.mobileNo`]
              ? "border-red-500"
              : ""
          }`}
          charRegex="/^[0-9]$/"
          regex="/^[1-9][0-9]{0,9}$/"
          maxLength="10"
          disabled={isReadOnly}
        />
        {validationError && validationError[`ownerDtl.${index}.mobileNo`] && (
          <div className="mt-1 text-red-600 text-xs">
            {validationError[`ownerDtl.${index}.mobileNo`]}
          </div>
        )}
      </>
    ),
    "Email ID": (_, row, index) => (
      <>
        <input
          type="email"
          value={row.email}
          {...getValidationHandlers("email")}
          onChange={(e) =>
            handleApplicantChange(row.index, "email", e.target.value)
          }
          placeholder="Email ID"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.email`]
              ? "border-red-500"
              : ""
          }`}
          disabled={isReadOnly}
        />
        {validationError && validationError[`ownerDtl.${index}.email`] && (
          <div className="mt-1 text-red-600 text-xs">
            {validationError[`ownerDtl.${index}.email`]}
          </div>
        )}
      </>
    ),
    Action: (_, row, idx) => (
      <div className="flex justify-center gap-2">
        {!isReadOnly && formData.ownerDtl.length > 1 && (
          <button
            onClick={() => handleRemoveApplicant(row.index)}
            className="bg-red-600 hover:bg-red-700 p-2 rounded text-white"
            title="Delete"
            type="button"
          >
            <FaTrash />
          </button>
        )}
        {!isReadOnly && idx === formData.ownerDtl.length - 1 && (
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
// console.log("formData",formData);
  return (
  <>
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
          title={`Apply License (${formData?.applicationType})`}
          formFields={formFields1}
          onChange={handleChange}
        />
        <FormCard
          title="Property Details"
          formFields={propertyDetails}
          onChange={handleChange}
        />
        <DetailsTable
          title="Applicant Details"
          columns={applicantColumns}
          data={formData.ownerDtl}
          renderers={applicantRenderers}
        />

        <FormCard
          title="Nature Of Business"
          formFields={[
            {
              ...natureOfBusinessField,
              error: validationError[natureOfBusinessField.name],
              value: natureOfBusinessField.value,
              // onChange: handleNatureOfBusinessChange, 
            },
          ]}
          onChange={handleNatureOfBusinessChange}

        />

        <FormCard
          title="Licence Required for the Year and Payment"
          formFields={[
            ...paymentFields,
          ].map((f) => ({
            ...f,
            value:
              f.name === "licenseForYears"
                ? formData[f.name]?.toString() || "1"
                : formData.taxDetails?.[f.name] || "",
            error: validationError[f.name],
          }))}
          onChange={handlePaymentChange}
        />

        <div className="flex justify-center items-center">
          <button
            type="submit"
            className="items-center rounded-full text-white leading-4 btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
  </>
  );
}