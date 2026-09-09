import { useLocation, useNavigate } from "react-router-dom";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { formData, ownerDtl, floorDtl } = location.state || {};

  // If no data, redirect back to form or show message
  if (!formData) {
    return (
      <div className="mx-auto my-10 container">
        <h2 className="mb-4 font-bold text-2xl">No data to preview</h2>
        <button
          onClick={() => navigate("/property/saf/apply/new")}
          className="bg-indigo-600 px-4 py-2 rounded text-white"
        >
          Go to Form
        </button>
      </div>
    );
  }

  // Format a simple key-value pair display helper
  const renderKeyValue = (label, value) => (
    <div className="mb-2">
      <strong>{label}:</strong> {value || "-"}
    </div>
  );

  const handleSubmit = () => {
    const { owners, floors, ...restFormData } = formData;

    const payload = {
      ...restFormData,
      ownerDtl: owners,
      floorDtl: floors,
    };
  };
  return (
    <div className="mx-auto container">
      <section className="bg-gray-50 mb-6 p-4 border rounded">
        <h2 className="mb-4 font-semibold text-xl">Property Details</h2>
        {renderKeyValue("Assessment Type", formData.assessmentType)}
        {renderKeyValue("Zone", formData.zoneMstrId)}
        {renderKeyValue("Old Ward No", formData.wardMstrId)}
        {renderKeyValue("New Ward No", formData.newWardMstrId)}
        {renderKeyValue("Ownership Type", formData.ownershipTypeMstrId)}
        {renderKeyValue("Property Type", formData.propTypeMstrId)}
        {formData.propTypeMstrId === 3 &&
          renderKeyValue("Apartment Details", formData.appartmentDetailsId)}
        {renderKeyValue("Flat Registry Date", formData.flatRegistryDate)}
        {renderKeyValue("Road Width", formData.roadWith)}
        {renderKeyValue("Khata No", formData.khataNo)}
        {renderKeyValue("Plot No", formData.plotNo)}
        {renderKeyValue("Village/Mauja Name", formData.villageMaujaName)}
        {renderKeyValue("Area of Plot", formData.areaOfPlot)}
      </section>

      {/* Property Address */}
      <section className="bg-gray-50 mb-6 p-4 border rounded">
        <h2 className="mb-4 font-semibold text-xl">Property Address</h2>
        {renderKeyValue("Address", formData.propAddress)}
        {renderKeyValue("City", formData.propCity)}
        {renderKeyValue("District", formData.propDist)}
        {renderKeyValue("Pin Code", formData.propPinCode)}
        {renderKeyValue("State", formData.propState)}
        {renderKeyValue(
          "Is Correspondence Address Different",
          formData.isCorrAddDiffer ? "Yes" : "No"
        )}
        {formData.isCorrAddDiffer === 1 && (
          <>
            {renderKeyValue("Correspondence Address", formData.corrAddress)}
            {renderKeyValue("Correspondence City", formData.corrCity)}
            {renderKeyValue("Correspondence State", formData.corrState)}
            {renderKeyValue("Correspondence Pin Code", formData.corrPinCode)}
          </>
        )}
      </section>

      {/* Owner Details */}
      <section className="bg-gray-50 mb-6 p-4 border rounded">
        <h2 className="mb-4 font-semibold text-xl">Owner Details</h2>
        {ownerDtl && ownerDtl.length > 0 ? (
          ownerDtl.map((owner, idx) => (
            <div
              key={owner.id || idx}
              className="bg-white shadow-sm mb-4 p-3 border rounded"
            >
              <h3 className="mb-2 font-semibold">Owner #{idx + 1}</h3>
              {Object.entries(owner).map(([key, val]) => (
                <div key={key}>
                  <strong>{key}:</strong> {val || "-"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>No owner details provided.</p>
        )}
      </section>

      {/* Floor Details */}
      <section className="bg-gray-50 mb-6 p-4 border rounded">
        <h2 className="mb-4 font-semibold text-xl">Floor Details</h2>
        {floorDtl && floorDtl.length > 0 ? (
          floorDtl.map((floor, idx) => (
            <div
              key={floor.id || idx}
              className="bg-white shadow-sm mb-4 p-3 border rounded"
            >
              <h3 className="mb-2 font-semibold">Floor #{idx + 1}</h3>
              {Object.entries(floor).map(([key, val]) => (
                <div key={key}>
                  <strong>{key}:</strong> {val || "-"}
                </div>
              ))}
            </div>
          ))
        ) : (
          <p>No floor details provided.</p>
        )}
      </section>

      {/* Navigation Buttons */}
      <div className="flex space-x-4 mt-8">
        <button
          className="bg-gray-300 hover:bg-gray-400 px-5 py-2 rounded"
          onClick={() => navigate(-1)} // back to form
        >
          Back
        </button>

        <button
          className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded text-white"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Preview;
