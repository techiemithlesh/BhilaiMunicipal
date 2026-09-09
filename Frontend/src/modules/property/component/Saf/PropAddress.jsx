const PropAddress = ({
  formData,
  error,
  handleInputChange,
  isDisabled,
  disabledFields,
}) => {
  return (
    <div className="flex flex-col gap-2 text-gray-700 text-lg property_details_container">
      <h1 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
        Property Address
      </h1>
      <div className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
        {/* Property Address Field */}
        <div className="my-2 w-full">
          <label htmlFor="propAddress" className="block font-medium text-sm">
            Property Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="propAddress"
            name="propAddress"
            cols={10}
            rows={5}
            placeholder=""
            value={formData.propAddress}
            onChange={(e) => {
              // Only allow letters and digits
              const val = e.target.value.replace(/[^a-zA-Z0-9\s,./\-#]/g, "");
              handleInputChange({
                target: {
                  name: "propAddress",
                  value: val,
                  type: "text",
                },
              });
            }}
            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
            disabled={isDisabled && disabledFields?.propAddress}
          />
          {error?.propAddress && (
            <span className="text-sm text-red-400 text-sm">{error?.propAddress}</span>
          )}
        </div>
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {/* City Field */}
          <div className="">
            <label htmlFor="propCity" className="block font-medium text-sm">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="propCity"
              name="propCity"
              required
              placeholder=""
              value={formData.propCity}
              onChange={(e) => {
                // Allow only letters and spaces
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                handleInputChange({
                  target: {
                    name: "propCity",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.propCity}
            />
            {error?.propCity && (
              <span className="text-sm text-red-400">{error?.propCity}</span>
            )}
          </div>

          {/* District Field */}
          <div className="">
            <label htmlFor="propDist" className="block font-medium text-sm">
              District <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="propDist"
              name="propDist"
              required
              placeholder=""
              value={formData.propDist}
              onChange={(e) => {
                // Allow only letters and spaces
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                handleInputChange({
                  target: {
                    name: "propDist",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.propDist}
            />
            {error?.propDist && (
              <span className="text-sm text-red-400">{error?.propDist}</span>
            )}
          </div>

          {/* State Field */}
          <div className="">
            <label htmlFor="propState" className="block font-medium text-sm">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="propState"
              name="propState"
              required
              placeholder=""
              value={formData.propState}
              onChange={(e) => {
                // Allow only letters and spaces
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                handleInputChange({
                  target: {
                    name: "propState",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.propState}
            />
            {error?.propState && (
              <span className="text-sm text-red-400">{error?.propState}</span>
            )}
          </div>

          {/* Pincode Field */}
          <div className="">
            <label htmlFor="propPinCode" className="block font-medium text-sm">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="propPinCode"
              name="propPinCode"
              required
              placeholder=""
              maxLength={6}
              value={formData.propPinCode}
              onChange={(e) => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, "");
                handleInputChange({
                  target: {
                    name: "propPinCode",
                    value: val,
                    type: "text",
                  },
                });
              }}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.propPinCode}
            />
            {error?.propPinCode && (
              <span className="text-sm text-red-400">{error?.propPinCode}</span>
            )}
          </div>
        </div>
      </div>

      {/* Corresponding Address Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isCorrAddDiffer"
          name="isCorrAddDiffer"
          checked={formData.isCorrAddDiffer === 1}
          onChange={handleInputChange}
          className="border-gray-300 rounded w-4 h-4 text-indigo-600"
          disabled={isDisabled}
        />
        <label
          htmlFor="isCorrAddDiffer"
          className="block ml-2 text-yellow-600 text-sm"
        >
          If Corresponding Address Different from Property Address
        </label>
      </div>

      {/* CORRESPONDENCE ADDRESS BOX  START */}

      {formData.isCorrAddDiffer === 1 && (
        <div className="my-4 p-4 border border-slate-400 rounded-md">
          {/* Property Address Field */}
          <div className="my-2 w-full">
            <label htmlFor="corrAddress" className="block font-medium text-sm">
              Property Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="corrAddress"
              name="corrAddress"
              cols={10}
              rows={5}
              required={formData.isCorrAddDiffer === 1}
              placeholder=""
              value={formData.corrAddress}
              onChange={handleInputChange}
              className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
              disabled={isDisabled && disabledFields?.corrAddress}
            />
            {error?.corrAddress && (
              <span className="text-sm text-red-400">{error?.corrAddress}</span>
            )}
          </div>
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            {/* City Field */}
            <div className="">
              <label htmlFor="corrCity" className="block font-medium text-sm">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="corrCity"
                name="corrCity"
                required={formData.isCorrAddDiffer === 1}
                placeholder=""
                value={formData.corrCity}
                onChange={handleInputChange}
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                disabled={isDisabled && disabledFields?.corrCity}
              />
              {error?.corrCity && (
                <span className="text-sm text-red-400">{error?.corrCity}</span>
              )}
            </div>

            {/* District Field */}
            <div className="">
              <label htmlFor="corrDist" className="block font-medium text-sm">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="corrDist"
                name="corrDist"
                required={formData.isCorrAddDiffer === 1}
                value={formData.corrDist}
                onChange={handleInputChange}
                placeholder=""
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                disabled={isDisabled && disabledFields?.corrDist}
              />
              {error?.corrDist && (
                <span className="text-sm text-red-400">{error?.corrDist}</span>
              )}
            </div>

            {/* State Field */}
            <div className="">
              <label htmlFor="corrState" className="block font-medium text-sm">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="corrState"
                name="corrState"
                required={formData.isCorrAddDiffer === 1}
                value={formData.corrState}
                onChange={handleInputChange}
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                disabled={isDisabled && disabledFields?.corrState}
              />
              {error?.corrState && (
                <span className="text-sm text-red-400">{error?.corrState}</span>
              )}
            </div>

            {/* Pincode Field */}
            <div className="">
              <label
                htmlFor="corrPinCode"
                className="block font-medium text-sm"
              >
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="corrPinCode"
                name="corrPinCode"
                required={formData.isCorrAddDiffer === 1}
                placeholder=""
                value={formData.corrPinCode}
                onChange={handleInputChange}
                className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                disabled={isDisabled && disabledFields?.corrPinCode}
              />
              {error?.corrPinCode && (
                <span className="text-sm text-red-400">{error?.corrPinCode}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CORRESPONDENCE ADDRESS BOX END */}
    </div>
  );
};

export default PropAddress;
