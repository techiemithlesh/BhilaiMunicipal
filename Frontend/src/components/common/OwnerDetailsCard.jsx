import { FaTrash, FaUserPlus } from "react-icons/fa";

// Same look as the property module owner section (see property/component/Saf/OwnerDtlAdd.jsx).
const inputClass =
  "block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:text-xs disabled:bg-gray-100";

const firstMessage = (error) => (Array.isArray(error) ? error[0] : error) || "";

/**
 * Owner rows rendered as cards.
 *
 * fields: [{ name, label, type: "text" | "tel" | "email" | "select", required: bool | (owner) => bool,
 *            options: string[], placeholder, maxLength, sanitize: (value) => value }]
 * errors: flat map keyed like `ownerDtl.0.ownerName`, as returned by the backend.
 */
export default function OwnerDetailsCard({
  title = "Owner Details",
  owners,
  fields,
  errors = {},
  errorPrefix = "ownerDtl",
  onChange,
  onAdd,
  onRemove,
  isDisabled = false,
}) {
  return (
    <div className="flex flex-col gap-2 text-gray-700 text-lg owner_details_container">
      <h2 className="my-heading">{title}</h2>

      {owners.map((owner, index) => (
        <div
          key={owner.id ?? index}
          className="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-blue-900 text-sm uppercase tracking-wide">
              Owner {index + 1}
            </span>

            <div className="flex items-center space-x-2 bg-gray-100 shadow-md px-3 py-1 border border-gray-300 rounded-full">
              {index === owners.length - 1 && (
                <button
                  type="button"
                  title="Add Owner"
                  onClick={onAdd}
                  disabled={isDisabled}
                  className="bg-white p-2 rounded-full text-green-600 hover:text-green-800 transition-colors"
                >
                  <FaUserPlus className="text-lg" />
                </button>
              )}
              {owners.length > 1 && (
                <button
                  type="button"
                  title="Remove Owner"
                  onClick={() => onRemove(owner.id)}
                  disabled={isDisabled}
                  className="bg-white hover:bg-red-100 p-2 rounded-full text-red-600 hover:text-red-800 transition-colors"
                >
                  <FaTrash className="text-lg" />
                </button>
              )}
            </div>
          </div>

          <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
            {fields.map((field) => {
              const id = `${field.name}-${owner.id ?? index}`;
              const required =
                typeof field.required === "function"
                  ? field.required(owner)
                  : !!field.required;
              const error = firstMessage(errors[`${errorPrefix}.${index}.${field.name}`]);
              const value = owner[field.name] ?? "";
              const handleChange = (e) =>
                onChange(
                  owner.id,
                  field.name,
                  field.sanitize ? field.sanitize(e.target.value) : e.target.value
                );

              return (
                <div key={field.name} className={field.colSpan ? `md:col-span-${field.colSpan}` : ""}>
                  <label htmlFor={id} className="block font-medium text-sm">
                    {field.label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                  </label>

                  {field.type === "select" ? (
                    <select
                      id={id}
                      value={value}
                      onChange={handleChange}
                      disabled={isDisabled}
                      className={inputClass}
                    >
                      <option value="">{field.placeholder || `Select ${field.label}`}</option>
                      {(field.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type={field.type || "text"}
                      value={value}
                      onChange={handleChange}
                      maxLength={field.maxLength}
                      inputMode={field.type === "tel" ? "numeric" : undefined}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      disabled={isDisabled}
                      className={inputClass}
                    />
                  )}

                  {error && <span className="text-red-500 text-xs">{error}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
