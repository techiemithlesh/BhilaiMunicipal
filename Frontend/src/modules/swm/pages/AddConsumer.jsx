import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPlus, FaTrash } from "react-icons/fa";
import FormCard from "../../../components/common/FormCard";
import DetailsTable from "../../../components/common/DetailsTable";
import {
    swmAddConsumerApi,
    swmMasterDataApi,
    swmReviewTaxApi,
    swmSubCategoryListApi,
    UlbApi,
    validateHoldingNoApi
} from "../../../api/endpoints";
import {
    getToken,
    getWithExpiry,
    setWithExpiry,
} from "../../../utils/auth";
import toast from "react-hot-toast";
import SuccessModal from "../../../components/common/SuccessModal";
import LocationPicker from "../../../components/common/LocationPicker";

function AddConsumer({ mstrData, formDetails }) {
    const navigate = useNavigate();
    const token = getToken();
    const [loc, setLoc] = useState(null);


    const [masterData, setMasterData] = useState(null);
    const [subCategoryList, setSubCategoryList] = useState([]);
    const [rates, setRates] = useState({});
    const [subCategoryLoading, setSubCategoryLoading] = useState(false);
    const [rateLoading, setRateLoading] = useState(false);
    const [validationError, setValidationError] = useState({});
    const [applicantCounter, setApplicantCounter] = useState(1);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isFormSubmit, setIsFormSubmit] = useState(false);
    const [submitResponse, setSubmitResponse] = useState({});

    const [ulbData, setUlbData] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem("userDetails"));
    const ulbId = userInfo?.ulbId;



    const [formData, setFormData] = useState(() => {
        const savedData = getWithExpiry("swmFormData");
        if (savedData) return savedData;

        return (
            (formDetails && JSON.parse(formDetails)) || {
                wardMstrId: "",
                holdingNo: "",
                houseNo: "",
                address: "",
                pinCode: "",
                landmark: "",
                streetName: "",
                policeStation: "",
                locality: "",
                areaSqft: "",
                categoryTypeMasterId: "",
                subCategoryTypeMasterId: "",
                dateOfEffective: "",
                totalNoOfHouse: "",
                hasCompostingMachineProvision: false,
                ownerDtl: [
                    {
                        ownerName: "",
                        guardianName: "",
                        relationType: "",
                        mobileNo: "",
                        email: "",
                    },
                ],
            }
        );
    });

    const relationTypeList = [
        { value: "S/O", label: "S/O" },
        { value: "W/O", label: "W/O" },
        { value: "D/O", label: "D/O" },
        { value: "C/O", label: "C/O" },
    ];

    // -------------------- Load Master Data --------------------
    useEffect(() => {
        if (formDetails) {
            try {
                setFormData(JSON.parse(formDetails));
            } catch (e) {
                console.error("Invalid formDetails JSON:", e);
            }
        }

        const savedSubCategoryList = getWithExpiry("swmSubCategoryList");
        if (savedSubCategoryList) setSubCategoryList(savedSubCategoryList);

        const savedRate = getWithExpiry("swmRate");
        if (savedRate) setRates(savedRate);

        const savedMasterData = getWithExpiry("swmMasterData");
        if (savedMasterData) {
            setMasterData(savedMasterData);
        } else if (token) {
            (async () => {
                try {
                    let data = mstrData ? JSON.parse(mstrData) : null;
                    if (!data) {
                        const response = await axios.post(
                            swmMasterDataApi,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (response?.data?.status) data = response.data.data;
                    }
                    if (data) {
                        setMasterData(data);
                    }
                } catch (error) {
                    console.error("Error fetching master data:", error);
                }
            })();
        }
    }, [formDetails, mstrData, token]);

    // -------------------- Fetch Rate Dynamically --------------------
    useEffect(() => {
        const fetchRates = async () => {
            if (
                formData?.categoryTypeMasterId &&
                formData?.subCategoryTypeMasterId
            ) {
                setRateLoading(true);
                try {
                    const response = await axios.post(
                        swmReviewTaxApi,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    if (response.data?.status) {
                        setRates(response?.data?.data);
                        // setWithExpiry("swmRate", response?.data?.data, 15);
                    } else {
                        toast.error(response?.data?.message);
                    }
                } catch (error) {
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
        token,
    ]);

    // -------------------- Fetch Sub Category --------------------
    const fetchSubCategory = async (categoryTypeMasterId) => {
        if (!categoryTypeMasterId) {
            setSubCategoryList([]);
            setFormData((prev) => ({
                ...prev,
                subCategoryTypeMasterId: "",
            }));
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
                const newList = response.data.data || [];
                setSubCategoryList(newList);
                setWithExpiry("swmSubCategoryList", newList, 15);
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
                    // wardMstrId: data.wardMstrId,
                    // newWardMstrId: data.newWardMstrId,
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

    // -------------------- Validation Regex --------------------
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

    // -------------------- Applicant Handlers --------------------
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
                    id: applicantCounter + 1,
                    ownerName: "",
                    guardianName: "",
                    relationType: "",
                    mobileNo: "",
                    email: "",
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
                    ? prev.ownerDtl.filter((a) => a.id !== id)
                    : prev.ownerDtl,
        }));
    };

    // -------------------- Handle Change --------------------
    const handleChange = (name, value) => {
        setFormData((prev) => {
            if (value === "true") value = true;
            if (value === "false") value = false;

            let updated = { ...prev, [name]: value };
            if (name === "categoryTypeMasterId") {
                updated = { ...updated, subCategoryTypeMasterId: "" };
                fetchSubCategory(value);
            }
            return updated;
        });

        if (validationError[name]) {
            setValidationError((prev) => {
                const newErr = { ...prev };
                delete newErr[name];
                return newErr;
            });
        }
    };

    // -------------------- Submit Handler --------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        // if((!loc?.lat)|| (!loc?.lng)){
        //     alert("Please Select Location On Map");
        //     return false;
        // }
        setIsFormSubmit(true);
        try {
            const payload = { ...formData };//,latitude:loc?.lat,longitude:loc?.lng
            const response = await axios.post(swmAddConsumerApi, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.status) {
                toast.success(response?.data?.message);
                setSubmitResponse(response.data?.data);
                setModalOpen(true);
            } else {
                toast.error(response?.data?.message);
                setValidationError(response?.data?.errors || {});
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsFormSubmit(false);
        }
    };
    // console.log("loc",loc,loc?.length);


    // ULB FETCH

    useEffect(() => {
        const fetchUlbDtl = async () => {
            if (!ulbId) return;
            try {
                const res = await axios.post(UlbApi.replace("{id}", ulbId), {});
                setUlbData(res?.data?.data);
                setFormData((prev) => ({ ...prev, 
                    pinCode: prev?.pinCode ? prev?.pinCode: (res?.data?.data?.pincode || ""),
                    policeStation: prev?.policeStation ? prev?.policeStation : (res?.data?.data?.policeStation || "")
                 }));
            } catch {
                setUlbData({ ulb_name: "ULB Info" });
            }
        };
        fetchUlbDtl();
    }, [ulbId]);

    console.log("formData", formData);

    // -------------------- Field Configurations --------------------
    const formFields1 = [
        {
            name: "wardMstrId",
            label: "Ward No",
            type: "select",
            error: validationError?.wardMstrId || "",
            value: formData.wardMstrId || "",
            required: true,
            options: masterData?.wardList?.map((item) => ({ label: item.wardNo, value: item.id, })),
        },
        {
            name: "holdingNo",
            label: "Holding No",
            type: "text",
            error: validationError?.holdingNo || "",
            value: formData.holdingNo || "",
            required: false, isHidden: false,
            placeholder: "Enter Holding No",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
            onBlur: (e) => validateHoldingNo(e.target.value),
        },
        {
            name: "houseNo",
            label: "House/Flat No",
            type: "text",
            error: validationError?.houseNo || "",
            value: formData.houseNo || "",
            required: false,
            placeholder: "House/Flat No",
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,20}$/,
            onBlur: (e) => validateHoldingNo(e.target.value),
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
        },
        {
            name: "ps",
            label: "Police Station",
            type: "text",
            error: validationError?.ps || "",
            value: formData?.policeStation || "",
            readOnly: true,
            charRegex: /^[A-Za-z0-9\s,.\-\/#]$/,
            regex: /^[A-Za-z0-9\s,.\-\/#]{0,50}$/,
            required: false,
            placeholder: "Enter Police Station",
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
        },
        {
            name: "pinCode",
            label: "Pin Code",
            type: "text",
            error: validationError?.pinCode || "",
            value: formData?.pinCode || "",
            readOnly: true,
            charRegex: /^[0-9]$/,
            regex: /^[1-9][0-9]{0,5}$/,
            maxLength: 6,
            required: true,
            placeholder: "Enter Pin",
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
        },
        {
            name: "dateOfEffective",
            label: "Date Of Effect",
            type: "month",
            error: validationError?.dateOfEffective || "",
            value: formData.dateOfEffective || "",
            required: true,
            min: masterData?.minDate,
            max: masterData?.maxDate,
            placeholder: "Select Month & Year",
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
        },
        {
            name: "typeOfMultiStoreyBuilding",
            label: "Type of Multi-Storey Building",
            type: "select",
            error: validationError?.typeOfMultiStoreyBuilding || "",
            value: formData.typeOfMultiStoreyBuilding || "",
            options: [{ label: "APARTMENT", value: 1 }],
            isHidden: formData?.categoryTypeMasterId != 20,
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
        },
    ];
    // -------------------- Table Config --------------------
    const applicantColumns = [
        "Owner Name",
        "Guardian Name",
        "Relation",
        "Mobile No.",
        "Email ID",
        "Action",
    ];

    const applicantRenderers = {
        "Owner Name": (_, row, index) => (
            <>
                <input
                    type="text"
                    required
                    value={row.ownerName}
                    {...getValidationHandlers("ownerName")}
                    onChange={(e) =>
                        handleApplicantChange(row.id, "ownerName", e.target.value)
                    }
                    placeholder="Owner Name"
                    className={`px-2 py-1 border rounded w-full text-sm ${validationError && validationError[`ownerDtl.${index}.ownerName`]
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
                    required
                    value={row.guardianName}
                    {...getValidationHandlers("guardianName")}
                    onChange={(e) =>
                        handleApplicantChange(row.id, "guardianName", e.target.value)
                    }
                    placeholder="Guardian Name"
                    className={`px-2 py-1 border rounded w-full text-sm ${validationError && validationError[`ownerDtl.${index}.guardianName`]
                        ? "border-red-500"
                        : ""
                        }`}
                />
            </>
        ),
        Relation: (_, row, index) => (
            <>
                <select
                    value={row.relationType}
                    required
                    onChange={(e) =>
                        handleApplicantChange(row.id, "relationType", e.target.value)
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
                {validationError[`ownerDtl.${index}.relationType`] && (
                    <div className="mt-1 text-red-600 text-xs">
                        {validationError[`ownerDtl.${index}.relationType`]}
                    </div>
                )}
            </>
        ),
        "Mobile No.": (_, row, index) => (
            <input
                type="text"
                required
                value={row.mobileNo}
                {...getValidationHandlers("mobileNo")}
                onChange={(e) =>
                    handleApplicantChange(row.id, "mobileNo", e.target.value)
                }
                placeholder="Mobile No."
                className="px-2 py-1 border rounded w-full text-sm"
            />
        ),
        "Email ID": (_, row, index) => (
            <input
                type="email"
                value={row.email}
                {...getValidationHandlers("email")}
                onChange={(e) =>
                    handleApplicantChange(row.id, "email", e.target.value)
                }
                placeholder="Email ID"
                className="px-2 py-1 border rounded w-full text-sm"
            />
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

    if (!masterData) {
        return (
            <div className="flex flex-col gap-6 p-6 text-gray-700 text-lg">
                <h2 className="font-semibold text-xl">Loading...</h2>
                <p>Please wait while we load your application details.</p>
            </div>
        );
    }

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
                            <strong>Application No: {submitResponse?.consumerNo}</strong>
                        </>
                    }
                    buttonText="OK"
                    onConfirm={() => {
                        setModalOpen(false);
                        navigate("/swm/search");
                    }}
                    showSecondaryButton
                    secondaryButtonText="View Details"
                    onSecondaryAction={() => {
                        setModalOpen(false);
                        navigate(`/swm/dtl/${submitResponse?.consumerId}`);
                    }}
                />
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 text-gray-700 text-lg"
        >
            {Object.keys(validationError).length > 0 && (
                <div className="bg-red-100 px-4 py-3 border border-red-400 rounded text-red-700">
                    <h4 className="font-bold">Validation Errors:</h4>
                    <ul className="ml-5 list-disc">
                        {Object.keys(validationError).map((key) => (
                            <li key={key}>
                                {Array.isArray(validationError[key])
                                    ? validationError[key].join(", ")
                                    : validationError[key]}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <FormCard
                title="Connection Detail"
                formFields={formFields1}
                onChange={handleChange}
            />

            <DetailsTable
                title="Owner Details"
                columns={applicantColumns}
                data={formData.ownerDtl}
                renderers={applicantRenderers}
            />

            <FormCard
                title="Area Details"
                formFields={areaFields}
                onChange={handleChange}
            />

            <div className="text-green-600 text-center">
                {rateLoading
                    ? (
                        <div className="flex justify-center items-center h-12">
                            <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-6 h-6 animate-spin"></span>
                            <span className="ml-2 text-blue-600 text-sm">
                                Loading options...
                            </span>
                        </div>
                    ) : (
                        <>
                            Monthly Amount: {rates?.ratePerMonth}
                        </>
                    )
                }
            </div>
            {/* <div className="flex justify-center items-center">
                <LocationPicker onSelect={setLoc} />                
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

export default AddConsumer;
