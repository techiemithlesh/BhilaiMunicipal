import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaPlus, FaTrash } from "react-icons/fa";
import axios from "axios";
import {
  getNewWardByOldWardApi,
  waterGetMasterDataApi,
  waterAppEditApi,
  validateHoldingNoApi,
  validateSafNoApi,
} from "../../../api/endpoints";
import { getWithExpiry, setWithExpiry } from "../../../utils/auth";
import FormCard from "../../../components/common/FormCard";
import DetailsTable from "../../../components/common/DetailsTable";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@nextui-org/react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

function EditApplication({ mstrData, fetchApi }) {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [applicantCounter, setApplicantCounter] = useState(2);
  const [wardList, setWardList] = useState([]);
  const [newWardList, setNewWardList] = useState([]);
  const [newWardLoading, setNewWardLoading] = useState(false);
  const [ownershipTypeList, setOwnershipTypeList] = useState([]);
  const [propertyTypeList, setPropertyTypeList] = useState([]);
  const [connectionTypeList, setConnectionTypeList] = useState([]);
  const [connectionThrowList, setConnectionThrowList] = useState([]);
  const [pipelineTypeList, setPipelineTypeList] = useState([]);
  const [categoryTypeList, setCategoryTypeList] = useState([]);
  const [masterData, setMasterData] = useState(null);
  const [validationError, setValidationError] = useState({});
  const token = useSelector((state) => state.citizenAuth.token);
  const navigate = useNavigate();

  useEffect(() => {
    // Load from session storage
    const savedNewWardList = getWithExpiry("waterNewWardList");
    if (savedNewWardList) {
      setNewWardList(savedNewWardList);
    }

    const savedMasterData = getWithExpiry("waterMasterData");
    if (savedMasterData) {
      setMasterData(savedMasterData);
      setWardList(savedMasterData?.wardList || []);
      setOwnershipTypeList(savedMasterData?.ownershipType || []);
      setPropertyTypeList(savedMasterData?.propertyType || []);
      setConnectionTypeList(savedMasterData?.connectionType || []);
      setConnectionThrowList(savedMasterData?.connectionThrow || []);
      setPipelineTypeList(savedMasterData?.pipelineType || []);
      setCategoryTypeList(savedMasterData?.categoryType || []);
    } else {
      // Fetch fresh master data if not in session
      const getMasterData = async () => {
        try {
          let data = null;
          if (mstrData) {
            data = JSON.parse(mstrData);
          } else {
            const response = await axios.post(
              waterGetMasterDataApi,
              { ulbId: ulbId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response?.data?.status) data = response?.data?.data;
          }
          if (data) {
            setMasterData(data);
            setWardList(data?.wardList || []);
            setOwnershipTypeList(data?.ownershipType || []);
            setPropertyTypeList(data?.propertyType || []);
            setConnectionTypeList(data?.connectionType || []);
            setConnectionThrowList(data?.connectionThrow || []);
            setPipelineTypeList(data?.pipelineType || []);
            setCategoryTypeList(data?.categoryType || []);
            setWithExpiry("waterMasterData", data, 15);
          }
        } catch (error) {
          console.error("Error fetching master data:", error);
        }
      };
      if (token) getMasterData();
    }
  }, [mstrData, token]);

  useEffect(() => {
    if (token) {
      fetchAppData();
    }
  }, [token]);

  const fetchAppData = async () => {
    try {
      setIsFrozen(true);
      const response = await axios.post(
        fetchApi,
        { id, ulbId: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const updated = {
          ...response?.data?.data,
          holdingNo: response?.data?.data?.newHoldingNo,
          ownerDtl: response?.data?.data?.owners?.map((owner, index) => ({
            ...owner,
            indexId: index + 1, // or index + 1 if you want 1-based
          })),
        };
        setFormData(updated);
        fetchNewWard(updated?.wardMstrId);
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setIsFrozen(false);
    }
  };

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
        { oldWardId, ulbId: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const newWards = response?.data?.data || [];
        setNewWardList(newWards);
        setWithExpiry("waterNewWardList", newWards, 15);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setNewWardLoading(false);
    }
  };

  const validateHoldingNo = async (holdingNo) => {
    if (!holdingNo) {
      return;
    }
    try {
      const response = await axios.post(
        validateHoldingNoApi,
        { holdingNo, ulbId: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setFormData((prev) => ({
          ...prev,
          safNo: "",
          wardMstrId: data?.wardMstrId,
          newWardMstrId: data?.newWardMstrId,
        }));
        fetchNewWard(data?.wardMstrId);
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
    if (!safNo) {
      return;
    }
    try {
      const response = await axios.post(
        validateSafNoApi,
        { safNo, ulbId: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setFormData((prev) => ({
          ...prev,
          holdingNo: "",
          wardMstrId: data?.wardMstrId,
          newWardMstrId: data?.newWardMstrId,
        }));
        fetchNewWard(data?.wardMstrId);
      } else {
        setValidationError((prev) => ({ ...prev, safNo: ["Invalid SAF No"] }));
        setFormData((prev) => ({ ...prev, safNo: "" }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddApplicant = () => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [
        ...prev.ownerDtl,
        {
          indexId: applicantCounter,
          ownerName: "",
          guardianName: "",
          dob: "",
          mobileNo: "",
          email: "",
        },
      ],
    }));
    setApplicantCounter((prev) => prev + 1);
  };

  const handleRemoveApplicant = (id) => {
    setFormData((prev) =>
      prev.ownerDtl.length > 1
        ? { ...prev, ownerDtl: prev.ownerDtl.filter((a) => a.indexId !== id) }
        : prev
    );
  };

  const handleChange = (name, value) => {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "propertyTypeId" && value != 1) {
        updated = { ...updated, category: "APL", pipelineTypeId: 1 };
      }
      return updated;
    });
    // Clear the specific validation error when the field changes
    if (validationError && validationError[name]) {
      setValidationError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, ulbId: ulbId };
      console.log("payload", payload);
      const response = await axios.post(waterAppEditApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data?.status) {
        setWithExpiry("waterMasterData", masterData, 15);
        setWithExpiry("waterNewWardList", newWardList, 15);
        toast.success("Application updated successfully!", { duration: 5000 });
        navigate("/citizen/application");
      } else {
        // Toast all error messages
        const apiErrors = response.data?.errors || {};
        Object.values(apiErrors)
          .flat()
          .forEach((msg) => {
            toast.error(msg, { duration: 10000 });
          });
        setValidationError(apiErrors);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // ================== FORM FIELDS ==================
  const formFields1 = [
    {
      name: "connectionTypeId",
      label: "Type of Connection",
      type: "select",
      error: validationError?.connectionTypeId || "",
      value: formData?.connectionTypeId || "",
      required: true,
      isDisabled: formData?.paymentStatus,
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
      value: formData?.connectionThroughId || "",
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
      value: formData?.propertyTypeId || "",
      required: true,
      isDisabled: formData?.paymentStatus,
      options: propertyTypeList.map((item) => ({
        label: item.propertyType,
        value: item.id,
      })),
    },
    {
      name: "ownershipTypeId",
      label: "Owner Type",
      type: "select",
      error: validationError?.ownershipTypeId || "",
      value: formData?.ownershipTypeId || "",
      required: true,
      options: ownershipTypeList.map((item) => ({
        label: item.ownershipType,
        value: item.id,
      })),
    },
    {
      name: "category",
      label: "Category Type",
      type: "select",
      error: validationError?.category || "",
      value: formData?.category || "",
      required: true,
      isDisabled: formData?.propertyTypeId != 1 || formData?.paymentStatus,
      options: categoryTypeList.map((item) => ({ label: item, value: item })),
    },
    {
      name: "pipelineTypeId",
      label: "Pipeline Type",
      type: "select",
      error: validationError?.pipelineTypeId || "",
      value: formData?.pipelineTypeId || "",
      required: true,
      isDisabled: formData?.propertyTypeId != 1 || formData?.paymentStatus,
      options: pipelineTypeList.map((item) => ({
        label: item.pipelineType,
        value: item.id,
      })),
    },
    {
      name: "holdingNo",
      label: "Holding No",
      type: "text",
      error: validationError?.holdingNo || "",
      value: formData?.holdingNo || "",
      required: formData?.connectionThroughId == 1,
      isHidden: formData?.connectionThroughId != 1,
      placeholder: "Enter Holding No",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
      onBlur: (e) => validateHoldingNo(e.target.value),
    },
    {
      name: "safNo",
      label: "SAF No",
      type: "text",
      error: validationError?.safNo || "",
      value: formData?.safNo || "",
      required: formData?.connectionThroughId == 2,
      isHidden: formData?.connectionThroughId != 2,
      placeholder: "Enter SAF No",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
      onBlur: (e) => validateSafNo(e.target.value),
    },
  ];

  const addressFields = [
    {
      name: "wardMstrId",
      label: "Ward No.",
      type: "select",
      error: validationError?.wardMstrId || "",
      value: formData?.wardMstrId || "",
      required: true,
      subOnChange: fetchNewWard,
      options: wardList.map((item) => ({ label: item.wardNo, value: item.id })),
    },
    {
      name: "areaSqft",
      label: "Total Area (in Sq. Ft)",
      type: "number",
      error: validationError?.areaSqft || "",
      value: formData?.areaSqft || "",
      charRegex: /^[0-9.]$/,
      regex: /^\d*(\.\d{0,2})?$/,
      required: true,
      isDisabled: formData?.paymentStatus,
      placeholder: "Enter Total Area in Sqft",
    },
    {
      name: "landmark",
      label: "Landmark",
      type: "text",
      error: validationError?.landmark || "",
      value: formData?.landmark || "",
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
      value: formData?.pinCode || "",
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
      value: formData?.address || "",
      charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
      minLength: 5,
      required: true,
      placeholder: "Enter Full Address",
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

  // To handle changes in applicant details table
  const handleApplicantChange = (id, fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((applicant) =>
        applicant.indexId === id
          ? { ...applicant, [fieldName]: value }
          : applicant
      ),
    }));
  };

  const applicantColumns = [
    "Owner Name",
    "Guardian Name",
    "DOB",
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
            handleApplicantChange(row.indexId, "ownerName", e.target.value)
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
            handleApplicantChange(row.indexId, "guardianName", e.target.value)
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
    DOB: (_, row, index) => (
      <>
        <input
          type="date"
          value={row.dob}
          onChange={(e) =>
            handleApplicantChange(row.indexId, "dob", e.target.value)
          }
          placeholder="Date Of Birth"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.dob`]
              ? "border-red-500"
              : ""
          }`}
        />
        {validationError && validationError[`ownerDtl.${index}.dob`] && (
          <div className="mt-1 text-red-600 text-xs">
            {validationError[`ownerDtl.${index}.dob`]}
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
            handleApplicantChange(row.indexId, "mobileNo", e.target.value)
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
    "Email ID": (_, row, index) => (
      <>
        <input
          type="email"
          value={row.email}
          {...getValidationHandlers("email")}
          onChange={(e) =>
            handleApplicantChange(row.indexId, "email", e.target.value)
          }
          placeholder="Email ID"
          className={`px-2 py-1 border rounded w-full text-sm ${
            validationError && validationError[`ownerDtl.${index}.email`]
              ? "border-red-500"
              : ""
          }`}
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
        {formData?.ownerDtl.length > 1 && (
          <button
            onClick={() => handleRemoveApplicant(row.indexId)}
            className="bg-red-600 hover:bg-red-700 p-2 rounded text-white"
            title="Delete"
            type="button"
          >
            <FaTrash />
          </button>
        )}
        {idx === formData?.ownerDtl.length - 1 && (
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
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalVariants}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col bg-white shadow-lg rounded-lg w-full"
    >
      {/* Body Content - This is the only part that should scroll */}
      <div className="flex-grow p-6 overflow-y-auto">
        {formData && (
          <form
            id="edit-form"
            className="flex flex-col gap-6 text-gray-700 text-lg"
          >
            <FormCard
              title="Apply Water Connection Form"
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
              data={formData?.ownerDtl}
              renderers={applicantRenderers}
            />
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-shrink-0 justify-end items-center gap-3 bg-white p-4">
        <Button
          color="success"
          variant="solid"
          type="button"
          onClick={handleSubmit}
          className="rounded-full h-8 text-white"
        >
          Update
        </Button>
      </div>

      {/* Loading Overlay */}
      {isFrozen && (
        <div className="z-20 absolute inset-0 flex justify-center items-center bg-white/70">
          <span className="font-medium text-gray-800 text-lg">
            Processing...
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default EditApplication;
