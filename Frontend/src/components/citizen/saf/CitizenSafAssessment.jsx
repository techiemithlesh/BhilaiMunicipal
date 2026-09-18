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

    if (name === "propTypeMstrId" && updatedValue == 3) {
      getApartment();
    }

    const errorMessage = validateFormData(name, updatedValue, formData);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  useEffect(() => {
    if (formData.propTypeMstrId == 3) getApartment();
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
            <label htmlFor="applicationFrom" className="block font-medium text-sm">
              Application Type <span className="text-red-500">*</span>
            </label>
            <select
              id="applicationFrom"
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="applicationFrom"
              required
              value={formData.applicationFrom}
              onChange={handleInputChange}
              disabled={
                pathname.includes(formType) && disabledFields?.applicationFrom
              }
            >
              <option value="">Select Application Type</option>
              {mstrData?.applicationType?.map((appType, index) => (
                <option key={index} value={appType}>
                  {appType}
                </option>
              ))}
            </select>
            <FormError name="applicationFrom" errors={error} />
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

          {formData.propTypeMstrId == 3 && (
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
                required={formData.propTypeMstrId == 3}
                onChange={handleInputChange}
                disabled={
                  pathname.includes(formType) &&
                  disabledFields?.appartmentDetailsId
                }
              >
                <option value="">Select Appartment</option>
                {apartmentList.map((item, index) => (
                  <option key={index} value={item.id}>
                    {item.apartmentName}
                  </option>
                ))}
              </select>
              <FormError name="appartmentDetailsId" errors={error} />
            </div>
          )}

          <div className="">
            <label
              htmlFor="roadTypeMstrId"
              className="block font-medium text-sm"
            >
              Road Type <span className="text-red-500">*</span>
            </label>
            <select
              id="roadTypeMstrId"
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="roadTypeMstrId"
              required
              value={formData.roadTypeMstrId}
              onChange={handleInputChange}
              disabled={
                pathname.includes(formType) && disabledFields?.roadTypeMstrId
              }
            >
              <option value="">Select Road Type</option>
              {mstrData?.roadType.map((item, index) => (
                <option key={index} value={item.id}>
                  {item.roadType}
                </option>
              ))}
            </select>
            {error?.roadTypeMstrId && (
              <FormError name="roadTypeMstrId" errors={error} />
            )}
          </div>

          <div className="">
            <div className="flex items-center space-x-2 mt-4 py-2">
              <label
                htmlFor="isBpl"
                className="text-sm font-normal text-gray-700"
              >
                Is BPL Category ?
              </label>
              <input
                type="checkbox"
                id="isBpl"
                name="isBpl"
                checked={formData.isBpl || false}
                onChange={(e) => {
                  handleInputChange({
                    target: {
                      name: "isBpl",
                      value: e.target.checked,
                    },
                  });
                }}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                disabled={disabledFields?.isBpl}
              />
            </div>
            {error?.isBpl && (
              <span className="text-red-500 text-xs mt-1 block">
                {error?.isBpl}
              </span>
            )}
          </div>

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

        {/* MOBILE TOWER CONTAINER START HERE */}
        <div className="mobile_petrol_details_container bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
                disabled={disabledFields?.isMobileTower}
              >
                <option value={false}>No</option>
                <option value={true}>Yes</option>
              </select>
              {error?.isMobileTower && (
                <FormError name="isMobileTower" errors={error} />
              )}
            </div>

            {formData.isMobileTower && (
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
                  placeholder=""
                  value={formData.towerInstallationDate || ""}
                  required={formData.isMobileTower}
                  onChange={handleInputChange}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                />
                {error?.towerInstallationDate && (
                  <FormError name="towerInstallationDate" errors={error} />
                )}
              </div>
            )}
            {/* MOBILE TOWER CONTAINER END HERE */}
          </div>

          {/* CHECKBOXES */}

          <ul className="list-disc pl-5 mt-4">
            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isWidow"
                    className="text-sm font-normal text-gray-700"
                  >
                    Does Property belongs to Widow/Abandoment/Mentally
                    Disable/Visually Impaired? If Yes Than Check
                  </label>

                  <input
                    type="checkbox"
                    id="isWidow"
                    name="isWidow"
                    checked={formData.isWidow || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isWidow",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isWidow}
                  />
                </div>

                {error?.isWidow && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isWidow}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isExArmy"
                    className="text-sm font-normal text-gray-700"
                  >
                    Does Property belongs with name of Ex-Army? And have Income
                    Tax Exempted From GOVT. If Yes Than Check
                  </label>

                  <input
                    type="checkbox"
                    id="isExArmy"
                    name="isExArmy"
                    checked={formData.isExArmy || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isExArmy",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isExArmy}
                  />
                </div>

                {error?.isExArmy && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isExArmy}
                  </span>
                )}
              </div>
            </li>
            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isDisabledPerson"
                    className="text-sm font-normal text-gray-700"
                  >
                    Does Property belong to Physically Disable? If Yes Than
                    Check
                  </label>

                  <input
                    type="checkbox"
                    id="isDisabledPerson"
                    name="isDisabledPerson"
                    checked={formData.isDisabledPerson || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isDisabledPerson",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isDisabledPerson}
                  />
                </div>

                {error?.isDisabledPerson && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isDisabledPerson}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isOldProperty"
                    className="text-sm font-normal text-gray-700"
                  >
                    Old Property waived Off
                  </label>
                  <input
                    type="checkbox"
                    id="isOldProperty"
                    name="isOldProperty"
                    checked={formData.isOldProperty || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isOldProperty",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isOldProperty}
                  />
                </div>

                {error?.isOldProperty && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isOldProperty}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isDp"
                    className="text-sm font-normal text-gray-700"
                  >
                    If Property belongs to IHSDP? If Yes Than Check
                  </label>
                  <input
                    type="checkbox"
                    id="isDp"
                    name="isDp"
                    checked={formData.isDp || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isDp",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isDp}
                  />
                </div>

                {error?.isDp && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isDp}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isSchool"
                    className="text-sm font-normal text-gray-700"
                  >
                    If School? If Yes Than Check
                  </label>
                  <input
                    type="checkbox"
                    id="isSchool"
                    name="isSchool"
                    checked={formData.isSchool || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isSchool",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isSchool}
                  />
                </div>

                {error?.isSchool && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isSchool}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isComplex"
                    className="text-sm font-normal text-gray-700"
                  >
                    If Complex? If Yes Than Check
                  </label>
                  <input
                    type="checkbox"
                    id="isComplex"
                    name="isComplex"
                    checked={formData.isComplex || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isComplex",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isComplex}
                  />
                </div>

                {error?.isComplex && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isComplex}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isChabutra"
                    className="text-sm font-normal text-gray-700"
                  >
                    If Chabutra? If Yes Than Check
                  </label>
                  <input
                    type="checkbox"
                    id="isChabutra"
                    name="isChabutra"
                    checked={formData.isChabutra || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isChabutra",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isChabutra}
                  />
                </div>

                {error?.isChabutra && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isChabutra}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isShopHolding"
                    className="text-sm font-normal text-gray-700"
                  >
                    If Holding Belongs To Shop? If Yes Than Check
                  </label>
                  <input
                    type="checkbox"
                    id="isShopHolding"
                    name="isShopHolding"
                    checked={formData.isShopHolding || false}
                    onChange={(e) => {
                      handleInputChange({
                        target: {
                          name: "isShopHolding",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={disabledFields?.isShopHolding}
                  />
                </div>

                {error?.isShopHolding && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {error?.isShopHolding}
                  </span>
                )}
              </div>
            </li>
          </ul>

          {/* CHECKBOXES END HERE */}
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
