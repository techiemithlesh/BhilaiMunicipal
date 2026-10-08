const PropertyDetails = ({ data }) => {
  if (!data) return null;

  const {
    wardNo,
    assessmentType,
    propertyType,
    propTypeMstrId,
    ownershipType,
    roadType,
    plotNo,
    areaOfPlot,
    builtupArea,
    rainWaterHarvesting,
    propAddress,
    zone,
    entryType,
    newHoldingNo,
    holdingNo,
    holdingType,
    safNo,
    safDetailId,
    lastAssessmentYear,
    isAssessmentDue,
  } = data;

  const fields = [
    { label: "Ward No", value: wardNo },
    { label: "New Holding No", value: newHoldingNo },
    { label: "Old Holding No", value: holdingNo },
    { label: "SAF No", value: safNo, ...(safDetailId && { link: `/saf/details/${safDetailId}` }) },
    { label: "Assessment Type", value: assessmentType },
    { label: "Last Assessment Year", value: lastAssessmentYear },
    { label: "Plot No", value: plotNo },
    { label: "Property Type", value: propertyType },
    { label: "Area of Plot (In Sqft)", value: areaOfPlot },
    { label: "Ownership Type", value: ownershipType },
    {
      label: "Rain Water Harvesting",
      value: rainWaterHarvesting === true ? "Yes" : "No",
    },
    { label: "Holding Type", value: holdingType },
    { label: "Address", value: propAddress },
    { label: "Road Type", value: roadType },
  ];

  const isMutation = assessmentType?.toLowerCase() === "mutation";
  const visibleFields = fields.filter((field) => {
    if (field.label === "Road Type" && isMutation) return false;
    return true;
  });

  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      <div className="bg-blue-900 px-4 py-2 rounded-t-md font-bold text-white">
        Property Details
      </div>
      {isAssessmentDue === true && (
        <div
          role="alert"
          className="blink bg-red-100 mx-4 mt-4 px-3 py-2 border border-red-400 rounded font-semibold text-red-700 text-sm"
        >
          Assessment is due
          {lastAssessmentYear ? ` (last assessed: ${lastAssessmentYear})` : ""}
        </div>
      )}
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2 p-4">
        {visibleFields.map((field, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-medium text-gray-600">{field.label} :</span>{" "}
            <span className="font-semibold text-black">
              {field.link ? (
                <a href={field.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {field.value || "—"}
                </a>
              ) : (
                field.value || "—"
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyDetails;
