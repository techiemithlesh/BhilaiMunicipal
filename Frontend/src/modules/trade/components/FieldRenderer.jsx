import InputField from "./InputField";
import SelectField from "./SelectField";
import DateField from "./DateField";

export default function FieldRenderer({
  field,
  data,
  onChange,
  isEditable = true,
}) {
  const {
    name,
    value,
    label,
    type,
    required,
    options,
    isMulti = false,
    placeholder,
    error = "",
    disabled,         // ← NEW (captured from FormLayout)
    readOnly: fieldReadOnly,
    ...rest
  } = field;

  /**
   * FINAL CONTROL LOGIC:
   * Field is non-editable if:
   * 1) Global isEditable=false (SURRENDER mode)
   * 2) Field disabled=true (Renewal/Amendment logic)
   * 3) Field readOnly=true
   */
  const finalDisabled = disabled === true || !isEditable;
  const finalReadOnly = finalDisabled || fieldReadOnly;

  switch (type) {
    case "select":
      return (
        <SelectField
          label={label}
          name={name}
          value={value}
          onChange={onChange}
          options={options || []}
          isMulti={isMulti}
          disabled={finalDisabled}      // ← fully enforced
          readOnly={finalReadOnly}
          required={required}
          placeholder={placeholder}
          error={error}
          {...rest}
        />
      );

    case "date":
      return (
        <DateField
          label={label}
          name={name}
          value={value}
          onChange={onChange}
          disabled={finalDisabled}
          readOnly={finalReadOnly}
          required={required}
          error={error}
          {...rest}
        />
      );

    default:
      return (
        <InputField
          label={label}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          readOnly={finalReadOnly}
          disabled={finalDisabled}
          type={type || "text"}
          placeholder={placeholder}
          error={error}
          {...rest}
        />
      );
  }
}
