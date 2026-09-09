import React from "react";
import {
  FaBuilding,
  FaHome,
  FaCalendarAlt,
  FaLayerGroup,
} from "react-icons/fa";

function getLabel(map, val) {
  if (!val) return "—";
  if (!map) return val;
  return map[val] || val;
}

// Field row for main fields and floors: always shows "Self" and "Verified" columns
function FieldRow({ label, original, verified, lookup }) {
  return (
    <div className="flex md:flex-row flex-col md:items-center gap-1 px-2 py-1 last:border-0 border-b">
      <div className="w-full md:w-1/4 font-medium text-gray-700">{label}</div>
      <div className="w-full md:w-1/3 text-gray-600 truncate">
        <span className="mr-1 text-xs">Self:</span>
        {getLabel(lookup, original)}
      </div>
      <div className="w-full md:w-1/3 font-semibold text-blue-800 truncate">
        <span className="mr-1 text-xs">Verified:</span>
        {getLabel(lookup, verified)}
      </div>
    </div>
  );
}

// For extra floors (only new data, so single column)
function ExtraFloorCard({ floor, idx, lookupMaps }) {
  return (
    <div
      className="flex flex-col gap-1 bg-green-50 shadow-sm hover:shadow-lg p-4 border border-green-200 rounded-xl transition"
      key={idx}
    >
      <div className="flex items-center gap-2 mb-1">
        <FaLayerGroup className="text-green-700" />
        <span className="font-bold text-green-800">{`Extra Floor ${
          idx + 1
        }`}</span>
      </div>
      <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 text-sm">
        <PreviewField label="Floor No" value={floor.floorNo} />
        <PreviewField
          label="Construction Type"
          value={getLabel(
            lookupMaps.constructionTypeMasterId,
            floor.constructionType
          )}
        />
        <PreviewField
          label="Occupancy Type"
          value={getLabel(
            lookupMaps.occupancyTypeMasterId,
            floor.occupancyType
          )}
        />
        <PreviewField
          label="Usage Type"
          value={getLabel(lookupMaps.usageTypeMasterId, floor.usageType)}
        />
        <PreviewField label="Date From" value={floor.dateFrom} />
        <PreviewField label="Date Upto" value={floor.dateUpto} />
      </div>
    </div>
  );
}

function PreviewField({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="font-medium text-gray-700">{label}:</span>
      <span className="ml-1 text-gray-900 truncate">
        {value || <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

const FIELD_CONFIG = [
  { key: "wardMstrId", label: "Ward No", lookup: "wardMstrId" },
  { key: "newWardMstrId", label: "New Ward No", lookup: "newWardMstrId" },
  { key: "zoneMstrId", label: "Zone", lookup: "zoneMstrId" },
  { key: "propTypeMstrId", label: "Property Type", lookup: "propTypeMstrId" },
];

const FLOOR_CONFIG = [
  {
    key: "usageTypeMasterId",
    label: "Usage Type",
    lookup: "usageTypeMasterId",
  },
  {
    key: "occupancyTypeMasterId",
    label: "Occupancy Type",
    lookup: "occupancyTypeMasterId",
  },
  {
    key: "constructionTypeMasterId",
    label: "Construction Type",
    lookup: "constructionTypeMasterId",
  },
  { key: "builtupArea", label: "Builtup Area" },
  { key: "dateFrom", label: "Date From" },
  { key: "dateUpto", label: "Date Upto" },
];

const FieldVerificationPreview = ({
  open,
  onClose,
  data = {},
  extraFloors = [],
  remarks = "",
  safData = {},
  lookupMaps = {},
}) => {
  if (!open) return null;

  // Main verified/self field values
  const getValue = (k) => safData?.[k] || "";
  const getVerified = (k) => data?.[k] || "";

  // To handle floors
  const mainFloors = safData?.floor || [];

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/40 px-2">
      <div className="relative bg-white shadow-2xl mx-auto border-2 border-blue-800 rounded-2xl w-full max-w-3xl max-h-[96vh] overflow-y-auto text-black">
        <button
          className="top-3 right-5 absolute font-bold text-gray-500 hover:text-red-700 text-2xl"
          onClick={onClose}
          aria-label="Close preview"
        >
          ×
        </button>
        <div className="px-5 pt-5 pb-3">
          <h2 className="mb-3 font-bold text-blue-900 text-2xl text-center">
            Preview - Field Verification
          </h2>

          {/* Application Header */}
          <div className="flex flex-wrap justify-between gap-4 mb-3 pb-2 border-b text-[15px]">
            <div>
              <b>Application No:</b> {safData?.safNo}
            </div>
            <div>
              <b>Type:</b> {safData?.assessmentType}
            </div>
            <div>
              <b>Date:</b> {safData?.applyDate}
            </div>
          </div>

          {/* Main fields */}
          <div className="bg-blue-50 mb-5 border rounded-xl overflow-x-auto">
            {FIELD_CONFIG.map(({ key, label, lookup }) => (
              <FieldRow
                key={key}
                label={label}
                original={getValue(key)}
                verified={getVerified(key)}
                lookup={lookupMaps[lookup]}
              />
            ))}
          </div>

          {/* Main Floors */}
          {mainFloors.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 pb-1 border-b font-semibold text-blue-900 text-lg">
                Floors
              </div>
              {mainFloors.map((floor, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 mb-3 px-2 py-2 border rounded-xl"
                >
                  <div className="mb-1 font-bold text-gray-800">
                    {floor?.floorName || `Floor ${idx + 1}`}
                  </div>
                  {FLOOR_CONFIG.map(({ key, label, lookup }) => (
                    <FieldRow
                      key={key}
                      label={label}
                      original={
                        floor[
                          label === "Builtup Area"
                            ? "builtupArea"
                            : key.replace("MasterId", "")
                        ] ?? floor[key]
                      }
                      verified={data[`${key}`]}
                      lookup={lookupMaps[lookup]}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Extra Floors */}
          <div className="mb-6">
            <div className="mb-2 pb-1 border-b font-semibold text-blue-900 text-lg">
              Extra Floors
            </div>
            {!extraFloors || extraFloors.length === 0 ? (
              <div className="mb-2 px-1 text-gray-400">No Extra Floors</div>
            ) : (
              <div className="flex flex-col gap-3">
                {extraFloors.map((floor, idx) => (
                  <ExtraFloorCard
                    floor={floor}
                    idx={idx}
                    lookupMaps={lookupMaps}
                    key={idx}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="mt-3">
            <div className="mb-1 font-semibold">Remarks:</div>
            <div className="bg-gray-100 p-2 border rounded min-h-[36px] text-[15px]">
              {remarks || <span className="text-gray-400">None</span>}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="bg-blue-600 shadow px-6 py-2 rounded text-white"
            >
              Back
            </button>
            <button
              className="bg-green-600 shadow px-6 py-2 rounded text-white"
              // onClick={onSubmit} // Attach handler if needed
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldVerificationPreview;
