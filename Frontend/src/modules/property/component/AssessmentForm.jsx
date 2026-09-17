import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "@nextui-org/react";
import { useEffect, useState } from "react";
import PropAddress from "./Saf/PropAddress";
import PropDtl from "./Saf/PropDtl";
import OwnerDtlAdd from "./Saf/OwnerDtlAdd";
import FloorDtlAdd from "./Saf/FloorDtlAdd";
import { validateFormData } from "../../../utils/safAssesmentValidation";
import {
  getApartmentListByOldWardApi,
  propertyTestRequestApi,
  UlbApi,
  updateSafApplicationApi,
} from "../../../api/endpoints";
import { useLoading } from "../../../contexts/LoadingContext";
import { setFormData } from "../../../store/slices/assessmentSlice";
import { setOwnerDtl } from "../../../store/slices/ownerSlice";
import { setFloorDtl } from "../../../store/slices/floorSlice";
import { setSwmConsumerDtl } from "../../../store/slices/swmConsumerSlice";
import { applyDefaults } from "../../../utils/initDefaultFormFields";
import { applyOwnerDefaults } from "../../../utils/initOwnerDefaults";
import FormError from "../../../components/common/FormError";
import { formatYearMonth } from "../../../utils/common";
import toast from "react-hot-toast";
import { getUserDetails } from "../../../utils/auth";

