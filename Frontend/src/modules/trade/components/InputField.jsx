export default function InputField({
  label,
  name,
  value,
  onChange,
  onBlur,
  required,
  readOnly = false,
  placeholder = "",
  type = "text",
  error = "",
  ...rest
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={onBlur}
        className={`border px-3 py-2 rounded-md text-sm ${
          readOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
        {...rest}
      />
      {error && (
        <span className="text-xs text-red-500 mt-1">{error}</span>
      )}
    </div>
  );
}
