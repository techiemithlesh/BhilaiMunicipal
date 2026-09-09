import { FaPlusCircle, FaRegBuilding, FaTrash } from "react-icons/fa";
import { validateFloorDtl } from "../../../../utils/safAssesmentValidation";
import { DatePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { TiDeleteOutline } from "react-icons/ti";
import { useEffect } from "react";

const getSafeCalendarDate = (value) => {
  // Must be YYYY-MM with month 01–12
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
    const [, year, month] = value.match(/(\d{4})-(\d{2})/);
    if (Number(month) >= 1 && Number(month) <= 12) {
      try {
        return parseDate(`${value}-01`);
      } catch (e) {
        console.error("parseDate failed:", value, e);
      }
    } else {
      console.warn("Invalid month value, ignoring:", value);
    }
  }
  return null;
};

const FloorDtlAdd = ({
  mstrData,
  formData,
  error,
  floorDtl,
  setFloorDtl,
  setErrors,
  isDisabled,
  disabledFields = [],
}) => {
  useEffect(() => {
    if (!floorDtl || floorDtl.length === 0) {
      setFloorDtl([{ id: 1 }]);
    }
  }, [floorDtl, setFloorDtl]);

  const handleFloorDtl = (index, field, value) => {
    const updateFloorDtls = floorDtl.map((floor, i) =>
      i === index ? { ...floor, [field]: value } : floor
    );
    setFloorDtl(updateFloorDtls);

    const floorErrors = validateFloorDtl(
      updateFloorDtls[index],
      index,
      formData
    );

    if (updateFloorDtls[index]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        floorErrors: {
          ...prevErrors.floorErrors,
          [index]: floorErrors,
        },
      }));
    }
  };

  const handleFloorAdd = () => {
    const newList = [...floorDtl, { id: floorDtl.length + 1 }];
    setFloorDtl(newList);
  };

  const handleRemoveFloor = (index) => {
    const newList = floorDtl.filter((_, i) => i !== index);
    setFloorDtl(newList);
  };

  return (
    <div className="flex flex-col gap-4 text-gray-700 text-base owner_details_container">
      <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
        <FaRegBuilding className="text-2xl" />
        Floor Details
      </h2>

      {floorDtl.map((floor, index) => (
        <div
          className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl"
          key={index}
        >
          <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
            <div>
              <label
                htmlFor={`floorMasterId-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                Floor Name <span className="text-sm text-red-400">*</span>
              </label>
              <select
                id={`floorMasterId-${index}`}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                name="floorMasterId"
                required
                value={floor.floorMasterId || ""}
                onChange={(e) =>
                  handleFloorDtl(index, "floorMasterId", e.target.value)
                }
                disabled={isDisabled && disabledFields[index]?.floorMasterId}
              >
                <option value="">Select Floor</option>
                {mstrData?.floorType.map((floor, idx) => (
                  <option key={idx} value={floor.id}>
                    {floor.floorName}
                  </option>
                ))}
              </select>
              {error?.floorErrors &&
                error.floorErrors[index]?.floorMasterId && (
                  <span className="text-sm text-red-400 text-xs">
                    {error.floorErrors[index].floorMasterId}
                  </span>
                )}
            </div>

            <div>
              <label
                htmlFor={`usageTypeMasterId-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                Usage Type <span className="text-sm text-red-400">*</span>
              </label>
              <select
                id={`usageTypeMasterId-${index}`}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                name="usageTypeMasterId"
                required
                value={floor.usageTypeMasterId || ""}
                onChange={(e) =>
                  handleFloorDtl(index, "usageTypeMasterId", e.target.value)
                }
                disabled={
                  isDisabled && disabledFields[index]?.usageTypeMasterId
                }
              >
                <option value="">Select Usage Type</option>
                {mstrData?.usageType.map((usage, idx) => (
                  <option key={idx} value={usage.id}>
                    {usage.usageType}
                  </option>
                ))}
              </select>
              {error?.floorErrors &&
                error.floorErrors[index]?.usageTypeMasterId && (
                  <span className="text-sm text-red-400 text-xs">
                    {error.floorErrors[index].usageTypeMasterId}
                  </span>
                )}
            </div>

            <div>
              <label
                htmlFor={`occupancyTypeMasterId-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                Occupancy Type <span className="text-sm text-red-400">*</span>
              </label>
              <select
                id={`occupancyTypeMasterId-${index}`}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                name="occupancyTypeMasterId"
                value={floor.occupancyTypeMasterId || ""}
                required
                onChange={(e) =>
                  handleFloorDtl(index, "occupancyTypeMasterId", e.target.value)
                }
                disabled={
                  isDisabled && disabledFields[index]?.occupancyTypeMasterId
                }
              >
                <option value="">Select Occupancy Type</option>
                {mstrData?.occupancyType.map((occupancy, idx) => (
                  <option key={idx} value={occupancy.id}>
                    {occupancy.occupancyName}
                  </option>
                ))}
              </select>
              {error?.floorErrors &&
                error.floorErrors[index]?.occupancyTypeMasterId && (
                  <span className="text-sm text-red-400 text-xs">
                    {error.floorErrors[index].occupancyTypeMasterId}
                  </span>
                )}
            </div>

            <div>
              <label
                htmlFor={`constructionTypeMasterId-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                Construction Type{" "}
                <span className="text-sm text-red-400">*</span>
              </label>
              <select
                id={`constructionTypeMasterId-${index}`}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                name="constructionTypeMasterId"
                required
                value={floor.constructionTypeMasterId || ""}
                onChange={(e) =>
                  handleFloorDtl(
                    index,
                    "constructionTypeMasterId",
                    e.target.value
                  )
                }
                disabled={
                  isDisabled && disabledFields[index]?.constructionTypeMasterId
                }
              >
                <option value="">Select Construction Type</option>
                {mstrData?.constructionType.map((construction, idx) => (
                  <option key={idx} value={construction.id}>
                    {construction.constructionType}
                  </option>
                ))}
              </select>
              {error?.floorErrors &&
                error.floorErrors[index]?.constructionTypeMasterId && (
                  <span className="text-sm text-red-400 text-xs">
                    {error.floorErrors[index].constructionTypeMasterId}
                  </span>
                )}
            </div>

            <div>
              <label
                htmlFor={`builtUpArea-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                Built Up Area (Sq. Ft){" "}
                <span className="text-sm text-red-400">*</span>
              </label>
              <input
                type="text"
                id={`builtupArea-${index}`}
                name="builtupArea"
                required
                placeholder="Built Up Area"
                value={floor.builtupArea || ""}
                onChange={(e) => {
                  // Allow only digits and one decimal point
                  let val = e.target.value.replace(/[^0-9.]/g, "");
                  // Prevent more than one decimal point
                  const parts = val.split(".");
                  if (parts.length > 2) {
                    val = parts[0] + "." + parts.slice(1).join("");
                  }
                  // Optional: limit to 2 decimals
                  val = val.replace(/^(\d*\.\d{0,2}).*$/, "$1");
                  handleFloorDtl(index, "builtupArea", val);
                }}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                disabled={isDisabled && disabledFields[index]?.builtupArea}
              />
              {error?.floorErrors && error.floorErrors[index]?.builtupArea && (
                <span className="text-sm text-red-400 text-xs">
                  {error.floorErrors[index].builtupArea}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor={`dateFrom-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                From Date <span className="text-sm text-red-400">*</span>
              </label>
              <select
                id={`dateFrom-${index}`}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                name="dateFrom"
                required
                value={floor.dateFrom || ""}
                onChange={(e) =>
                  handleFloorDtl(index, "dateFrom", e.target.value)
                }
                disabled={
                  isDisabled && disabledFields[index]?.dateFrom
                }
              >
                <option value="">SELECT FROM YEAR</option>
                {mstrData?.fyearList.map((fy, idx) => (
                  <option key={idx} value={fy.fromDate}>
                    {fy.fyear}
                  </option>
                ))}
              </select>

              {error?.floorErrors && error.floorErrors[index]?.dateFrom && (
                <span className="text-sm text-red-400 text-xs">
                  {error.floorErrors[index].dateFrom}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor={`dateUpto-${index}`}
                className="block mb-1 font-semibold text-sm"
              >
                Upto Date
              </label>
              <select
                id={`uptoDate-${index}`}
                className="block bg-white shadow px-3 py-2 border border-gray-300 focus:border-blue-500 rounded-md focus:outline-none focus:ring-blue-500 w-full text-sm"
                name="dateUpto"
                value={floor.dateUpto || ""}
                onChange={(e) =>
                  handleFloorDtl(index, "dateUpto", e.target.value)
                }
                disabled={
                  isDisabled && disabledFields[index]?.dateUpto
                }
              >
                <option value="">SELECT UPTO YEAR</option>
                {mstrData?.fyearList.map((fy, idx) => (
                  <option key={idx} value={fy.uptoDate}>
                    {fy.fyear}
                  </option>
                ))}
              </select>
              {error?.floorErrors && error.floorErrors[index]?.dateUpto && (
                <span className="text-sm text-red-400 text-xs">
                  {error.floorErrors[index].dateUpto}
                </span>
              )}
            </div>

            <div className="flex flex-col justify-end items-end gap-2">
              <div className="flex items-center space-x-2 bg-blue-50 shadow px-3 py-2 border border-blue-200 rounded-full">
                <button
                  onClick={handleFloorAdd}
                  type="button"
                  title="Add Floor"
                  className="bg-white hover:bg-green-100 p-2 rounded-full text-green-600 hover:text-green-800 transition-colors"
                  disabled={isDisabled}
                >
                  <FaPlusCircle className="text-xl" />
                </button>
                {floorDtl.length > 1 && (
                  <button
                    onClick={() => handleRemoveFloor(index)}
                    type="button"
                    title="Remove Floor"
                    className="bg-white hover:bg-red-100 p-2 rounded-full text-red-600 hover:text-red-800 transition-colors"
                    disabled={isDisabled}
                  >
                    <FaTrash className="text-xl" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloorDtlAdd;
