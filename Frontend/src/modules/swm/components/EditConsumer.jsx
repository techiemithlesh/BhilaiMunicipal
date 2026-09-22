import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import { Spinner } from "@nextui-org/react";
import toast from "react-hot-toast";

import FormCard from "../../../components/common/FormCard";
import DetailsTable from "../../../components/common/DetailsTable";
import SuccessModal from "../../../components/common/SuccessModal";
import { formatDateYearMonth } from "../../../utils/common";
import { modalVariants } from "../../../utils/motionVariable";
import {
  swmAddConsumerApi,
  swmConsumerDtlApi,
  swmEditBasicConsumerApi,
  swmEditConsumerRangeApi,
  swmEditOwnerApi,
  swmMasterDataApi,
  swmReviewTaxApi,
  swmSubCategoryListApi,
  validateHoldingNoApi,
} from "../../../api/endpoints";
import { getToken, getWithExpiry, setWithExpiry } from "../../../utils/auth";

function EditConsumer({ id, onClose, onSuccess }) {
  const token = getToken();

  const [masterData, setMasterData] = useState(null);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [rates, setRates] = useState({});
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [applicantCounter, setApplicantCounter] = useState(1);
  const [isFormSubmit, setIsFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [submitResponse, setSubmitResponse] = useState({});
  const [validationError, setValidationError] = useState({});
  const [formData, setFormData] = useState({ ownerDtl: [] });
  const [isBasicEditSubmit,setIsBasicEditSubmit] = useState(false);
  const [isOwnerEditSubmit,setIsOwnerEditSubmit] = useState(false);
  const [isRangeEditSubmit,setIsRangeEditSubmit] = useState(false);

  const relationTypeList = [
    { value: "S/O", label: "S/O" },
    { value: "W/O", label: "W/O" },
    { value: "D/O", label: "D/O" },
    { value: "C/O", label: "C/O" },
  ];

  // -------------------- Fetch Master Data --------------------
  useEffect(() => {
    const savedMasterData = getWithExpiry("swmMasterData");
    if (savedMasterData){
        setMasterData(savedMasterData);
        return;
    } 

    if (token) {
      (async () => {
        try {
          const response = await axios.post(
            swmMasterDataApi,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response?.data?.status) {
            setMasterData(response.data.data);
            setWithExpiry("swmMasterData",response.data.data,15);
          }
        } catch (error) {
          console.error("Error fetching master data:", error);
        }
      })();
    }
  }, [token]);

  // -------------------- Fetch Consumer --------------------
  useEffect(() => {
    if (id && token) fetchConsumer();
  }, [id, token]);

  const fetchConsumer = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        swmConsumerDtlApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const consumer = response?.data?.data || {};
        setFormData({
          ...consumer,
          ownerDtl: consumer?.owners?.map((item, index) => ({
                        ...item,
                        index, // add index for reference
                    })) || [],
          categoryTypeMasterId:"",
          subCategoryTypeMasterId:"",
          hasCompostingMachineProvision:false,
          dateOfEffective: "",
        });
        fetchSubCategory(consumer?.categoryTypeMasterId);
      }
    } catch (error) {
      console.error("Error fetching consumer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------- Fetch Sub Category --------------------
  const fetchSubCategory = async (categoryTypeMasterId) => {
    if (!categoryTypeMasterId) {
      setSubCategoryList([]);
      return;
    }

    try {
      setSubCategoryLoading(true);
      const response = await axios.post(
        swmSubCategoryListApi,
        { categoryTypeMasterId, all: "all" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const list = response.data.data || [];
        setSubCategoryList(list);
        setWithExpiry("swmSubCategoryList", list, 15);
      }
    } catch (error) {
      console.error("Error fetching subcategory:", error);
    } finally {
      setSubCategoryLoading(false);
    }
  };

  // -------------------- Validate Holding No --------------------
  const validateHoldingNo = async (holdingNo) => {
    if (!holdingNo) return;
    try {
      const response = await axios.post(
        validateHoldingNoApi,
        { holdingNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response?.data?.status) {
        const data = response.data.data;
        setFormData((prev) => ({
          ...prev,
          address: data?.propAddress,
          pinCode: data?.propPinCode,
          ownerDtl: data.owners || prev.ownerDtl,
        }));
      } else {
        setValidationError((prev) => ({
          ...prev,
          holdingNo: ["Invalid Holding No"],
        }));
      }
    } catch (error) {
      console.error("Error validating holding no:", error);
    }
  };

  // -------------------- Fetch Rates --------------------
  useEffect(() => {
    const fetchRates = async () => {
      if (formData?.categoryTypeMasterId && formData?.subCategoryTypeMasterId) {
        setRateLoading(true);
        try {
          const response = await axios.post(swmReviewTaxApi, formData, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data?.status) {
            setRates(response?.data?.data);
          } else toast.error(response?.data?.message);
        } catch {
          toast.error("Error fetching rate");
        } finally {
          setRateLoading(false);
        }
      }
    };
    fetchRates();
  }, [
    formData?.dateOfEffective,
    formData?.categoryTypeMasterId,
    formData?.subCategoryTypeMasterId,
    formData?.hasCompostingMachineProvision,
  ]);

  // -------------------- Change Handlers --------------------
  const handleChange = (name, value) => {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "categoryTypeMasterId") {
        updated = { ...updated, subCategoryTypeMasterId: "" };
        fetchSubCategory(value);
      }
      return updated;
    });
  };

  const handleApplicantChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: prev.ownerDtl.map((a) =>
        a.index === id ? { ...a, [field]: value } : a
      ),
    }));
    // Clear validation error for this specific applicant + field
    setValidationError((prev) => {
        const newErr = { ...prev };

        // Find index of the ownerDtl entry
        const index = formData.ownerDtl.findIndex((a) => a.index === id);
        const errorKey = `ownerDtl.${index}.${field}`;

        if (newErr[errorKey]) {
        delete newErr[errorKey];
        }

        return newErr;
    });


  };

  const handleAddApplicant = () => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl: [
        ...prev.ownerDtl,
        {
          index: applicantCounter + 1,
          ownerName: "",
          guardianName: "",
          relationType: "",
          mobileNo: "",
          email: "",
          lockStatus:false,
        },
      ],
    }));
    setApplicantCounter((prev) => prev + 1);
  };

  const handleRemoveApplicant = (id) => {
    setFormData((prev) => ({
      ...prev,
      ownerDtl:
        prev.ownerDtl.length > 1
          ? prev.ownerDtl.filter((a) => a.index !== id)
          : prev.ownerDtl,
    }));
  };

  // -------------------- Submit --------------------
  const handelBasicEdit = async (e) => {
    e.preventDefault();
    setIsBasicEditSubmit(true);
    const payload = {
        id:id,
        wardMstrId:formData?.wardMstrId,
        holdingNo:formData?.holdingNo,
        houseNo:formData?.houseNo,
        address:formData?.address,
        landmark:formData?.landmark,
        ps:formData?.ps,
        streetName:formData?.streetName,
        locality:formData?.locality,
        pinCode:formData?.pinCode,
    }
    try {
      const response = await axios.post(swmEditBasicConsumerApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status) {
        toast.success(response?.data?.message);
        onSuccess && onSuccess();
      } else {
        toast.error(response?.data?.message);
        setValidationError(response?.data?.errors || {});
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsBasicEditSubmit(false);
    }
  };

  const handelOwnerEdit = async (e) => {
    e.preventDefault();
    setIsOwnerEditSubmit(true);
    const payload = {
        consumerId:id,
        ownerDtl:formData?.ownerDtl
    }
    try {
      const response = await axios.post(swmEditOwnerApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status) {
        toast.success(response?.data?.message);
        onSuccess && onSuccess();
      } else {
        toast.error(response?.data?.message);
        setValidationError(response?.data?.errors || {});
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsOwnerEditSubmit(false);
    }
  };

  const handelRangeEdit = async (e) => {
    e.preventDefault();
    setIsRangeEditSubmit(true);
    const payload = {
        consumerId:id,
        categoryTypeMasterId:formData?.categoryTypeMasterId,
        subCategoryTypeMasterId:formData?.subCategoryTypeMasterId,
        hasCompostingMachineProvision:formData?.hasCompostingMachineProvision,
        dateOfEffective:formData?.dateOfEffective,
        totalNoOfFlat:formData?.totalNoOfFlat,
        typeOfMultiStoreyBuilding:formData?.typeOfMultiStoreyBuilding,
        actualNoOfFlat:formData?.actualNoOfFlat,
    }
    try {
      const response = await axios.post(swmEditConsumerRangeApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.status) {
        toast.success(response?.data?.message);
        onSuccess && onSuccess();
      } else {
        toast.error(response?.data?.message);
        setValidationError(response?.data?.errors || {});
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsRangeEditSubmit(false);
    }
  };

    const formFields1 = [
        {
            name: "wardMstrId",
            label: "Ward No",
            type: "select",
            error: validationError?.wardMstrId || "",
            value: formData.wardMstrId || "",
            required: true,
            options: masterData?.wardList?.map((item) => ({ label: item.wardNo, value: item.id, })),
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
        {
            name: "holdingNo",
            label: "Holding No",
            type: "text",
            error: validationError?.holdingNo || "",
            value: formData.holdingNo || "",
            required: true,
            isHidden: false,
            placeholder: "Enter Holding No",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
            onBlur: (e) => validateHoldingNo(e.target.value),
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
        {
            name: "houseNo",
            label: "House/Flat No",
            type: "text",
            error: validationError?.houseNo || "",
            value: formData.houseNo || "",
            required: true,
            placeholder: "House/Flat No",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
            onBlur: (e) => validateHoldingNo(e.target.value),
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
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
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
        {
            name: "landmark",
            label: "Landmark",
            type: "text",
            error: validationError?.landmark || "",
            value: formData.landmark || "",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
            required: false,
            placeholder: "Enter Landmark",
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
        {
            name: "ps",
            label: "Police Station",
            type: "text",
            error: validationError?.ps || "",
            value: formData.ps || "",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
            required: false,
            placeholder: "Enter Police Station",
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
        {
            name: "streetName",
            label: "Street Name ",
            type: "text",
            error: validationError?.streetName || "",
            value: formData.streetName || "",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
            required: false,
            placeholder: "Enter Street Name ",
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
        {
            name: "locality",
            label: "Locality",
            type: "text",
            error: validationError?.locality || "",
            value: formData.locality || "",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
            required: false, placeholder: "Enter Locality",
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
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
            isDisabled: (!(formData?.userPermission?.canAppEditBasic || false)),
        },
    ];
    const areaFields = [
        {
            name: "categoryTypeMasterId",
            label: "Consumer Category",
            type: "select",
            error: validationError?.categoryTypeMasterId || "",
            value: formData.categoryTypeMasterId || "",
            required: true,
            subOnChange: fetchSubCategory,
            options: masterData?.categoryType?.map((item) => ({
                label: item.categoryType,
                value: item.id,
            })),
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
        {
            name: "subCategoryTypeMasterId",
            label: "Consumer Range Type",
            type: "select",
            error: validationError?.subCategoryTypeMasterId || "",
            value: formData.subCategoryTypeMasterId || "",
            loading: subCategoryLoading,
            required: true,
            options: subCategoryList?.map((item) => ({
                label: item.subCategoryType,
                value: item.id,
            })),
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
        {
            name: "dateOfEffective",
            label: "Date Of Effect",
            type: "month",
            error: validationError?.dateOfEffective || "",
            value: formatDateYearMonth(formData.dateOfEffective) || "",
            required: true,
            min: masterData?.minDate,
            max: masterData?.maxDate,
            placeholder: "Select Month & Year",
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
        {
            name: "hasCompostingMachineProvision",
            label: "Has Provision of Own Composting Machine",
            type: "radio",
            error: validationError?.hasCompostingMachineProvision || "",
            value: formData.hasCompostingMachineProvision || "",
            required: true,
            options: [
                { label: "Yes", value: true },
                { label: "No", value: false },
            ],
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
        {
            name: "totalNoOfFlat",
            label: "Total No. of Flats/Houses",
            type: "number",
            error: validationError?.totalNoOfFlat || "",
            value: formData.totalNoOfFlat || "",
            min: 1,
            required: true,
            isHidden: formData?.categoryTypeMasterId != 20,
            placeholder: "Enter Total No. of Flats",
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
        {
            name: "typeOfMultiStoreyBuilding",
            label: "Type of Multi-Storey Building",
            type: "select",
            error: validationError?.typeOfMultiStoreyBuilding || "",
            value: formData.typeOfMultiStoreyBuilding || "",
            options: [{ label: "APARTMENT", value: 1 }],
            isHidden: formData?.categoryTypeMasterId != 20,
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
        {
            name: "actualNoOfFlat",
            label: "Actual No. of Flats/Houses",
            type: "number",
            error: validationError?.actualNoOfFlat || "",
            value: formData.actualNoOfFlat || "",
            min: 1,
            max: formData?.totalNoOfFlat,
            required: true,
            isHidden: formData?.categoryTypeMasterId != 20,
            isDisabled: (!(formData?.userPermission?.canSwmEditCategory || false)),
        },
    ];

  // -------------------- Applicant Table --------------------
  const applicantColumns = [
    "Owner Name",
    "Guardian Name",
    "Relation",
    "Mobile No.",
    "Email ID",
    "Lock Status",
    "Action",
  ];

  const applicantRenderers = {
    "Owner Name": (_, row, index) => (
        <>
            <input
                type="text"
                required
                disabled={false}
                value={row.ownerName}
                onChange={(e) =>
                handleApplicantChange(row.index, "ownerName", e.target.value)
                }
                placeholder="Owner Name"
                className="px-2 py-1 border rounded w-full text-sm"
                readOnly={(!(formData?.userPermission?.canAppEditOwner || false))}
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
                required
                disabled={false}
                value={row.guardianName}
                onChange={(e) =>
                handleApplicantChange(row.index, "guardianName", e.target.value)
                }
                placeholder="Guardian Name"
                className="px-2 py-1 border rounded w-full text-sm"
                readOnly={(!(formData?.userPermission?.canAppEditOwner || false))}
            />
            {validationError && validationError[`ownerDtl.${index}.guardianName`] && (
                <div className="mt-1 text-red-600 text-xs">
                    {validationError[`ownerDtl.${index}.guardianName`]}
                </div>
            )}
        </>
    ),
    Relation: (_, row, index) => (
        <>
            <select
                value={row.relationType}
                disabled={(!(formData?.userPermission?.canAppEditOwner || false))}
                onChange={(e) =>
                handleApplicantChange(row.index, "relationType", e.target.value)
                }
                className="border rounded px-2 py-1 w-full text-sm"
            >
                <option value="">Select</option>
                {relationTypeList.map((r) => (
                <option key={r.value} value={r.value}>
                    {r.label}
                </option>
                ))}
            </select>
            {validationError && validationError[`ownerDtl.${index}.relationType`] && (
                <div className="mt-1 text-red-600 text-xs">
                    {validationError[`ownerDtl.${index}.relationType`]}
                </div>
            )}
        </>
    ),
    "Mobile No.": (_, row, index) => (
        <>
            <input
                type="text"
                value={row.mobileNo}
                onChange={(e) =>
                handleApplicantChange(row.index, "mobileNo", e.target.value)
                }
                placeholder="Mobile No."
                className="px-2 py-1 border rounded w-full text-sm"
                disabled={(!(formData?.userPermission?.canAppEditOwner || false))}
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
                onChange={(e) =>
                handleApplicantChange(row.index, "email", e.target.value)
                }
                placeholder="Email"
                className="px-2 py-1 border rounded w-full text-sm"
                disabled={(!(formData?.userPermission?.canAppEditOwner || false))}
            />
            {validationError && validationError[`ownerDtl.${index}.email`] && (
                <div className="mt-1 text-red-600 text-xs">
                    {validationError[`ownerDtl.${index}.email`]}
                </div>
            )}
        </>
    ),
    "Lock Status": (_, row, index) => (
        <>
            <button
                type="button"
                onClick={() =>
                handleApplicantChange(row.index, "lockStatus", !row.lockStatus)
                }
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${
                row.lockStatus ? "bg-green-500" : "bg-gray-300"
                }`}
                disabled={(!(formData?.userPermission?.canAppEditOwner || false))}
            >
                <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                    row.lockStatus ? "translate-x-6" : "translate-x-1"
                }`}
                />
            </button>
            {validationError && validationError[`ownerDtl.${index}.lockStatus`] && (
                <div className="mt-1 text-red-600 text-xs">
                    {validationError[`ownerDtl.${index}.lockStatus`]}
                </div>
            )}
        </>
    ),
    Action: (_, row, idx) => (
      <div className="flex justify-center gap-2">
        {formData.ownerDtl.length > 1 && (!row.id) && (
          <button
            onClick={() => handleRemoveApplicant(row.index)}
            className="bg-red-600 hover:bg-red-700 p-2 rounded text-white"
            title="Delete"
            type="button"
            disabled={(!(formData?.userPermission?.canAppEditOwner || false))}
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
            disabled={(!(formData?.userPermission?.canAppEditOwner || false))}
          >
            <FaPlus />
          </button>
        )}
      </div>
    ),
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-75 p-4">
      {isLoading ? (
        <Spinner />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: 0.5 }}
          //   className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[80vh] overflow-y-auto"
          className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-6xl max-h-[95vh]"
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">
                    Update
                </h2>
                <button onClick={onClose}>
                    <FaTimes size={20} />
                </button>
            </div>
            <div className="relative flex-grow p-2 overflow-y-auto scrollbar-hide">
                <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
                    <FormCard
                    title="Connection Details"
                    formFields={formFields1}
                    onChange={handleChange}
                    />
                    <div className="flex justify-center mt-3">
                        <button
                            onClick={handelBasicEdit}
                            disabled={(!(formData?.userPermission?.canAppEditBasic || false)) || isBasicEditSubmit}
                            className={`rounded-full text-white px-6 py-2 ${((!(formData?.userPermission?.canAppEditBasic || false)) || isBasicEditSubmit) ? "  bg-gray-400 hover:bg-gray-500" : " bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {isBasicEditSubmit ? "Submitting..." : "Edit"}
                        </button>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
                    <DetailsTable
                        title="Owner Details"
                        columns={applicantColumns}
                        data={formData.ownerDtl || []}
                        renderers={applicantRenderers}
                    />
                    <div className="flex justify-center mt-3">
                        <button
                            onClick={handelOwnerEdit}
                            disabled={(!(formData?.userPermission?.canAppEditOwner || false)) || isOwnerEditSubmit}
                            className={`rounded-full text-white px-6 py-2 ${((!(formData?.userPermission?.canAppEditOwner || false)) || isOwnerEditSubmit) ? "  bg-gray-400 hover:bg-gray-500" : " bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {isOwnerEditSubmit ? "Submitting..." : "Edit"}
                        </button>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
                    <FormCard
                    title="Area Details"
                    formFields={areaFields}
                    onChange={handleChange}
                    />
                    <div className="text-green-600 text-center">
                        {rateLoading
                            ?(
                                <div className="flex justify-center items-center h-12">
                                    <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-6 h-6 animate-spin"></span>
                                    <span className="ml-2 text-blue-600 text-sm">
                                        Loading options...
                                    </span>
                                </div>
                            ):(
                            <>
                                Monthly Amount: {rates?.ratePerMonth}
                            </>
                            )
                        }
                    </div>
                    <div className="flex justify-center mt-3">
                        <button
                            onClick={handelRangeEdit}
                            disabled={(!(formData?.userPermission?.canSwmEditCategory || false)) || isRangeEditSubmit}
                            className={`rounded-full text-white px-6 py-2 ${((!(formData?.userPermission?.canSwmEditCategory || false)) || isRangeEditSubmit) ? "  bg-gray-400 hover:bg-gray-500" : " bg-blue-600 hover:bg-blue-700"}`}
                        >
                            {isRangeEditSubmit ? "Submitting..." : "Edit"}
                        </button>
                    </div>
                </div>
            </div>

        </motion.div>
      )}
    </div>
  );
}

export default EditConsumer;