const AssessmentForm = ({
  mstrData,
  isLoading,
  propDetails,
  formType,
  token,
  isEdit,
  ulbId,
}) => {
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
  const [apartmentList, setApartmentList] = useState([]);
  const [disabledFields, setDisabledFields] = useState({});
  const [isFormSubmit, setIsFormSubmit] = useState(false);

  const ulbIdL = getUserDetails()?.ulbId;

  useEffect(() => {
    if (ulbIdL) {
      fetchUlbInfo(ulbIdL);
    }
  }, [ulbIdL]);

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
      } else if (Array.isArray(value) && typeof value[0] === "object") {
        const objectWiseMap = value.map((item) => {
          const fieldStatus = {};
          for (const field in item) {
            fieldStatus[field] = !!item[field];
          }
          return fieldStatus;
        });

        fieldMap[key] = objectWiseMap;
      } else {
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
        { oldWardId: formData?.wardMstrId, ulbId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data.status === true) {
        setApartmentList(response.data.data);
      }
    } catch (error) {
      console.error("getApartment", error);
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
        }),
      );
      return;
    }
    if (name === "isHoardingBoard" && updatedValue === false) {
      dispatch(
        setFormData({
          isHoardingBoard: false,
          hoardingInstallationDate: "",
        }),
      );
      return;
    }
    if (name === "isPetrolPump" && updatedValue === false) {
      dispatch(
        setFormData({
          isPetrolPump: false,
          petrolPumpCompletionDate: "",
        }),
      );
      return;
    }
    if (name === "isWaterHarvesting" && updatedValue === false) {
      dispatch(
        setFormData({
          isWaterHarvesting: false,
          waterHarvestingDate: "",
        }),
      );
      return;
    }

    dispatch(setFormData({ [name]: updatedValue }));
    if (name == "propTypeMstrId" && updatedValue != 4) {
      dispatch(setFormData({ hasSwm: false }));
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

  const handlePreviewFormData = async (e) => {
    e.preventDefault();

    const { id, owners, floors, taxDtl, tranDtls, userPermission, ...rest } =
      formData;
    const payload = {
      ...rest,
      previousHoldingId: id,
      assessmentType: formType,
      ulbId: ulbId,
    };

    const floorPayload = floorDtl.map((floor) => {
      const { id, ...rest } = floor;

      if (floor.propertyDetailId) {
        return {
          ...rest,
          propFloorDetailId: id,
        };
      }

      return rest;
    });

    setIsLoadingGable(true);
    try {
      if (isEdit) {
        const response = await axios.post(
          updateSafApplicationApi,
          {
            id: formData.id,
            ...payload,
            ownerDtl,
            floorDtl: floorPayload,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.status) {
          toast.success("Application updated successfully!", {
            position: "top-right",
          });
          navigate(`/saf/wf/inbox/${formData.id}`);
        } else {
          toast.error(response.data.message || "Update failed");
        }
      } else {
        const previewUrl = `/property/apply/preview`;
        const swmDetails = formData?.hasSwm ? swmConsumer : [];
        const response = await axios.post(
          propertyTestRequestApi,
          {
            ...payload,
            ownerDtl,
            floorDtl: floorPayload,
            swmConsumer: swmDetails,
            ulbId,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data.status) {
          toast.success("Data Saved Successfully!", { position: "top-right" });
          navigate(previewUrl, {
            state: {
              formData: payload,
              ownerDtl,
              floorDtl: floorPayload,
              mstrData,
              apartmentList,
              swmConsumer: swmDetails,
            },
          });
        } else if (response.data.errors) {
          const errorMessages = Object.values(response.data.errors)
            .flat()
            .join("\n");
          toast.error(errorMessages, { duration: 8000 });
          setErrors((prev) => ({ ...prev, ...response.data.errors }));
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoadingGable(false);
    }
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
            dateFrom: formatYearMonth(floor.dateFrom),
          })),
        ),
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

  console.log("formData", formData);
  console.log("mstrData", mstrData);

  return (
    <div className="container-fluid">
      <form className="flex flex-col gap-4" onSubmit={handlePreviewFormData}>
        <div className="items-center gap-2 grid grid-cols-1 md:grid-cols-3 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
          <div>
            <label htmlFor="applicationFrom" className="block font-medium text-sm">
              Application Type <span className="text-red-400 text-sm">*</span>
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
                {mstrData?.applicationType.map((appType, index) => (
                  <option key={index} value={appType}>
                    {appType}
                  </option>
                ))}
              </select>
            </label>
            <FormError name="applicationFrom" errors={error} />
          </div>

          <div>
            <label htmlFor="wardMstrId" className="block font-medium text-sm">
              Ward No <span className="text-red-400 text-sm">*</span>
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
            </label>
            <FormError name="wardMstrId" errors={error} />
          </div>

          <div>
            <label
              htmlFor="ownershipTypeMstrId"
              className="block font-medium text-sm"
            >
              Ownership Type <span className="text-red-400 text-sm">*</span>
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
              <span className="text-red-400 text-sm">
                {error.ownershipTypeMstrId}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="propTypeMstrId"
              className="block font-medium text-sm"
            >
              Property Type <span className="text-red-400 text-sm">*</span>
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
                Appartment Name <span className="text-red-400 text-sm">*</span>
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
              value={formData.roadTypeMstrId}
              onChange={handleInputChange}
            >
              <option value="">Select Road Type</option>
              {mstrData?.roadType.map((item, index) => (
                <option key={index} value={item.id}>
                  {item.roadType}
                </option>
              ))}
            </select>

            {error?.roadWidth && (
              <span className="text-red-400">{error?.roadWidth}</span>
            )}
          </div>

          <div className="">
            <div className="flex items-center space-x-2 mt-4 py-2">
              <label
                htmlFor="isMainRoad"
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
              />
            </div>

            {error?.isBpl && (
              <span className="text-red-400 text-xs mt-1 block">
                {error?.isBpl}
              </span>
            )}
          </div>

          {formType === "Mutation" ? (
            <>
              <div>
                <label
                  htmlFor="transferMode"
                  className="block font-medium text-sm"
                >
                  Mode of Ownership Transfer{" "}
                  <span className="text-red-400 text-sm">*</span>
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
                  <option value="">Select </option>
                  {mstrData?.transferMode.map((mode, index) => (
                    <option key={index} value={mode.id}>
                      {mode.transferMode}
                    </option>
                  ))}
                </select>
                {error?.transferModeMstrId && (
                  <FormError path="transferModeMstrId" errors={error} />
                )}
              </div>

              <div>
                <label
                  htmlFor="percentageOfPropertyTransfer"
                  className="block font-medium text-sm"
                >
                  Property Transfer (0-100%){" "}
                  <span className="text-red-400 text-sm">*</span>
                </label>
                <input
                  id="percentageOfPropertyTransfer"
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  name="percentageOfPropertyTransfer"
                  required
                  value={formData.percentageOfPropertyTransfer || ""}
                  onChange={handleInputChange}
                  disabled={
                    pathname.includes(formType) &&
                    disabledFields?.percentageOfPropertyTransfer
                  }
                />

                {error?.percentageOfPropertyTransfer && (
                  <FormError
                    path="percentageOfPropertyTransfer"
                    errors={error}
                  />
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
          isDisabled={pathname.includes("Reassessment")}
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
        {!disabledFields?.propTypeMstrId !== "" && (
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
                <span className="text-red-400 text-sm">*</span>
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
                    htmlFor="towerInstallationDate"
                    className="block font-medium text-sm"
                  >
                    Date of Installation of Mobile Tower{" "}
                    <span className="text-red-400 text-sm">*</span>
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
              </>
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
                  />
                </div>

                {error?.isWidow && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isExArmy",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isExArmy && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isDisabledPerson",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isDisabledPerson && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                    Old Property waived Off In 2026-2027
                  </label>
                  <input
                    type="checkbox"
                    id="isOldProperty"
                    name="isOldProperty"
                    checked={formData.isOldProperty || false}
                    onChange={(e) => {
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isOldProperty",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isOldProperty && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isDp",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isDp && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isSchool",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isSchool && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isComplex",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isComplex && (
                  <span className="text-red-400 text-xs mt-1 block">
                    {error?.isComplex}
                  </span>
                )}
              </div>
            </li>

            <li>
              <div className="">
                <div className="flex items-center space-x-2 py-2">
                  <label
                    htmlFor="isMainRoad"
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isChabutra",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isChabutra && (
                  <span className="text-red-400 text-xs mt-1 block">
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
                      // Adapt this if your handler expects a custom event object
                      handleInputChange({
                        target: {
                          name: "isShopHolding",
                          value: e.target.checked,
                        },
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {error?.isShopHolding && (
                  <span className="text-red-400 text-xs mt-1 block">
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
            className={`items-center px-4 py-2 rounded text-white ${
              isFormSubmit ? "btn-secondary" : "btn-primary"
            }`}
            disabled={isFormSubmit}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssessmentForm;
