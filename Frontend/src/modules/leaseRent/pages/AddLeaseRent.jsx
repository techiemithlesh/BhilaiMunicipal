import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import FormCard from "../../../components/common/FormCard";
import OwnerDetailsCard from "../../../components/common/OwnerDetailsCard";
import SuccessModal from "../../../components/common/SuccessModal";
import { useLoading } from "../../../contexts/LoadingContext";
import {
  getWardListApi,
  leaseAddApi,
  leaseMasterDataApi,
  UlbApi,
  validateHoldingNoApi,
} from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { appendToFormData } from "../../../utils/common";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/bmp",
];

const RELATION_LIST = ["S/O", "D/O", "W/O", "C/O"];
const USE_OF_LAND_LIST = [
  { label: "Residential", value: "Residential" },
  { label: "Commercial", value: "Commercial" },
  { label: "Industrial", value: "Industrial" },
  { label: "Institutional", value: "Institutional" },
  { label: "Mixed", value: "Mixed" },
];

const CODE_CHAR = /^[A-Za-z0-9\s,.\-\/#]$/;

const newConsumer = (index) => ({
  index,
  ownerName: "",
  guardianName: "",
  relationType: "",
  mobileNo: "",
  ownerAddress:"",
});

const initialForm = () => ({
  wardMstrId: "",
  holdingNo: "",
  leaseRegNo: "",
  areaId: "",
  usesTypeId: "",
  width: "",
  length: "",
  address: "",
  pinCode: "",
  address: "",
  ownerDtl: [newConsumer(1)],
  leaseDate: "",
  leaseEndDate: "",
  yearlyRate: "",
  document: null,
});

const toList = (value) =>
  Array.isArray(value) ? value : Object.values(value || {});

const firstMessage = (error) => (Array.isArray(error) ? error[0] : error) || "";

export default function AddLeaseRent() {
  const token = getToken();
  const ulbId = JSON.parse(localStorage.getItem("userDetails") || "null")?.ulbId;
  const { setIsLoadingGable } = useLoading();
  const errorBoxRef = useRef(null);
  const ownerCounter = useRef(1);

  const [masterData, setMasterData] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [submitResponse, setSubmitResponse] = useState({});

  const today = new Date().toISOString().split("T")[0];
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // -------------------- Master data --------------------
  useEffect(() => {
    (async () => {
      let data = {};
      setIsLoadingGable(true);
      try {
        const res = await axios.post(leaseMasterDataApi, {}, authHeaders);
        if (res?.data?.status) {
          data = res.data.data || {};
        }
      } catch {
        // Fallback to ward list API if lease master endpoint is not deployed yet
        try {
          const wardRes = await axios.get(getWardListApi, {
            ...authHeaders,
            params: { all: true },
          });
          if (wardRes?.data?.status) {
            data.wardList = wardRes.data.data || [];
          }
        } catch (err) {
          console.error("Error fetching lease rent master data:", err);
        }
      } finally {
        setIsLoadingGable(false);
      }
      setMasterData({
        wardList: toList(data.wardList),
        areaType: toList(data.areaType),
        useOfLand:toList(data.useOfLand),
      });
    })();
  }, []);

  // Default pincode to ULB pincode
  useEffect(() => {
    if (!ulbId) return;
    (async () => {
      try {
        const res = await axios.post(UlbApi.replace("{id}", ulbId), {});
        const pincode = res?.data?.data?.pincode;
        if (pincode) {
          setFormData((prev) => ({ ...prev, pinCode: prev.pinCode || pincode }));
        }
      } catch {
        // Pin code stays empty and can be typed in
      }
    })();
  }, [ulbId]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      errorBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errors]);

  // -------------------- Handlers --------------------
  const clearError = (name) =>
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  const handleChange = (name, value) => {
    if (name === "document" && value) {
      if (!ALLOWED_FILE_TYPES.includes(value.type)) {
        toast.error("Document must be a PDF, JPG, PNG or BMP file.");
        return;
      }
      if (value.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Document must be ${MAX_FILE_SIZE_MB} MB or smaller.`);
        return;
      }
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value ?? "" };
      // Auto-calculate totalArea when width or length changes
      if (name === "width" || name === "length") {
        const w = parseFloat(name === "width" ? value : prev.width);
        const l = parseFloat(name === "length" ? value : prev.length);
        if (!isNaN(w) && !isNaN(l)) {
          next.totalArea = String(Number((w * l).toFixed(2)));
        }
      }
      return next;
    });
    clearError(name);
  };

  const validateHoldingNo = async (holdingNo) => {
    if (!holdingNo) return;
    setIsLoadingGable(true);
    try {
      const res = await axios.post(validateHoldingNoApi, { holdingNo }, authHeaders);
      if (!res?.data?.status) {
        setErrors((prev) => ({ ...prev, holdingNo: "Invalid Holding No" }));
      }
    } catch (error) {
      console.error("Error validating holding no:", error);
    } finally {
      setIsLoadingGable(false);
    }
  };

  const handleOwnerChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((o) => (o.index === index ? { ...o, [field]: value } : o)),
    }));
    const sl = formData.ownerDtl.findIndex((o) => o.index === index);
    clearError(`ownerDtl.${sl}.${field}`);
  };

  const handleAddOwner = () => {
    ownerCounter.current += 1;
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [...prev.ownerDtl, newConsumer(ownerCounter.current)],
    }));
  };

  const handleRemoveOwner = (index) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl:
        prev.ownerDtl.length > 1
          ? prev.ownerDtl.filter((o) => o.index !== index)
          : prev.ownerDtl,
    }));
    setErrors((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => !key.startsWith("ownerDtl."))
      )
    );
  };

  const handleReset = () => {
    ownerCounter.current = 1;
    setFormData(initialForm());
    setErrors({});
  };

  // -------------------- Validation --------------------
  const validate = () => {
    const found = { ...errors };
    const required = (name, label) => {
      if (!String(formData[name] ?? "").trim()) found[name] = `${label} is required.`;
    };

    required("wardMstrId", "Ward No");
    required("leaseRegNo", "Nigam Lease No");
    if ((masterData?.areaType || []).length > 0) {
      required("areaId", "Lease Area");
    } else {
      required("leaseAreaName", "Lease Area");
    }
    required("usesTypeId", "Use of Land");
    required("address", "Plot Address");
    required("pinCode", "Pincode");
    required("leaseDate", "Lease Start Date");
    required("leaseEndDate", "Lease End Date");
    required("yearlyRate", "Lease Amount");

    if (formData.address.trim() && formData.address.trim().length < 5) {
      found.address = "Address must be at least 5 characters.";
    }
    if (formData?.address?.trim() && formData?.address?.trim().length < 5) {
      found.address = "Plot Address must be at least 5 characters.";
    }
    if (formData.pinCode && !/^[0-9]{6}$/.test(formData.pinCode)) {
      found.pinCode = "Pincode must be 6 digits.";
    }
    if (formData.yearlyRate && !(Number(formData.yearlyRate) >= 1)) {
      found.yearlyRate = "Lease Amount must be at least 1.";
    }
    if (!formData.document) found.document = "Supportive Document is required.";

    formData.ownerDtl.forEach((owner, index) => {
      const key = (field) => `ownerDtl.${index}.${field}`;
      if (!owner.ownerName.trim()) found[key("ownerName")] = "Consumer Name is required.";
      if (owner.guardianName.trim() && !owner.relationType) {
        found[key("relationType")] = "Relation is required with Guardian Name.";
      }
      if (!/^[0-9]{10}$/.test(owner.mobileNo)) {
        found[key("mobileNo")] = "Mobile No must be 10 digits.";
      }
    });

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  // -------------------- Submit --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { ownerDtl, ...rest } = formData;
    const payload = {
      ...Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== "" && v !== null && v !== undefined)
      ),
      ownerDtl: ownerDtl.map(({ id, ...owner }) =>
        Object.fromEntries(Object.entries(owner).filter(([, v]) => v !== ""))
      ),
    };

    setIsSubmitting(true);
    setIsLoadingGable(true);
    try {
      const res = await axios.post(leaseAddApi, appendToFormData(payload), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res?.data?.status) {
        toast.success(res.data.message || "Lease Rent Added Successfully");
        setSubmitResponse(res.data.data || {});
        setModalOpen(true);
      } else {
        toast.error(res?.data?.message || "Unable to add lease rent.");
        setErrors(res?.data?.errors || {});
      }
    } catch (error) {
      console.error("Error submitting lease rent:", error);
      toast.error("An error occurred while adding lease rent.");
    } finally {
      setIsSubmitting(false);
      setIsLoadingGable(false);
    }
  };

  // -------------------- Field configuration --------------------
  const leaseAreaFields = useMemo(() => {
    const hasAreaMaster = (masterData?.areaType || []).length > 0;
    return [
      {
        name: "wardMstrId",
        label: "Ward No",
        type: "select",
        required: true,
        value: formData.wardMstrId,
        error: firstMessage(errors.wardMstrId),
        options: (masterData?.wardList || []).map((w) => ({
          label: w.wardNo,
          value: w.id,
        })),
      },
      {
        name: "holdingNo",
        label: "Holding No",
        value: formData.holdingNo,
        error: firstMessage(errors.holdingNo),
        placeholder: "Enter Holding No",
        charRegex: CODE_CHAR,
        regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
        onBlur: (e) => validateHoldingNo(e.target.value),
      },
      {
        name: "leaseRegNo",
        label: "Nigam Lease No.",
        required: true,
        value: formData.leaseRegNo,
        error: firstMessage(errors.leaseRegNo),
        placeholder: "Enter Nigam Lease No.",
        charRegex: CODE_CHAR,
        regex: /^[A-Za-z0-9\s,.\-\/#]{0,30}$/,
      },
      hasAreaMaster
        ? {
            name: "areaId",
            label: "Lease Area",
            type: "select",
            required: true,
            value: formData.areaId,
            error: firstMessage(errors.areaId),
            options: masterData.areaType.map((a) => ({
              label: a.areaName,
              value: a.id,
            })),
          }
        : {
            name: "leaseAreaName",
            label: "Lease Area",
            required: true,
            value: formData.leaseAreaName,
            error: firstMessage(errors.leaseAreaName),
            placeholder: "Enter Lease Area (e.g. NEHRU NAGAR WEST)",
            charRegex: CODE_CHAR,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,100}$/,
          },
      {
        name: "usesTypeId",
        label: "Use of Land",
        type: "select",
        required: true,
        value: formData.usesTypeId,
        error: firstMessage(errors.usesTypeId),
        options: masterData?.useOfLand?.map((a) =>({
              label: a.usageType,
              value: a.id,
            })
        ),
      },
      {
        name: "width",
        label: "Width (mtrs)",
        value: formData.width,
        required: true,
        error: firstMessage(errors.width),
        placeholder: "Width in mtrs",
        charRegex: /^[0-9.]$/,
        regex: /^[0-9]{0,7}(\.[0-9]{0,2})?$/,
      },
      {
        name: "length",
        label: "Length (mtrs)",
        required: true,
        value: formData.length,
        error: firstMessage(errors.length),
        placeholder: "Length in mtrs",
        charRegex: /^[0-9.]$/,
        regex: /^[0-9]{0,7}(\.[0-9]{0,2})?$/,
      },
      {
        name: "totalArea",
        label: "Total Area (mtrs²)",
        value: ((formData.length||0) * (formData.width||0)),
        disabled:true,
        error: firstMessage(errors.totalArea),
        placeholder: "Total Area in mtrs²",
        charRegex: /^[0-9.]$/,
        regex: /^[0-9]{0,9}(\.[0-9]{0,2})?$/,
      },
      {
        name: "pinCode",
        label: "Pincode",
        required: true,
        value: formData.pinCode,
        error: firstMessage(errors.pinCode),
        placeholder: "Enter Pincode",
        maxLength: 6,
        charRegex: /^[0-9]$/,
        regex: /^[0-9]{0,6}$/,
      },
      {
        name: "address",
        label: "Plot Address",
        type: "textarea",
        required: true,
        value: formData.address,
        error: firstMessage(errors.address),
        placeholder: "Enter Plot Address",
        charRegex: CODE_CHAR,
        regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
      },
    ];
  }, [formData, errors, masterData]);

  const leaseRateFields = [    
    {
      name: "effectiveDate",
      label: "Rate Effective Date",
      type: "month",
      required: true,
      value: formData.effectiveDate,
      error: firstMessage(errors.effectiveDate),
    },
    {
      name: "leaseDate",
      label: "Lease Start Date",
      type: "date",
      required: true,
      value: formData.leaseDate,
      error: firstMessage(errors.leaseDate),
      max: today,
    },
    {
      name: "leaseEndDate",
      label: "Lease End Date",
      type: "date",
      required: true,
      value: formData.leaseEndDate,
      error: firstMessage(errors.leaseEndDate),
      min: today,
    },
    {
      name: "yearlyRate",
      label: "Lease Amount (₹)",
      required: true,
      value: formData.yearlyRate,
      error: firstMessage(errors.yearlyRate),
      placeholder: "Enter Lease Amount",
      charRegex: /^[0-9.]$/,
      regex: /^[0-9]{0,9}(\.[0-9]{0,2})?$/,
    },
    {
      name: "document",
      label: "Supportive Document",
      type: "file",
      required: true,
      accept: ".pdf,.png,.jpg,.jpeg,.bmp",
      hint: `PDF, JPG, PNG or BMP, up to ${MAX_FILE_SIZE_MB} MB`,
      error: firstMessage(errors.document),
    },
  ];

  // -------------------- Consumer / Lessee fields --------------------
  const ownerFields = [
    {
      name: "ownerName",
      label: "Consumer Name",
      required: true,
      maxLength: 50,
      sanitize: (v) => v.replace(/[^A-Za-z,.\s]/g, ""),
    },
    {
      name: "guardianName",
      label: "Guardian's Name",
      maxLength: 50,
      sanitize: (v) => v.replace(/[^A-Za-z,.\s]/g, ""),
    },
    {
      name: "relationType",
      label: "Relation",
      type: "select",
      options: RELATION_LIST,
      required: (owner) => !!owner.guardianName.trim(),
    },
    {
      name: "mobileNo",
      label: "Mobile No",
      type: "tel",
      required: true,
      maxLength: 10,
      sanitize: (v) => v.replace(/\D/g, ""),
    },    
    {
      name: "ownerAddress",
      label: "Address",
      type: "textarea",
      value: formData.ownerAddress,
      error: firstMessage(errors.ownerAddress),
      placeholder: "Enter Full Address",
      charRegex: CODE_CHAR,
      regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
    },
  ];

  if (!masterData) return null;

  const errorMessages = Object.entries(errors);

  console.log("error:",errors);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 text-gray-700 text-lg"
        noValidate
      >
        {errorMessages.length > 0 && (
          <div
            ref={errorBoxRef}
            className="bg-red-100 px-4 py-3 border border-red-400 rounded text-red-700"
          >
            <h4 className="font-bold">Please correct the following:</h4>
            <ul className="ml-5 list-disc text-base">
              {errorMessages.map(([key, msg]) => (
                <li key={key}>{Array.isArray(msg) ? msg.join(", ") : msg}</li>
              ))}
            </ul>
          </div>
        )}

        <FormCard title="Lease & Area Details" formFields={leaseAreaFields} onChange={handleChange} />

        <OwnerDetailsCard
          title="Consumer / Lessee Details"
          owners={formData.ownerDtl}
          fields={ownerFields}
          errors={errors}
          onChange={handleOwnerChange}
          onAdd={handleAddOwner}
          onRemove={handleRemoveOwner}
        />

        <FormCard title="Lease Amount Details" formFields={leaseRateFields} onChange={handleChange} />

        <div className="flex justify-center items-center gap-3">
          <button
            type="submit"
            className={`items-center px-4 py-2 rounded text-white ${
              isSubmitting ? "btn-secondary" : "btn-primary"
            }`}
            disabled={isSubmitting}
          >
            Submit
          </button>
          <button
            type="button"
            className="items-center bg-white hover:bg-gray-100 px-4 py-2 border border-gray-300 rounded font-bold text-gray-700 transition"
            disabled={isSubmitting}
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>

      <SuccessModal
        isOpen={isModalOpen}
        onClose={() => {setModalOpen(false);handleReset();}}
        title="Lease Rent Added"
        message={
          <>
            The lease has been added successfully. <br />
            <strong>Consumer No: {submitResponse?.leaseNo || "N/A"}</strong>
          </>
        }
        buttonText="OK"
        onConfirm={() => {
          setModalOpen(false);
          handleReset();
        }}
      />
    </>
  );
}
