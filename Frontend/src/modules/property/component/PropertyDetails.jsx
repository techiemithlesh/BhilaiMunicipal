const PropertyDetails = ({ data }) => {
  if (!data) return null;

  const {
    wardNo,
    newWardNo,
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
    landOccupationDate,
  } = data;

  const fields = [
    { label: "Ward No", value: wardNo },
    { label: "New Holding No", value: newHoldingNo },
    { label: "Old Holding No", value: holdingNo },
    { label: "Assessment Type", value: assessmentType },
    { label: "Plot No", value: plotNo },
    { label: "Property Type", value: propertyType },
    { label: "Area of Plot (In Sqft)", value: areaOfPlot },
    { label: "Built Up Area (In Sqft)", value: builtupArea },
    { label: "Ownership Type", value: ownershipType },
    {
      label: "Rain Water Harvesting",
      value: rainWaterHarvesting === true ? "Yes" : "No",
    },
    { label: "Holding Type", value: holdingType },
    { label: "Address", value: propAddress },
    { label: "Road Type", value: roadType },
    { label: "Circle", value: zone },
    { label: "Entry Type", value: entryType },
    ...([3,4].includes(Number(propTypeMstrId)) ? [{ label: "Land Occupation Date", value: landOccupationDate }]:[]),
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
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2 p-4">
        {visibleFields.map((field, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-medium text-gray-600">{field.label} :</span>{" "}
            <span className="font-semibold text-black">
              {field.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyDetails;
