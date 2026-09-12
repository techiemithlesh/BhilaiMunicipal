import { form } from "@nextui-org/react";

const PropDtl = ({
  mstrData,
  formData,
  error,
  handleInputChange,
  isDisabled,
  disabledFields,
}) => {
  return (
    <div className="flex flex-col gap-2 text-gray-700 text-lg property_details_container">
      <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
        Property Details
      </h2>
      <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
        <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
          <div className="">
            <label htmlFor="khataNo" className="block font-medium text-sm">
              Khata No.
            </label>
            <input
              type="text"
              id="khataNo"
              name="khataNo"
              placeholder=""
              value={formData.khataNo || ""}
              onChange={(e) => {
                // Allow only digits and slashes or hyphens
                const val = e.target.value.replace(/[^a-zA-Z0-9\/-]/g, "");
                handleInputChange({
                  target: {
                    name: "khataNo",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.khataNo}
            />
            {error?.khataNo && (
              <span className="text-red-400">{error?.khataNo}</span>
            )}
          </div>

          <div className="">
            <label htmlFor="plotNo" className="block font-medium text-sm">
              Plot No/Khasra No.
            </label>
            <input
              type="text"
              id="plotNo"
              name="plotNo"
              value={formData.plotNo || ""}
              placeholder=""
              onChange={(e) => {
                // Allow only alphanumeric characters
                const val = e.target.value.replace(/[^a-zA-Z0-9\/-]/g, "");
                handleInputChange({
                  target: {
                    name: "plotNo",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.plotNo}
            />
            {error?.plotNo && (
              <span className="text-red-400">{error?.plotNo}</span>
            )}
          </div>

          <div className="">
            <label
              htmlFor="villageMaujaName"
              className="block font-medium text-sm"
            >
              Village/Mauja Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="villageMaujaName"
              name="villageMaujaName"
              required
              placeholder=""
              value={formData.villageMaujaName || ""}
              onChange={handleInputChange}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.villageMaujaName}
            />
            {error?.userName && (
              <span className="text-red-400">{error?.userName}</span>
            )}
          </div>

          <div className="">
            <label htmlFor="areaOfPlot" className="block font-medium text-sm">
              Area of Plot (in Sqft) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="areaOfPlot"
              name="areaOfPlot"
              required
              placeholder=""
              value={formData.areaOfPlot || ""}
              onChange={(e) => {
                const val = e.target.value
                  .replace(/[^0-9.]/g, "")
                  .replace(/^(\d*\.\d{0,2}).*$/, "$1"); // optional: limit to 2 decimals
                handleInputChange({
                  target: {
                    name: "areaOfPlot",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.areaOfPlot}
            />
            {error?.areaOfPlot && (
              <span className="text-red-400">{error?.areaOfPlot}</span>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default PropDtl;
