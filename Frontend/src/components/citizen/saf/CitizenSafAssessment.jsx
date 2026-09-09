import { Spinner } from "@nextui-org/react";
import { useEffect, useState } from "react";
import PropDtl from "../../../modules/property/component/Saf/PropDtl";
import FloorDtlAdd from "../../../modules/property/component/Saf/FloorDtlAdd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setOwnerDtl } from "../../../store/slices/ownerSlice";
import { setFloorDtl } from "../../../store/slices/floorSlice";
import { applyOwnerDefaults } from "../../../utils/initOwnerDefaults";
import { extractDateYYMM } from "../../../utils/common";
import { fetchCitizenNewWardByOldWard } from "../../../utils/commonFunc";
import PropAddress from "../../../modules/property/component/Saf/PropAddress";
import OwnerDtlAdd from "../../../modules/property/component/Saf/OwnerDtlAdd";
import { validateFormData } from "../../../utils/safAssesmentValidation";
import {
  getApartmentListByOldWardApi,
  propertyTestRequestApi,
  UlbApi,
} from "../../../api/endpoints";
import { useLoading } from "../../../contexts/LoadingContext";
import { setFormData } from "../../../store/slices/assessmentSlice";
import { applyDefaults } from "../../../utils/initDefaultFormFields";
import FormError from "../../common/FormError";
import toast from "react-hot-toast";
import WaterSafPayment from "../../../modules/property/component/Saf/WaterSafPayment";
import SwmConsumerAdd from "../../../modules/property/component/Saf/SwmConsumerAdd";
import { setSwmConsumerDtl } from "../../../store/slices/swmConsumerSlice";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const CitizenSafAssessment = ({
  mstrData,
  isLoading,
  propDetails,
  formType,
}) => {
  const token = useSelector((state) => state.citizenAuth.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { setIsLoadingGable } = useLoading();
  const floorDtl = useSelector((state) => state.floor.floorDtl);
  const ownerDtl = useSelector((state) => state.owner.OwnerDtl);
  const formData = useSelector((state) => state.assessment.formData);
  const swmConsumer = useSelector((state) => state.swmConsumer.swmConsumerDtl);
  const [error, setErrors] = useState({});
  const [newWardList, setNewWardList] = useState([]);
  const [newWardLoading, setNewWardLoading] = useState(false);
  const [apartmentList, setApartmentList] = useState([]);
  const [disabledFields, setDisabledFields] = useState({});

  useEffect(() => {
    if (ulbId) {
      fetchUlbInfo(ulbId);
    }
  }, [ulbId]);

  const fetchUlbInfo = async (ulbId) => {
    if (!ulbId) return;
    try {
      const res = await axios.post(UlbApi.replace("{id}", ulbId), {});
      if (res.data.status) {
        const { city, district, state } = res.data.data || {};
        const updatedData = {
          ...formData,
          propCity: city,
          propDist: district,
          propState: state,
        };

        // Pass the OBJECT, not a function
        dispatch(setFormData(updatedData));
        setDisabledFields((prev) => ({
          ...prev,
          propCity: true,
          propDist: true,
          propState: true,
        }));
      }
    } catch (error) {
      console.error("Error fetching ULb info:", error);
    }
  };

  useEffect(() => {
    const savedFloorDtl = localStorage.getItem("floorDtl");
    if (savedFloorDtl) setFloorDtl(JSON.parse(savedFloorDtl));

    const updatedFormData = applyDefaults(formData);
    dispatch(setFormData(updatedFormData));
    if (ownerDtl.length > 0) {
      dispatch(setOwnerDtl(applyOwnerDefaults(ownerDtl)));
    }

    // To set disabled fields
    setDiabledFields();
  }, []);

  useEffect(() => {
    if (formData.wardMstrId) {
      fetchWardMaster();
    }
  }, [formData.wardMstrId]);

  async function fetchWardMaster() {
    const newWardMstrId = await fetchCitizenNewWardByOldWard(
      formData.wardMstrId,
      token
    );
    setNewWardList(newWardMstrId);
  }

  function setDiabledFields() {
    const fieldMap = {};

    for (const key in formData) {
      const value = formData[key];
      if (
        value === "" ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0)
      ) {
        fieldMap[key] = false;
      }

      // ✅ If value is array of objects (e.g., owners, floors)
      else if (Array.isArray(value) && typeof value[0] === "object") {
        const objectWiseMap = value.map((item) => {
          const fieldStatus = {};
          for (const field in item) {
            fieldStatus[field] = !!item[field];
          }
          return fieldStatus;
        });

        fieldMap[key] = objectWiseMap;
      }

      // ✅ All other primitive fields
      else {
        fieldMap[key] = !!value;
      }
    }

    setDisabledFields(fieldMap);
  }

  const handleFloorDtlUpdate = (updated) => {
    dispatch(setFloorDtl(updated));
  };

  const handleSwmConsumerUpdate = (updated) => {
    dispatch(setSwmConsumerDtl(updated));
  };

  const handleOwnerDtlUpdate = (updated) => {
    dispatch(setOwnerDtl(updated));
  };

  const getApartment = async () => {
    setIsLoadingGable(true);
    try {
      const response = await axios.post(
        getApartmentListByOldWardApi,
        { oldWardId: formData?.wardMstrId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.status === true) {
        setApartmentList(response.data.data);
      }
    } catch (error) {
      // console.error("getApartment", error);
    } finally {
      setIsLoadingGable(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const updatedValue = type === "checkbox" ? checked : value;

    // Reset dependent fields when toggled to false
    if (name === "isMobileTower" && updatedValue === false) {
      dispatch(
        setFormData({
          isMobileTower: false,
          towerArea: "",
          towerInstallationDate: "",
        })
      );
      return;
    }
    if (name === "isHoardingBoard" && updatedValue === false) {
      dispatch(
        setFormData({
          isHoardingBoard: false,
          hoardingArea: "",
          hoardingInstallationDate: "",
        })
      );
      return;
    }
    if (name === "isPetrolPump" && updatedValue === false) {
      dispatch(
        setFormData({
          isPetrolPump: false,
          underGroundArea: "",
          petrolPumpCompletionDate: "",
        })
      );
      return;
    }
    if (name === "isWaterHarvesting" && updatedValue === false) {
      dispatch(
        setFormData({
          isWaterHarvesting: false,
          waterHarvestingDate: "",
        })
      );
      return;
    }

    dispatch(setFormData({ [name]: updatedValue }));

    dispatch(setFormData({ [name]: updatedValue }));
    if (name == "propTypeMstrId" && updatedValue != 4) {
      dispatch(setFormData({ hasSwm: false }));
    }

    if (name === "wardMstrId") {
      setNewWardLoading(true);
      dispatch(setFormData({ [name]: updatedValue }));
      dispatch(setFormData({ newWardMstrId: "" }));
      try {
        const newWardMstrId = await fetchCitizenNewWardByOldWard(
          updatedValue,
          token
        );
        setNewWardList(newWardMstrId);
      } catch (error) {
        console.error("Failed to fetch new ward:", error);
      } finally {
        setNewWardLoading(false);
      }
      return;
    }
    if (name === "isCorrAddDiffer") {
      dispatch(setFormData({ isCorrAddDiffer: checked ? 1 : 0 }));
    }

    if (name === "propTypeMstrId" && updatedValue == 1) {
      getApartment();
    }

    const errorMessage = validateFormData(name, updatedValue, formData);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  useEffect(() => {
    if (formData.propTypeMstrId == 1) getApartment();
  }, [formData.propTypeMstrId]);

  if (isLoading)
    return (
      <div className="loading">
        <Spinner />
      </div>
    );

  const handlePreviewFormData = async (e) => {
    e.preventDefault();
    const previewUrl = "/citizen/saf/preview";
    const { id, owners, floors, taxDtl, tranDtls, userPermission, ...rest } =
      formData;
    const payload = {
      ...rest,
      id: id,
      previousHoldingId: id,
      ulbId: ulbId,
    };

    const floorPayload = floorDtl.map((floor) => ({
      ...floor,
      propFloorDetailId: floor.id,
    }));

    if (formType) {
      const assessmentType = formType === "edit" ? "newAssessment" : formType;
      payload.assessmentType = assessmentType
        // insert space before uppercase letters
        .replace(/([A-Z])/g, " $1")
        // trim leading/trailing spaces
        .trim()
        // capitalize each word
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    try {
      const response = await axios.post(
        propertyTestRequestApi,

        {
          ...payload,
          newWardMstrId: "",
          ownerDtl,
          floorDtl: floorPayload,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status) {
        toast.success("Data saved successfully", { position: "top-right" });
        navigate(previewUrl, {
          state: {
            formData: payload,
            ownerDtl,
            floorDtl: floorPayload,
            mstrData,
            newWardList,
            apartmentList,
            swmConsumer,
            formType: formType,
          },
        });
      } else {
        if (response.data.errors) {
          // Set errors for each field
          setErrors((prev) => ({
            ...prev,
            ...response.data.errors,
          }));
          // Flatten and join all error messages
          const errorMessages = Object.values(response.data.errors)
            .flat()
            .join("\n");
          toast.error(errorMessages, { duration: 8000 });
        } else {
          toast.error(response?.data?.message);
        }
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (!propDetails) return;

    dispatch(setFormData(propDetails));
    dispatch(setOwnerDtl(propDetails.owners));

    propDetails.floors &&
      dispatch(
        setFloorDtl(
          propDetails.floors.map((floor) => ({
            ...floor,
            dateFrom: extractDateYYMM(floor.dateFrom),
          }))
        )
      );

    // eslint-disable-next-line
  }, [propDetails]);

  if (isLoading) {
    return (
      <div className="loading">
        <Spinner />
      </div>
    );
  }

  console.log("Rendering CitizenSafAssessment with formData:", formData);

  return (
    <div className="container-fluid">
      <form className="flex flex-col gap-4" onSubmit={handlePreviewFormData}>
        <div className="items-center gap-2 grid grid-cols-1 md:grid-cols-4 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
          <div>
            <label htmlFor="zoneMstrId" className="block font-medium text-sm">
              Circle <span className="text-red-500">*</span>
            </label>
            <select
              id="zoneMstrId"
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="zoneMstrId"
              value={formData.zoneMstrId}
              onChange={handleInputChange}
              disabled={
                pathname.includes(formType) && disabledFields?.zoneMstrId
              }
              required
            >
              <option value="">Select Circle</option>
              {mstrData?.zoneType?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.zoneName}
                </option>
              ))}
            </select>

            {error?.zoneMstrId && (
              <FormError name="zoneMstrId" errors={error} />
            )}
          </div>

          <div>
            <label htmlFor="wardMstrId" className="block font-medium text-sm">
              Ward No <span className="text-red-500">*</span>
            </label>
            <select
              id="wardMstrId"
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="wardMstrId"
              required
              value={formData.wardMstrId}
              onChange={handleInputChange}
              disabled={
                pathname.includes(formType) && disabledFields?.wardMstrId
              }
            >
              <option value="">Select Ward</option>
              {mstrData?.wardList.map((ward, index) => (
                <option key={index} value={ward.id}>
                  {ward.wardNo}
                </option>
              ))}
            </select>

            <FormError name="wardMstrId" errors={error} />
          </div>
          <div>
            <label
              htmlFor="ownershipTypeMstrId"
              className="block font-medium text-sm"
            >
              Ownership Type <span className="text-red-500">*</span>
            </label>
            <select
              id="ownershipTypeMstrId"
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="ownershipTypeMstrId"
              required
              value={formData.ownershipTypeMstrId}
              onChange={handleInputChange}
              disabled={
                pathname.includes(formType) &&
                disabledFields?.ownershipTypeMstrId
              }
            >
              <option>Select Ownership Type</option>
              {mstrData?.ownershipType.map((ownershipType, index) => (
                <option key={index} value={ownershipType.id}>
                  {ownershipType.ownershipType}
                </option>
              ))}
            </select>
            {error?.ownershipTypeMstrId && (
              <span className="text-red-500">{error.ownershipTypeMstrId}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="propTypeMstrId"
              className="block font-medium text-sm"
            >
              Property Type <span className="text-red-500">*</span>
            </label>
            <select
              id="propTypeMstrId"
              required
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="propTypeMstrId"
              value={formData.propTypeMstrId}
              onChange={handleInputChange}
              disabled={
                pathname.includes(formType) && disabledFields?.propTypeMstrId
              }
            >
              <option value="">Select Property Type</option>
              {mstrData?.propertyType.map((propertyType, index) => (
                <option key={index} value={propertyType.id}>
                  {propertyType.propertyType}
                </option>
              ))}
            </select>
            <FormError name="propTypeMstrId" errors={error} />
          </div>

          {[3, 4].includes(Number(formData?.propTypeMstrId)) && (
            <div className="">
              <label
                htmlFor="landOccupationDate"
                className="block font-medium text-sm"
              >
                Date of Possession / Purchase / Acquisition (Whichever is
                earlier){" "}
                {formData?.propTypeMstrId == 4 && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="date"
                id="landOccupationDate"
                name="landOccupationDate"
                placeholder="..."
                value={formData.landOccupationDate}
                required={formData?.propTypeMstrId == 4}
                onChange={handleInputChange}
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              />
              {error?.landOccupationDate && (
                <FormError name="landOccupationDate" errors={error} />
              )}
            </div>
          )}

          {formData.propTypeMstrId == 1 && (
            <div>
              <label
                htmlFor="appartmentDetailsId"
                className="block font-medium text-sm"
              >
                Appartment Name <span className="text-red-500">*</span>
              </label>
              <select
                id="appartmentDetailsId"
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                name="appartmentDetailsId"
                value={formData.appartmentDetailsId}
                required={formData.propTypeMstrId == 1}
                onChange={handleInputChange}
                disabled={
                  pathname.includes(formType) &&
                  disabledFields?.appartmentDetailsId
                }
              >
                <option value="">Select Appartment</option>
                {apartmentList.map((item, index) => (
                  <option
                    key={index}
                    value={item.id}
                    data-item={item?.isWaterHarvesting}
                  >
                    {item.apartmentName}
                  </option>
                ))}
              </select>
              <FormError name="appartmentDetailsId" errors={error} />
            </div>
          )}

          {formData.propTypeMstrId == 1 && (
            <div>
              <label
                htmlFor="flatRegistryDate"
                className="block font-medium text-sm"
              >
                Flat Registry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="flatRegistryDate"
                name="flatRegistryDate"
                required={formData.propTypeMstrId == 1}
                value={formData.flatRegistryDate}
                onChange={handleInputChange}
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                disabled={
                  pathname.includes(formType) &&
                  disabledFields?.flatRegistryDate
                }
              />
              {error?.flatRegistryDate && (
                <FormError name="flatRegistryDate" errors={error} />
              )}
            </div>
          )}

          {formType === "mutation" ? (
            <>
              <div>
                <label
                  htmlFor="transferMode"
                  className="block font-medium text-sm"
                >
                  Mode of Ownership Transfer{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="transferMode"
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  name="transferModeMstrId"
                  required
                  value={formData.transferModeMstrId}
                  onChange={handleInputChange}
                  disabled={
                    pathname.includes(formType) &&
                    disabledFields?.transferModeMstrId
                  }
                >
                  <option value="">Mode Of Transfer</option>
                  {mstrData?.transferMode.map((mode, index) => (
                    <option key={index} value={mode.id}>
                      {mode.transferMode}
                    </option>
                  ))}
                </select>
                {error?.transferModeMstrId && (
                  <FormError name="transferModeMstrId" errors={error} />
                )}
              </div>

              <div>
                <label
                  htmlFor="percentageOfPropertyTransfer"
                  className="block font-medium text-sm"
                >
                  Property Transfer (0-100%){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="percentageOfPropertyTransfer"
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  name="percentageOfPropertyTransfer"
                  required
                  value={formData.percentageOfPropertyTransfer}
                  onChange={handleInputChange}
                  disabled={
                    pathname.includes(formType) &&
                    disabledFields?.percentageOfPropertyTransfer
                  }
                />

                {error?.percentageOfPropertyTransfer && (
                  <FormError name="transferModeMstrId" errors={error} />
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Owner Details START HERE */}
        <OwnerDtlAdd
          strData={mstrData}
          error={error}
          setErrors={setErrors}
          ownerDtl={ownerDtl || []}
          setOwnerDtl={handleOwnerDtlUpdate}
          isDisabled={pathname.includes("reassessment")}
          disabledFields={disabledFields?.owners || []}
          isSingleOwner={formData.ownershipTypeMstrId == 1}
        />
        {/* OWNER DETAILS END HERE */}

        {/* ELECTRICITY DETAILS START HERE */}
        <div className="flex flex-col gap-2 text-gray-700 text-lg electricity_details_container">
          <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
            Electricity Details
          </h2>
          <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
            <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
              <div className="">
                <label
                  htmlFor="electConsumerNo"
                  className="block font-medium text-sm"
                >
                  Electricity K. No
                </label>
                <input
                  type="text"
                  id="electConsumerNo"
                  name="electConsumerNo"
                  placeholder="xxxx xxxx xxxx"
                  value={formData.electConsumerNo}
                  onChange={(e) => {
                    // Only allow letters and digits
                    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    handleInputChange({
                      target: {
                        name: "electConsumerNo",
                        value: val,
                        type: "text",
                      },
                    });
                  }}
                  autoComplete="off"
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                />
                {error?.electConsumerNo && (
                  <FormError name="electConsumerNo" errors={error} />
                )}
              </div>

              <div className="">
                <label
                  htmlFor="electAccNo"
                  className="block font-medium text-sm"
                >
                  ACC No
                </label>
                <input
                  type="text"
                  id="electAccNo"
                  name="electAccNo"
                  placeholder="xxxx xxxx xxxx"
                  value={formData.electAccNo}
                  onChange={(e) => {
                    // Only allow digits
                    const val = e.target.value.replace(/\D/g, "");
                    handleInputChange({
                      target: {
                        name: "electAccNo",
                        value: val,
                        type: "text",
                      },
                    });
                  }}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                />
                {error?.electAccNo && (
                  <FormError name="electAccNo" errors={error} />
                )}
              </div>

              <div className="">
                <label
                  htmlFor="electBindBookNo"
                  className="block font-medium text-sm"
                >
                  BIND/BOOK No.
                </label>
                <input
                  type="text"
                  id="electBindBookNo"
                  name="electBindBookNo"
                  placeholder="xxxx xxxx xxxx"
                  value={formData.electBindBookNo}
                  onChange={handleInputChange}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                />
                {error?.electBindBookNo && (
                  <FormError name="electBindBookNo" errors={error} />
                )}
              </div>

              <div className="">
                <label
                  htmlFor="electConsCategory"
                  className="block font-medium text-sm"
                >
                  Electricity Consumer Category{" "}
                </label>
                <select
                  id="electConsCategory"
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  name="electConsCategory"
                  value={formData.electConsCategory}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {mstrData?.electricityType?.map((item, index) => {
                    return (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    );
                  })}
                </select>
                {error?.electConsCategory && (
                  <FormError name="electConsCategory" errors={error} />
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ELECTRICITY DETAILS END HERE HERE */}

        {/* PROPERTY DETAILS START HERE */}
        <PropDtl
          mstrData={mstrData}
          formData={formData}
          error={error}
          handleInputChange={handleInputChange}
          isDisabled={pathname.includes(formType)}
          disabledFields={disabledFields || {}}
        />
        {/* PROPERTY DETAILS END HERE HERE */}

        {/* PROPERTY ADDRESS START HERE */}
        <PropAddress
          formData={formData}
          error={error}
          handleInputChange={handleInputChange}
          isDisabled={pathname.includes(formType)}
          disabledFields={disabledFields}
        />
        {/* PROPERTY ADDRESS END HERE */}

        {/* FLOOR DETAILS START HERE */}
        {!(formData.propTypeMstrId == 4) &&
          disabledFields?.propTypeMstrId !== "" && (
            <FloorDtlAdd
              mstrData={mstrData}
              formData={formData}
              error={error}
              setErrors={setErrors}
              floorDtl={floorDtl}
              setFloorDtl={handleFloorDtlUpdate}
              isDisabled={pathname.includes("mutation")}
              disabledFields={disabledFields?.floors}
            />
          )}
        {/* FLOOR DETAILS END HERE */}

        {/* SWM */}
        {formType == "new assessment" && formData?.propTypeMstrId != 4 && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSwm"
              name="hasSwm"
              checked={formData.hasSwm}
              onChange={handleInputChange}
              className="border-gray-300 rounded w-4 h-4 text-indigo-600"
            />
            <label
              htmlFor="hasSwm"
              className="block ml-2 text-yellow-600 text-sm"
            >
              If Swm Consumer
            </label>
          </div>
        )}
        {formData.hasSwm && (
          <SwmConsumerAdd
            masterData={mstrData}
            error={error}
            setErrors={setErrors}
            swmConsumer={swmConsumer || []}
            setSwmConsumer={handleSwmConsumerUpdate}
          />
        )}
        {/* SWM End */}

        <WaterSafPayment
          mstrData={mstrData}
          formData={formData}
          error={error}
          handleInputChange={handleInputChange}
        />

        {/* MOBILE TOWER CONTAINER START HERE */}
        <div className="mobile_petrol_details_container">
          <div className="gap-4 grid grid-cols-3">
            <div className="">
              <label
                htmlFor="isMobileTower"
                className="block font-medium text-sm"
              >
                Does Property Have Mobile Tower(s) ?{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="isMobileTower"
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                name="isMobileTower"
                value={formData.isMobileTower ?? false}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "isMobileTower",
                      value: e.target.value === "true",
                      type: "select",
                    },
                  })
                }
              >
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
              {error?.isMobileTower && (
                <FormError name="isMobileTower" errors={error} />
              )}
            </div>

            {formData.isMobileTower && (
              <>
                <div className="">
                  <label
                    htmlFor="towerArea"
                    className="block font-medium text-sm"
                  >
                    Total Area Covered by Mobile Tower & its Supporting
                    Equipments & Accessories (in Sq. Ft.)
                  </label>
                  <input
                    type="text"
                    id="towerArea"
                    name="towerArea"
                    required={formData.isMobileTower}
                    placeholder="Eg...200 SQMTR"
                    value={formData.towerArea}
                    onChange={handleInputChange}
                    className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  />
                  {error?.towerArea && (
                    <FormError name="towerArea" errors={error} />
                  )}
                </div>

                <div className="">
                  <label
                    htmlFor="towerInstallationDate"
                    className="block font-medium text-sm"
                  >
                    Date of Installation of Mobile Tower{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="towerInstallationDate"
                    name="towerInstallationDate"
                    placeholder="..."
                    value={formData.towerInstallationDate}
                    required={formData.isMobileTower}
                    onChange={handleInputChange}
                    className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  />
                  {error?.towerInstallationDate && (
                    <FormError name="towerInstallationDate" errors={error} />
                  )}
                </div>
              </>
            )}

            <div className="">
              <label
                htmlFor="isHoardingBoard"
                className="block font-medium text-sm"
              >
                Does Property Have Hoarding Board(s) ?{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="isHoardingBoard"
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                name="isHoardingBoard"
                value={formData.isHoardingBoard}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "isHoardingBoard",
                      value: e.target.value === "true",
                      type: "select",
                    },
                  })
                }
              >
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
              {error?.isHoardingBoard && (
                <FormError name="isHoardingBoard" errors={error} />
              )}
            </div>

            {formData.isHoardingBoard && (
              <>
                <div className="">
                  <label
                    htmlFor="hoardingArea"
                    className="block font-medium text-sm"
                  >
                    Total Area of Wall / Roof / Land (in Sq. Ft.){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="hoardingArea"
                    name="hoardingArea"
                    required={formData.isHoardingBoard}
                    placeholder="..."
                    value={formData.hoardingArea}
                    onChange={handleInputChange}
                    className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  />
                  {error?.hoardingArea && (
                    <FormError name="hoardingArea" errors={error} />
                  )}
                </div>

                <div className="">
                  <label
                    htmlFor="hoardingInstallationDate"
                    className="block font-medium text-sm"
                  >
                    Date of Installation of Hoarding Board(s){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="hoardingInstallationDate"
                    name="hoardingInstallationDate"
                    required={formData.isHoardingBoard}
                    value={formData.hoardingInstallationDate}
                    onChange={handleInputChange}
                    className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  />
                  {error?.hoardingInstallationDate && (
                    <FormError name="hoardingInstallationDate" errors={error} />
                  )}
                </div>
              </>
            )}
            {/* MOBILE TOWER CONTAINER END HERE */}

            <div className="">
              <label
                htmlFor="isPetrolPump"
                className="block font-medium text-sm"
              >
                Is property a Petrol Pump ?{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="isPetrolPump"
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                name="isPetrolPump"
                value={formData.isPetrolPump}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "isPetrolPump",
                      value: e.target.value === "true",
                      type: "select",
                    },
                  })
                }
              >
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
              {error?.isPetrolPump && (
                <FormError name="isPetrolPump" errors={error} />
              )}
            </div>

            {formData.isPetrolPump && (
              <>
                <div className="">
                  <label
                    htmlFor="underGroundArea"
                    className="block font-medium text-sm"
                  >
                    Underground Storage Area (in Sq. Ft.){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="underGroundArea"
                    name="underGroundArea"
                    required={formData.isPetrolPump}
                    placeholder="..."
                    value={formData.underGroundArea}
                    onChange={handleInputChange}
                    className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  />
                  {error?.underGroundArea && (
                    <FormError name="underGroundArea" errors={error} />
                  )}
                </div>

                <div className="">
                  <label
                    htmlFor="petrolPumpCompletionDate"
                    className="block font-medium text-sm"
                  >
                    Completion Date of Petrol Pump{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="petrolPumpCompletionDate"
                    name="petrolPumpCompletionDate"
                    required={formData.isPetrolPump}
                    value={formData.petrolPumpCompletionDate}
                    onChange={handleInputChange}
                    className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  />
                  {error?.petrolPumpCompletionDate && (
                    <FormError name="petrolPumpCompletionDate" errors={error} />
                  )}
                </div>
              </>
            )}

            <div className="">
              <label
                htmlFor="isWaterHarvesting"
                className="block font-medium text-sm"
              >
                Rainwater harvesting provision ?{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="isWaterHarvesting"
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                name="isWaterHarvesting"
                value={formData.isWaterHarvesting}
                onChange={(e) =>
                  handleInputChange({
                    target: {
                      name: "isWaterHarvesting",
                      value: e.target.value === "true",
                      type: "select",
                    },
                  })
                }
              >
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
              {error?.isWaterHarvesting && (
                <FormError name="isWaterHarvesting" errors={error} />
              )}
            </div>

            {formData.isWaterHarvesting && (
              <div className="">
                <label
                  htmlFor="waterHarvestingDate"
                  className="block font-medium text-sm"
                >
                  Completion Date of Rain Water Harvesting
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="waterHarvestingDate"
                  name="waterHarvestingDate"
                  required={formData.isWaterHarvesting}
                  value={formData.waterHarvestingDate}
                  onChange={handleInputChange}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                />
                {error?.waterHarvestingDate && (
                  <FormError name="waterHarvestingDate" errors={error} />
                )}
              </div>
            )}

            {formData?.propTypeMstrId == 4 && (
              <div className="">
                <label
                  htmlFor="landOccupationDate"
                  className="block font-medium text-sm"
                >
                  Date of Possession / Purchase / Acquisition (Whichever is
                  earlier){" "}
                  {formData?.propTypeMstrId == 4 && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="date"
                  id="landOccupationDate"
                  name="landOccupationDate"
                  placeholder="..."
                  value={formData.landOccupationDate}
                  required={formData?.propTypeMstrId == 4}
                  onChange={handleInputChange}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                />
                {error?.landOccupationDate && (
                  <FormError name="landOccupationDate" errors={error} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="items-center px-4 py-2 rounded text-white btn-primary"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitizenSafAssessment;
