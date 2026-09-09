import { Input, Select, SelectItem, Textarea } from "@nextui-org/react";

export default function FormCard({
  title,
  formFields,
  onChange,
  loading = false,
}) {
  return (
    <div className="flex flex-col gap-2 w-full text-gray-700 text-lg">
      {title && <h2 className="my-heading">{title}</h2>}

      <div className="gap-4 grid grid-cols-1 md:grid-cols-4 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl">
        {formFields.map((field, index) => {
          const {
            name,
            label,
            subOnChange,
            value,
            required,
            isMulti,
            maxSelection=null,
            type = "text",
            options = [],
            isDisabled,
            placeholder,
            renderValue,
            selectedList,
            onBlur,
            isHidden = false, // Default to false
            error,
            ...rest
          } = field;

          let validate_error= error;

          // Use the conditional rendering expression here
          return !isHidden ? (
            <div
              key={name} // Use a stable, unique key like 'name' instead of index
              className={
                type === "textarea"
                  ? "col-span-4"
                  : field.colSpan
                  ? `col-span-${field.colSpan}`
                  : "col-span-1"
              }
            >
              {/* ... The rest of your input rendering logic remains the same ... */}
              {type === "select" ? (
                <div className="flex flex-col gap-2 w-full">
                  {loading || field?.loading ? (
                    <div className="flex justify-center items-center h-12">
                      <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-6 h-6 animate-spin"></span>
                      <span className="ml-2 text-blue-600 text-sm">
                        Loading options...
                      </span>
                    </div>
                  ) : (
                    <Select
                      label={label}
                      labelPlacement="outside"
                      variant="bordered"
                      isRequired={required}
                      isDisabled={isDisabled}
                      placeholder={placeholder || `Select ${label}`}
                      className="w-full"
                      classNames={{
                        inputWrapper: "bg-white h-10 min-h-10",
                        label: "text-sm",
                        base: "max-w-xs",
                        trigger: "min-h-10 py-2",
                        mainWrapper: "bg-white rounded-medium",
                      }}
                      selectionMode={isMulti ? "multiple" : "single"}
                      isClearable
                      selectedKeys={
                        options.length > 0
                          ? isMulti
                            ? new Set((value || []).map((v) => String(v)))
                            : value !== undefined && value !== null
                            ? new Set([String(value)])
                            : new Set()
                          : new Set() // prevent mismatch error when no options
                      }
                      renderValue={renderValue}
                      onSelectionChange={(keys) => {
                        const keyArray = Array.from(keys);
                        if (isMulti && maxSelection && keyArray.length > maxSelection) {
                            validate_error = `Maximum of ${maxSelection} item(s) allowed.`;
                            console.warn(`Selection limited to ${maxSelection} items.`);
                            return; 
                        }
                        const selectedValue = isMulti
                          ? Array.from(keys)
                          : Array.from(keys)[0] || null;
                        onChange(name, selectedValue);
                        if (typeof subOnChange === "function") {
                          subOnChange(selectedValue);
                        }
                      }}
                      onBlur={onBlur}
                      {...rest}
                    >
                      {options.map((opt) => (
                        <SelectItem
                          key={String(opt[field.optionValueKey || "value"])}
                        >
                          {opt[field.optionLabelKey || "label"]}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                  {selectedList && (
                    <div className="flex flex-col gap-2 w-full text-default-500 text-small">
                      {selectedList.map((item,index) => (
                        <div
                          key={index}
                          className="bg-slate-300 p-1 px-2 rounded-md text-black"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : type === "textarea" ? (
                <Textarea
                  label={label}
                  labelPlacement="outside"
                  variant="bordered"
                  isRequired={required}
                  isDisabled={isDisabled}
                  placeholder={placeholder || `Enter ${label}`}
                  className="w-full"
                  classNames={{
                    inputWrapper: "bg-white rounded-medium",
                    label: "text-sm",
                  }}
                  value={value || ""}
                  minRows={4}
                  maxLength={field.maxLength || undefined}
                  onBeforeInput={(e) => {
                    const char = e.data;
                    const nextVal = e.target.value + char;
                    if (field.charRegex && !field.charRegex.test(char))
                      e.preventDefault();
                    if (field.regex && !field.regex.test(nextVal))
                      e.preventDefault();
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    const nextVal = e.target.value + pasted;

                    // This single check is all you need.
                    if (field.regex && !field.regex.test(nextVal)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    onChange(name, e.target.value);
                    if (typeof subOnChange === "function") {
                      subOnChange(selectedValue);
                    }
                  }}
                  onBlur={onBlur}
                  {...rest}
                />
              ) : type === "radio" ? (
                <div className="flex flex-wrap items-center gap-4 mt-6">
                  {options.map((opt, i) => (
                    <label
                      key={i}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={name}
                        value={opt.value}
                        checked={value === opt.value}
                        onChange={(e) => {
                          onChange(name, e.target.value);
                          if (typeof subOnChange === "function") {
                            subOnChange(selectedValue);
                          }
                        }}
                        disabled={isDisabled}
                        {...rest}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <Input
                  label={label}
                  labelPlacement="outside"
                  variant="bordered"
                  isRequired={required}
                  isDisabled={isDisabled}
                  placeholder={placeholder || `Enter ${label}`}
                  className="w-full"
                  classNames={{ inputWrapper: "bg-white", label: "text-sm" }}
                  type={type}
                  value={value || ""}
                  maxLength={field.maxLength || undefined}
                  onBeforeInput={(e) => {
                    const char = e.data;
                    const nextVal = e.target.value + char;

                    // Prevent invalid single characters
                    if (field.charRegex && !field.charRegex.test(char))
                      e.preventDefault();
                    if (field.regex && !field.regex.test(nextVal))
                      e.preventDefault();
                  }}
                  onPaste={(e) => {
                    e.preventDefault(); // stop default browser paste

                    const pasted = e.clipboardData
                      .getData("text")
                      .replace(/[\r\n]/g, "");
                    const nextVal = e.target.value + pasted;

                    const maxLen =
                      field.maxLength ||
                      (field.regex?.source.match(/\{0,(\d+)\}/)?.[1] ?? 1000);

                    // Block if it exceeds length or fails regex
                    if (
                      nextVal.length > maxLen ||
                      (field.regex && !field.regex.test(nextVal))
                    ) {
                      return;
                    }

                    onChange(name, nextVal); // update controlled input manually
                  }}
                  onChange={(e) => {
                    onChange(name, e.target.value);
                    if (typeof subOnChange === "function")
                      subOnChange(selectedValue);
                  }}
                  onBlur={onBlur}
                  {...rest}
                />
              )}
              {validate_error && (
                <div className="mt-1 text-red-600 text-xs">{validate_error}</div>
              )}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
