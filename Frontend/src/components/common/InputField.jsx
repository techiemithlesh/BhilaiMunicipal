function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false,
  error,
  ...rest
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block font-semibold text-gray-700 text-sm"
      >
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        disabled={disabled}
        className={`w-full mt-1 p-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-md`}
        {...rest}
      />
      {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
    </div>
  );
}

export default InputField;
