const RenderFieldList = ({
  title,
  fields = [],
  error = {},
  onChange = () => {},
}) => {
  return (
    <div className="flex flex-col gap-2 w-[-moz-available] text-gray-700 text-lg">
      {title && (
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
          {title}
        </h2>
      )}

      <div className="gap-4 grid grid-cols-1 md:grid-cols-4 p-4 border border-slate-400 rounded-md">
        {fields.map((field, idx) => {
          const {
            name,
            label,
            value,
            required,
            type = "text",
            options = [],
            colSpan,
            isDisabled,
          } = field;

          return (
            <div
              key={idx}
              className={colSpan ? `col-span-${colSpan}` : "col-span-1"}
            >
              <label htmlFor={name} className="block font-medium text-sm">
                {label} {required && <span className="text-red-500">*</span>}
              </label>

              {/* If value exists, show as text; else render input/select */}
              {value ? (
                <div className="mt-1 font-semibold">{value}</div>
              ) : type === "select" ? (
                <select
                  id={name}
                  name={name}
                  value={value || ""}
                  required={required}
                  onChange={(e) => onChange(name, e.target.value)}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  disabled={isDisabled}
                >
                  <option value="">Select {label}</option>
                  {options.map((opt, i) => (
                    <option key={i} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  id={name}
                  name={name}
                  value={value || ""}
                  required={required}
                  onChange={(e) => onChange(name, e.target.value)}
                  className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs"
                  disabled={isDisabled}
                />
              )}

              {error[name] && (
                <span className="text-red-500 text-xs">{error[name]}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RenderFieldList;
