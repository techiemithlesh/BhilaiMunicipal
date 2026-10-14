import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FormCard from "../../../components/common/FormCard";
import OwnerDetailsCard from "../../../components/common/OwnerDetailsCard";
import { useLoading } from "../../../contexts/LoadingContext";
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
import ConnectionDetails from "../components/ConnectionDetails";

function AddConsumer({ mstrData, formDetails }) {
    const navigate = useNavigate();
    const token = getToken();
    const { setIsLoadingGable } = useLoading();
    const [loc, setLoc] = useState(null);


    const [masterData, setMasterData] = useState(null);
    const [subCategoryList, setSubCategoryList] = useState([]);
    const [rates, setRates] = useState({});
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
                        id: 1,
                        ownerName: "",
                        guardianName: "",
                        relationType: "",
                        mobileNo: "",
                        email: "",
                    },
                ],
                dateOfEffective:"",
                connectionDtl:[
                    {
                        categoryTypeMasterId: "",
                        subCategoryTypeMasterId: "",
                        totalNoOfHouseAreaRoomTruck: 1,
                        hasRestaurant: false,
                        totalNoOfRestaurant: 0,
                        hasGarden: false,
                        totalNoOfGarden: 0,
                        hasBanquetHall: false,
                        totalNoOfBanquetHall: 0,
                    },
                ],
            }
        );
    });

    const relationTypeList = ["S/O", "W/O", "D/O", "C/O"];

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
                setIsLoadingGable(true);
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
                } finally {
                    setIsLoadingGable(false);
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
                setIsLoadingGable(true);
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
                    setIsLoadingGable(false);
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
            setIsLoadingGable(true);
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
            setIsLoadingGable(false);
        }
    };

    // -------------------- Validate Holding No --------------------
    const validateHoldingNo = async (holdingNo) => {
        if (!holdingNo) return;

        setIsLoadingGable(true);
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
                    wardMstrId: data.wardMstrId,
                    // newWardMstrId: data.newWardMstrId,
                    address: data?.propAddress,
                    pinCode: data?.propPinCode,
                    ownerDtl: data.owners || prev.ownerDtl,
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    holdingNo: "",
                }));
                setValidationError((prev) => ({
                    ...prev,
                    holdingNo: ["Invalid Holding No"],
                }));
            }
        } catch (error) {
            console.error("Error validating holding no:", error);
        } finally {
            setIsLoadingGable(false);
        }
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

    const handleConnectionChange = (index, field, value) => {
        setFormData((prev) => {
            const updatedConnections = [...prev.connectionDtl];
            updatedConnections[index] = {
            ...updatedConnections[index],
            [field]: value,
            };

            // Reset total field if user unchecks provision
            if (field === "hasRestaurant" && !value) updatedConnections[index].totalNoOfRestaurant = "";
            if (field === "hasGarden" && !value) updatedConnections[index].totalNoOfGarden = "";
            if (field === "hasBanquetHall" && !value) updatedConnections[index].totalNoOfBanquetHall = "";

            if(field==="categoryTypeMasterId" && value != 16){
                updatedConnections[index] = {
                    ...updatedConnections[index],
                    ["hasRestaurant"]: false,
                    ["totalNoOfRestaurant"]: 0,
                    ["hasGarden"]: false,
                    ["totalNoOfGarden"]: 0,
                    ["hasBanquetHall"]: false,
                    ["totalNoOfBanquetHall"]: 0,
                };
            }

            return { ...prev, connectionDtl: updatedConnections };
        });
    };

    const handleAddConnectionRow = () => {
        setFormData((prev) => ({
            ...prev,
            connectionDtl: [
            ...prev.connectionDtl,
            {
                categoryTypeMasterId: "",
                subCategoryTypeMasterId: "",
                totalNoOfHouseAreaRoomTruck: 1,
                hasRestaurant: false,
                totalNoOfRestaurant: 0,
                hasGarden: false,
                totalNoOfGarden: 0,
                hasBanquetHall: false,
                totalNoOfBanquetHall: 0,
            },
            ],
        }));
    };

    const handleRemoveConnectionRow = (index) => {
        setFormData((prev) => ({
            ...prev,
            connectionDtl:
            prev.connectionDtl.length > 1
                ? prev.connectionDtl.filter((_, i) => i !== index)
                : prev.connectionDtl,
        }));
    };

    // -------------------- Submit Handler --------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsFormSubmit(true);
        setIsLoadingGable(true);
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
            setIsLoadingGable(false);
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
        },
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
            charRegex: /^[0-9]$/,
            regex: /^[1-9][0-9]{0,5}$/,
            maxLength: 6,
            required: true,
            placeholder: "Enter Pin",
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
            required: true,
            maxLength: 50,
            sanitize: (v) => v.replace(/[^A-Za-z,.\s]/g, ""),
        },
        {
            name: "relationType",
            label: "Relation",
            type: "select",
            options: relationTypeList,
            required: true,
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
            name: "email",
            label: "Email ID",
            type: "email",
            sanitize: (v) => v.replace(/[^A-Za-z0-9@._-]/g, ""),
        },
    ];

    // Master data is still loading, the global overlay is on screen.
    if (!masterData) return null;

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

            <OwnerDetailsCard
                owners={formData.ownerDtl}
                fields={ownerFields}
                errors={validationError}
                onChange={handleApplicantChange}
                onAdd={handleAddApplicant}
                onRemove={handleRemoveApplicant}
            />
            <ConnectionDetails
                dateOfEffect = {formData?.dateOfEffective}
                connectionDtl={formData.connectionDtl}
                categoryList={masterData?.categoryType|| []}
                onChange={handleConnectionChange}
                onAddRow={handleAddConnectionRow}
                onRemoveRow={handleRemoveConnectionRow}
                onDateOfEffectChange = {handleChange}
                validationError={validationError}
            />
            <div className="text-green-600 text-center">
                Monthly Amount:
                {formData?.connectionDtl?.reduce((acc, curr) => acc + (Number(curr?.rate) || 0), 0).toFixed(2)}
            </div>
            {/* <div className="flex justify-center items-center">
                <LocationPicker onSelect={setLoc} />                
            </div> */}
            <div className="text-center">
                <button
                    type="submit"
                    className={`items-center px-4 py-2 rounded text-white ${
                        isFormSubmit ? "btn-secondary" : "btn-primary"
                    }`}
                    disabled={isFormSubmit}
                >
                    Submit
                </button>
            </div>
        </form>
    );
}

export default AddConsumer;
