import { FaTrash, FaUserPlus } from "react-icons/fa";
import { validateOwnerDtl } from "../../../../utils/safAssesmentValidation";
import { Spinner } from "@nextui-org/react";
import { useEffect } from "react";

const OwnerDtlAdd = ({
  error,
  ownerDtl,
  setOwnerDtl,
  setErrors,
  isDisabled,
  disabledFields,
  isSingleOwner = false,
}) => {
  useEffect(() => {
    if (!Array.isArray(ownerDtl) || ownerDtl.length === 0) {
      setOwnerDtl([{ id: 1 ,isArmedForce: false,isSpeciallyAbled: false,}]);
    }
  }, []);

  useEffect(() => {
    if (isSingleOwner && ownerDtl.length > 1) {
      setOwnerDtl([ownerDtl[0]]); // keep only first owner
    }
  }, [isSingleOwner]);

  const handleOwnerAdd = () => {
    if (isSingleOwner) return; // ❌ hard stop
    setOwnerDtl([...ownerDtl, { id: ownerDtl.length + 1,isArmedForce: false,isSpeciallyAbled: false, }]);
  };

  const handleRemoveOwner = (index) => {
    if (isSingleOwner) return; // ❌ hard stop
    setOwnerDtl(ownerDtl.filter((_, i) => i !== index));
  };

  const handleOwnerDtlChange = (index, field, value) => {
    const updatedOwners = ownerDtl.map((owner, i) =>
      i === index ? { ...owner, [field]: value } : owner
    );
    setOwnerDtl(updatedOwners);

    const ownerErrors = validateOwnerDtl(updatedOwners[index], index);

    if (updatedOwners[index]) {
      const ownerErrors = validateOwnerDtl(updatedOwners[index], index);

      setErrors((prevErrors) => ({
        ...prevErrors,
        ownerErrors: {
          ...prevErrors.ownerErrors,
          [index]: ownerErrors,
        },
      }));
    }
  };

  if (!Array.isArray(ownerDtl))
    <div className="loading">
      <Spinner />
    </div>;

  return (
    <div className="flex flex-col gap-2 text-gray-700 text-lg owner_details_container">
      <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
        Owner Details
      </h2>

      {error?.ownerErrors && error.ownerErrors?.error && (
        <span className="text-red-500">{error.ownerErrors.error}</span>
      )}

      {ownerDtl.map((owner, index) => (
        <div
          className="gap-4 grid grid-cols-1 md:grid-cols-4 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl"
          key={index}
        >
          <div className="">
            <label
              htmlFor={`ownerName-${index}`}
              className="block font-medium text-sm"
            >
              Owner Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`ownerName-${index}`}
              name="ownerName"
              placeholder="Enter Owner Name"
              value={owner.ownerName || ""}
              required
              onChange={(e) =>
                handleOwnerDtlChange(index, "ownerName", e.target.value)
              }
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.ownerName}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.ownerName && (
              <span className="text-red-500">
                {error.ownerErrors[index].ownerName}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`gender-${index}`}
              className="block font-medium text-sm"
            >
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id={`gender-${index}`}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="gender"
              required
              value={owner.gender || ""}
              onChange={(e) =>
                handleOwnerDtlChange(index, "gender", e.target.value)
              }
              disabled={isDisabled && disabledFields[index]?.gender}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male </option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {error?.ownerErrors && error.ownerErrors[index]?.gender && (
              <span className="text-red-500">
                {error.ownerErrors[index].gender}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`dob-${index}`}
              className="block font-medium text-sm"
            >
              DOB 
            </label>
            <input
              type="date"
              id={`dob-${index}`}
              name="dob"
              // required
              value={owner.dob || ""}
              onChange={(e) =>
                handleOwnerDtlChange(index, "dob", e.target.value)
              }
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.dob}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.dob && (
              <span className="text-red-500">
                {error.ownerErrors[index].dob}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`guardianName-${index}`}
              className="block font-medium text-sm"
            >
              Guardian Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id={`guardianName-${index}`}
              name="guardianName"
              required
              value={owner.guardianName || ""}
              placeholder="Enter Guardian Name"
              onChange={(e) =>
                handleOwnerDtlChange(index, "guardianName", e.target.value)
              }
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.guardianName}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.guardianName && (
              <span className="text-red-500">
                {error.ownerErrors[index].guardianName}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`relationType-${index}`}
              className="block font-medium text-sm"
            >
              Relation <span className="text-red-500">*</span>
            </label>
            <select
              id={`relationType-${index}`}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="relationType"
              required
              value={owner.relationType || ""}
              onChange={(e) =>
                handleOwnerDtlChange(index, "relationType", e.target.value)
              }
              disabled={isDisabled && disabledFields[index]?.relationType}
            >
              <option value="">Select Relation</option>
              <option value="S/O">S/O </option>
              <option value="D/O">D/O</option>
              <option value="W/O">W/O</option>
              <option value="C/O">C/O</option>
              {/* <option value="5">Guardian</option> */}
            </select>

            {error?.ownerErrors && error.ownerErrors[index]?.relationType && (
              <span className="text-red-500">
                {error.ownerErrors[index].relationType}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`mobileNo-${index}`}
              className="block font-medium text-sm"
            >
              Mobile No <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id={`mobileNo-${index}`}
              name="mobileNo"
              pattern="[6-9]{1}[0-9]{9}"
              placeholder="Enter Mobile No"
              required
              value={owner.mobileNo || ""}
              onChange={(e) => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, "");
                handleOwnerDtlChange(index, "mobileNo", val);
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.mobileNo}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.mobileNo && (
              <span className="text-red-500">
                {error.ownerErrors[index].mobileNo}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`email-${index}`}
              className="block font-medium text-sm"
            >
              Email Id
            </label>
            <input
              type="text"
              id={`email-${index}`}
              name="email"
              placeholder="Enter Email"
              value={owner.email || ""}
              onChange={(e) =>
                handleOwnerDtlChange(index, "email", e.target.value)
              }
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.email}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.email && (
              <span className="text-red-500">
                {error.ownerErrors[index].email}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`adharNo-${index}`}
              className="block font-medium text-sm"
            >
              Adhar No
            </label>
            <input
              type="text"
              id={`adharNo-${index}`}
              name="adharNo"
              maxLength={12}
              value={owner.adharNo || ""}
              onChange={(e) => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, "");
                handleOwnerDtlChange(index, "adharNo", val);
              }}
              placeholder="Enter Aadhar No"
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.adharNo}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.adharNo && (
              <span className="text-red-500">
                {error.ownerErrors[index].adharNo}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`panNo-${index}`}
              className="block font-medium text-sm"
            >
              Pan No
            </label>
            <input
              type="text"
              id={`panNo-${index}`}
              name="panNo"
              maxLength={10}
              placeholder="Enter Pan No"
              value={owner.panNo || ""}
              onChange={(e) =>
                handleOwnerDtlChange(index, "panNo", e.target.value)
              }
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields[index]?.panNo}
            />
            {error?.ownerErrors && error.ownerErrors[index]?.panNo && (
              <span className="text-red-500">
                {error.ownerErrors[index].panNo}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`isArmedForce-${index}`}
              className="block font-medium text-sm"
            >
              Is Armed Force <span className="text-red-500">*</span>
            </label>
            <select
              id={`isArmedForce-${index}`}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="isArmedForce"
              value={owner.isArmedForce || ""}
              onChange={(e) =>
                handleOwnerDtlChange(index, "isArmedForce", e.target.value)
              }
              disabled={isDisabled && disabledFields[index]?.isArmedForce}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
            {error?.ownerErrors && error.ownerErrors[index]?.isArmedForce && (
              <span className="text-red-500">
                {error.ownerErrors[index].isArmedForce}
              </span>
            )}
          </div>

          <div className="">
            <label
              htmlFor={`isSpeciallyAbled-${index}`}
              className="block font-medium text-sm"
            >
              Is Specially Abled <span className="text-red-500">*</span>
            </label>
            <select
              id={`isSpeciallyAbled-${index}`}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              name="isSpeciallyAbled"
              value={owner.isSpeciallyAbled || 0}
              onChange={(e) =>
                handleOwnerDtlChange(index, "isSpeciallyAbled", e.target.value)
              }
              disabled={isDisabled && disabledFields[index]?.isSpeciallyAbled}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
            {error?.ownerErrors &&
              error.ownerErrors[index]?.isSpeciallyAbled && (
                <span className="text-red-500">
                  {error.ownerErrors[index].isSpeciallyAbled}
                </span>
              )}
          </div>

          <div className="flex justify-end mt-4">
            <div className="flex items-center space-x-2 bg-gray-100 shadow-md px-3 py-2 border border-gray-300 rounded-full">
              <button
                onClick={handleOwnerAdd}
                type="button"
                title="Add Owner"
                className={`bg-white  p-2 rounded-full ${
                  isDisabled || isSingleOwner
                    ? "text-gray-600 hover:text-gray-800"
                    : "text-green-600 hover:text-green-800"
                } transition-colors`}
                disabled={isDisabled || isSingleOwner}
              >
                <FaUserPlus className="text-xl" />
              </button>

              {ownerDtl.length > 1 && (
                <button
                  onClick={() => handleRemoveOwner(index)}
                  type="button"
                  title="Remove Owner"
                  className="bg-white hover:bg-red-100 p-2 rounded-full text-red-600 hover:text-red-800 transition-colors"
                  disabled={isDisabled}
                >
                  <FaTrash className="text-xl" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OwnerDtlAdd;
