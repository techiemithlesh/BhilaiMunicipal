import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import FormCard from "../../../components/common/FormCard";
import OwnerDetailsCard from "../../../components/common/OwnerDetailsCard";
import SuccessModal from "../../../components/common/SuccessModal";
import { useLoading } from "../../../contexts/LoadingContext";
import {
  shopRentAddApi,
  shopRentMasterDataApi,
  UlbApi,
  validateHoldingNoApi,
} from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { appendToFormData, getCurrentYearMonth } from "../../../utils/common";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/bmp",
];

const RELATION_LIST = ["S/O", "D/O", "W/O", "C/O"];

const CODE_CHAR = /^[A-Za-z0-9\s,.\-\/#]$/;

const newOwner = (id) => ({
  id,
  ownerName: "",
  guardianName: "",
  relationType: "",
  mobileNo: "",
});

const initialForm = () => ({
  areaId: "",
  wardMstrId: "",
  holdingNo: "",
  regNo: "",
  premiumAmt: "",
  samitiId: "",
  yojnaId: "",
  shopNo: "",
  shopTypeId: "",
  pinCode: "",
  address: "",
  ownerDtl: [newOwner(1)],
  effectiveDate: "",
  monthlyRate: "",
  document: null,
});

// Master lists may arrive as an array or as an object keyed by id.
const toList = (value) =>
  Array.isArray(value) ? value : Object.values(value || {});

// Backend errors are arrays of messages; the form components want one string.
const firstMessage = (error) => (Array.isArray(error) ? error[0] : error) || "";

export default function AddShopRent() {
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

  const today = getCurrentYearMonth();
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // -------------------- Master data --------------------
  useEffect(() => {
    (async () => {
      let data = {};
      setIsLoadingGable(true);
      try {
        const res = await axios.post(shopRentMasterDataApi, {}, authHeaders);
        if (res?.data?.status) {
          data = res.data.data || {};
        } else {
          toast.error(res?.data?.message || "Unable to load master data.");
        }
      } catch (error) {
        console.error("Error fetching shop rent master data:", error);
        toast.error("Unable to load master data.");
      } finally {
        setIsLoadingGable(false);
      }
      setMasterData({
        wardList: toList(data.wardList),
        areaType: toList(data.areaType),
        samiti: toList(data.samiti),
        shopType: toList(data.shopType),
        yojna: toList(data.yojna),
      });
    })();
  }, []);

  // Default the pin code to the ULB pin code, as the other modules do.
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
        // Pin code stays empty and can be typed in.
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
    setFormData((prev) => ({ ...prev, [name]: value ?? "" }));
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

  const handleOwnerChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((o) => (o.id === id ? { ...o, [field]: value } : o)),
    }));
    const index = formData.ownerDtl.findIndex((o) => o.id === id);
    clearError(`ownerDtl.${index}.${field}`);
  };

  const handleAddOwner = () => {
    ownerCounter.current += 1;
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [...prev.ownerDtl, newOwner(ownerCounter.current)],
    }));
  };

  const handleRemoveOwner = (id) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl:
        prev.ownerDtl.length > 1
          ? prev.ownerDtl.filter((o) => o.id !== id)
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

    required("areaId", "Area Name");
    required("wardMstrId", "Ward No");
    required("shopNo", "Shop No");
    required("shopTypeId", "Shop Build Type");
    required("address", "Address");
    required("pinCode", "Pincode");
    required("effectiveDate", "Effect From");
    required("monthlyRate", "Monthly Rate Amount");

    if (formData.address.trim() && formData.address.trim().length < 5) {
      found.address = "Address must be at least 5 characters.";
    }
    if (formData.pinCode && !/^[0-9]{6}$/.test(formData.pinCode)) {
      found.pinCode = "Pincode must be 6 digits.";
    }
    if (formData.monthlyRate && !(Number(formData.monthlyRate) >= 1)) {
      found.monthlyRate = "Monthly Rate Amount must be at least 1.";
    }
    if (!formData.document) found.document = "Supportive Document is required.";

    formData.ownerDtl.forEach((owner, index) => {
      const key = (field) => `ownerDtl.${index}.${field}`;
      if (!owner.ownerName.trim()) found[key("ownerName")] = "Owner Name is required.";
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
      const res = await axios.post(shopRentAddApi, appendToFormData(payload), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res?.data?.status) {
        toast.success(res.data.message);
        setSubmitResponse(res.data.data || {});
        setModalOpen(true);
      } else {
        toast.error(res?.data?.message || "Unable to add shop rent.");
        setErrors(res?.data?.errors || {});
      }
    } catch (error) {
      console.error("Error submitting shop rent:", error);
      toast.error("An error occurred while adding shop rent.");
    } finally {
      setIsSubmitting(false);
      setIsLoadingGable(false);
    }
  };

  // -------------------- Field configuration --------------------
  const shopFields = useMemo(
    () => [
      {
        name: "areaId",
        label: "Area Name",
        type: "select",
        required: true,
        value: formData.areaId,
        error: firstMessage(errors.areaId),
        options: (masterData?.areaType || []).map((a) => ({
          label: a.areaName,
          value: a.id,
        })),
      },
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
        name: "regNo",
        label: "Nigam Reg. No",
        value: formData.regNo,
        error: firstMessage(errors.regNo),
        placeholder: "Enter Nigam Reg. No",
        charRegex: CODE_CHAR,
        regex: /^[A-Za-z0-9\s,.\-\/#]{0,30}$/,
      },
      {
        name: "shopNo",
        label: "Shop No",
        required: true,
        value: formData.shopNo,
        error: firstMessage(errors.shopNo),
        placeholder: "Enter Shop No",
        charRegex: CODE_CHAR,
        regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
      },
      {
        name: "shopTypeId",
        label: "Shop Build Type",
        type: "select",
        required: true,
        value: formData.shopTypeId,
        error: firstMessage(errors.shopTypeId),
        options: (masterData?.shopType || []).map((t) => ({
          label: t.shopType,
          value: t.id,
        })),
      },
      {
        name: "samitiId",
        label: "Samiti Name",
        type: "select",
        value: formData.samitiId,
        error: firstMessage(errors.samitiId),
        options: (masterData?.samiti || []).map((s) => ({
          label: s.samitiName,
          value: s.id,
        })),
      },
      {
        name: "yojnaId",
        label: "Yojna Name",
        type: "select",
        value: formData.yojnaId,
        error: firstMessage(errors.yojnaId),
        options: (masterData?.yojna || []).map((y) => ({
          label: y.yojnaName,
          value: y.id,
        })),
      },
      {
        name: "premiumAmt",
        label: "Premium Amount",
        value: formData.premiumAmt,
        error: firstMessage(errors.premiumAmt),
        placeholder: "Enter Premium Amount",
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
        label: "Address",
        type: "textarea",
        required: true,
        value: formData.address,
        error: firstMessage(errors.address),
        placeholder: "Enter Full Address",
        charRegex: CODE_CHAR,
        regex: /^[A-Za-z0-9\s,.\-\/#]{0,200}$/,
      },
    ],
    [formData, errors, masterData]
  );

  const rateFields = [
    {
      name: "effectiveDate",
      label: "Effect From",
      type: "month",
      required: true,
      value: formData.effectiveDate,
      error: firstMessage(errors.effectiveDate),
      max: today,
    },
    {
      name: "monthlyRate",
      label: "Monthly Rate Amount",
      required: true,
      value: formData.monthlyRate,
      error: firstMessage(errors.monthlyRate),
      placeholder: "Monthly Rate",
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

  // -------------------- Owner fields --------------------
  const ownerFields = [
    {
      name: "ownerName",
      label: "Owner Name",
      required: true,
      maxLength: 50,
      sanitize: (v) => v.replace(/[^A-Za-z,.\s]/g, ""),
    },
    {
      name: "guardianName",
      label: "Guardian Name",
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
  ];

  // Master data is still loading, the global overlay is on screen.
  if (!masterData) return null;

  const errorMessages = Object.entries(errors);

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

        <FormCard title="Shop Details" formFields={shopFields} onChange={handleChange} />

        <OwnerDetailsCard
          title="Shop Owner Details"
          owners={formData.ownerDtl}
          fields={ownerFields}
          errors={errors}
          onChange={handleOwnerChange}
          onAdd={handleAddOwner}
          onRemove={handleRemoveOwner}
        />

        <FormCard title="Shop Rate Details" formFields={rateFields} onChange={handleChange} />

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
        onClose={() => setModalOpen(false)}
        title="Shop Rent Added"
        message={
          <>
            The shop has been added successfully. <br />
            <strong>Consumer No: {submitResponse?.consumerNo || "N/A"}</strong>
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
