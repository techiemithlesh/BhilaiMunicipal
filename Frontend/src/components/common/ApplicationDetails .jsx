const ApplicationDetails = ({ assessmentType, fields }) => {
  if (!fields) return null;

  const isMutation = assessmentType?.toLowerCase() === "mutation";
  const visibleFields = fields.filter((field) => {
    if (field.label === "Road Type" && isMutation) return false;
    return true;
  });

  return (
    <div className="bg-white shadow p-6 border border-blue-800 rounded-lg">
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
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

export default ApplicationDetails;
