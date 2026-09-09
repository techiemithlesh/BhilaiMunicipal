export const validateFormFields = (fields, formData, parentKey = "") => {
  const errors = {};

  fields.forEach((field) => {
    const {
      name,
      label,
      required,
      regex,
      type,
      minLength,
      maxLength,
      isMulti,
      nestedFields, // 🔹 for subfields like ownerDtl
    } = field;

    const key = parentKey ? `${parentKey}.${name}` : name;
    const value = formData[name];

    // -----------------------
    // 🔹 1️⃣ Nested Array Validation (like ownerDtl)
    // -----------------------
    if (Array.isArray(value) && nestedFields?.length) {
      value.forEach((nestedItem, index) => {
        const nestedErrors = validateFormFields(
          nestedFields,
          nestedItem,
          `${name}[${index}]`
        );
        Object.assign(errors, nestedErrors);
      });
      return; // skip rest for nested array container
    }

    // -----------------------
    // 🔹 2️⃣ Required Field Check
    // -----------------------
    if (required) {
      if (isMulti && (!value || value.length === 0)) {
        errors[key] = `${label} is required`;
        return;
      }

      if (value === undefined || value === null || value === "") {
        errors[key] = `${label} is required`;
        return;
      }
    }

    // -----------------------
    // 🔹 3️⃣ Regex Check
    // -----------------------
    if (regex && value && !regex.test(value)) {
      errors[key] = `Invalid ${label}`;
      return;
    }

    // -----------------------
    // 🔹 4️⃣ Email Check
    // -----------------------
    if (type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        errors[key] = "Enter a valid email address";
        return;
      }
    }

    // -----------------------
    // 🔹 5️⃣ Number Check
    // -----------------------
    if (type === "number" && value !== "" && isNaN(value)) {
      errors[key] = `${label} must be a valid number`;
      return;
    }

    // -----------------------
    // 🔹 6️⃣ Min/Max Length Check
    // -----------------------
    if (value && minLength && value.length < minLength) {
      errors[key] = `${label} must be at least ${minLength} characters`;
      return;
    }

    if (value && maxLength && value.length > maxLength) {
      errors[key] = `${label} must be less than ${maxLength} characters`;
      return;
    }
  });

  return errors;
};
