const WaterSafPayment = ({ mstrData, error, formData, handleInputChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl mb-4">
      
      {/* Water Connection Facility */}
      <div className="flex flex-col">
        <label className="block font-medium text-sm mb-1">
          Water Connection Facility <span className="text-red-500">*</span>
        </label>

        <select
          className="block bg-white shadow-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-sm"
          name="waterConnectionFacilityTypeId"
          value={formData?.waterConnectionFacilityTypeId || ""}
          onChange={handleInputChange}
        >
          <option value="">Select</option>
          {mstrData?.waterFacility?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.facilityType}
            </option>
          ))}
        </select>

        {error?.waterConnectionFacilityTypeId && (
          <span className="text-xs text-red-500 mt-1">
            {error.waterConnectionFacilityTypeId}
          </span>
        )}
      </div>

      {/* Water Tax Type */}
      <div className="flex flex-col">
        <label className="block font-medium text-sm mb-1">
          Water Tax Type <span className="text-red-500">*</span>
        </label>

        <select
          className="block bg-white shadow-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-sm"
          name="waterTaxTypeId"
          value={formData?.waterTaxTypeId || ""}
          onChange={handleInputChange}
        >
          <option value="">Select</option>
          {mstrData?.waterTax?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.taxType}
            </option>
          ))}
        </select>

        {error?.waterTaxTypeId && (
          <span className="text-xs text-red-500 mt-1">
            {error.waterTaxTypeId}
          </span>
        )}
      </div>

      {/* NOTE SECTION */}
      <div className="col-span-full mt-2">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md">
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="font-semibold">Note:</span> Water Tax is a one-time
            tax and is applicable only if you are doing your assessment for the
            first time or if you have never paid it earlier.
          </p>
        </div>
      </div>

    </div>
  );
};

export default WaterSafPayment;
