export const validateFirstName = (firstName) => {
  if (!firstName.trim()) {
    return "FirstName is required";
  }
  return "";
};

export const validateMiddleName = (middleName) => {
  if (!middleName.trim()) {
    return "MiddleName is required";
  }
  return "";
};

export const validateLastName = (lastName) => {
  if (!lastName.trim()) {
    return "LastName is required";
  }
  return "";
};

export const validateGuardianName = (guardianName) => {
  if (!guardianName.trim()) {
    return "Guardian Name is required";
  }
  return "";
};

export const valiateGneder = (gender) => {
  if (!gender.trim()) {
    return "Gender is required";
  }
  return "";
};

export const validatePhoneNo = (phoneNo) => {
  if (!phoneNo.trim()) {
    return "Phone No is required";
  }

  const phoneRegex = /^[0-9]{10}$/;

  if (!phoneRegex.test(phoneNo)) {
    return "Invalid phone number format";
  }

  return null;
};

export const validateEmail = (email) => {
  if (!email.trim()) {
    return "Email id is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }
  return "";
};

export const validateUsername = (username) => {
  if (!username) {
    return "Username is required";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters long";
  }
  return "";
};

export const validatePassword = (password) => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  return "";
};

export const validateLoginPassword = (password) => {
  if (!password) {
    return "Password is required";
  }
  return "";
};

export const validateAssementType = (assementType) => {
  if (!assementType.trim()) {
    return "Assesment Type is required";
  }

  return "";
};

export const validateHoldingOldAndNew = (holding_no) => {
  if (!holding_no.trim()) {
    return "Holding No is Required";
  }
  return "";
};

export const validateOldWardNo = (wardMstrId) => {
  if (!wardMstrId.trim()) {
    return "Old Ward No is required";
  }

  return "";
};

export const validateNewWardNo = (newWardMstrId) => {
  if (!newWardMstrId.trim()) {
    return "New Ward No is required";
  }

  return "";
};

export const validateCurrPinCode = (corrPinCode) => {
  const pinRegex = /^[0-9]{10}$/;
  if (!corrPinCode.trim()) {
    return "Pincode is Required";
  }

  if (!pinRegex.test(corrPinCode)) {
    ("Pincode should be a number");
  }

  if (corrPinCode.length > 6) {
    return "Pincode should be in 6 Digit";
  }

  if (corrPinCode.length < 6) {
    return "Pincode should not be more than 6 Digit";
  }

  return "";
};

export const validateOwnershipType = (ownershipTypeMstrId) => {
  if (!ownershipTypeMstrId.trim()) {
    return "Ownship Type is required";
  }

  return "";
};

export const validatePropertyType = (propTypeMstrId) => {
  if (!propTypeMstrId.trim()) {
    return "Property Type is required";
  }
  return "";
};

export const validatePropState = (propState) => {
  if (!propState.trim()) {
    return "Property State is required";
  }
  return "";
};

export const validateCurrState = (corrState) => {
  if (!corrState.trim()) {
    return "Current State is required";
  }
};

export const validateAppartment = (appartmentDetailsId) => {
  if (!appartmentDetailsId.trim()) {
    return "Appartment is required";
  }
  return "";
};

export const validateRoadWidth = (roadWith) => {
  const numRegex = /^[0-9]+$/;

  if (!roadWith.trim()) {
    return "Road width is required.";
  }

  if (!numRegex.test(roadWith)) {
    return "Enter road width in numbers.";
  }

  return "";
};

export const valiateOldHoldingNo = (previousHoldingId) => {
  if (!previousHoldingId.trim()) {
    return "Previous Holding No is required";
  }

  return "";
};

export const validateZone = (zoneMstrId) => {
  if (!zoneMstrId.trim()) {
    return "Zone is required";
  }
  return "";
};

export const validateKhataNo = (khataNo) => {
  if (!khataNo.trim()) {
    return "Khata no is required";
  }

  return "";
};

export const validatePlotNo = (plotNo) => {
  if (!plotNo.trim()) {
    return "Plot No is required";
  }

  return "";
};

export const validateMaujaName = (villageMaujaName) => {
  if (!villageMaujaName.trim()) {
    return "Vilage/Mauja is required";
  }

  return "";
};

export const validateAreOfPlot = (areaOfPlot) => {
  if (!areaOfPlot.trim()) {
    return "Area of Plot is required";
  }

  return "";
};

export const validatePropAddress = (propAddress) => {
  if (!propAddress.trim()) {
    return "Property Address is required";
  }

  return "";
};

export const validateCurrentAddress = (corrAddress) => {
  if (!corrAddress.trim()) {
    return "Current Property Address is required";
  }
  return "";
};

export const validatePropCity = (propCity) => {
  if (!propCity.trim()) {
    return "City is required";
  }

  return "";
};

export const validateCurreCity = (corrCity) => {
  if (!corrCity.trim()) {
    return "Current city is required";
  }
};

export const validatePropDist = (propDist) => {
  if (!propDist.trim()) {
    return "District is required";
  }

  return "";
};

export const validateCurrDist = (corrDist) => {
  if (!corrDist.trim()) {
    return "Current District is required";
  }

  return "";
};

export const validatePinCode = (propPinCode) => {
  const pinRegex = /^[0-9]{10}$/;
  if (!propPinCode.trim()) {
    return "Pincode is Required";
  }

  if (!pinRegex.test(propPinCode)) {
    ("Pincode should be a number");
  }

  if (propPinCode.length > 6) {
    return "Pincode should be in 6 Digit";
  }

  if (propPinCode.length < 6) {
    return "Pincode should not be more than 6 Digit";
  }

  return "";
};

export const validateState = (propState) => {
  if (!propState.trim()) {
    return "State is required";
  }

  return "";
};

export const validateFlatRegistryDate = (flatRegistryDate) => {
  // First, try to parse the date
  let inputDate;

  // Try parsing as YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(flatRegistryDate)) {
    inputDate = new Date(flatRegistryDate);
  }
  // Try parsing as DD/MM/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(flatRegistryDate)) {
    const [day, month, year] = flatRegistryDate.split("/");
    inputDate = new Date(year, month - 1, day);
  }
  // Try parsing as MM/DD/YYYY
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(flatRegistryDate)) {
    const [month, day, year] = flatRegistryDate.split("/");
    inputDate = new Date(year, month - 1, day);
  }
  // If none of the above formats match, try using the browser's date parsing
  else {
    inputDate = new Date(flatRegistryDate);
  }

  // Check if the date is valid
  if (isNaN(inputDate.getTime())) {
    return "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY";
  }

  const currentDate = new Date();

  // Check if the date is in the future
  if (inputDate > currentDate) {
    return "Flat Registry date cannot be in the future";
  }

  // If we've made it this far, the date is valid
  return null;
};

export const validateElectricAccount = (electAccNo) => {
  if (!electAccNo.trim()) {
    return "Electric Account no is required";
  }
  return "";
};

export const validateElectricBindBookNo = (electBindBookNo) => {
  if (!electBindBookNo.trim()) {
    return "Electric Bind Book No is required";
  }
  return "";
};

export const validateElectricCategory = (electConsCategory) => {
  if (!electConsCategory.trim()) {
    return "Electric Category is required";
  }
  return "";
};

export const validateWaterConnectionNo = (waterConnNo) => {
  if (!waterConnNo.trim()) {
    return "Water Connection is required";
  }
  return "";
};

export const validateWaterConnectionDate = (waterConnDate) => {
  if (!waterConnDate.trim()) {
    let inputDate;

    if (/^\d{4}-\d{2}-\d{2}$/.test(waterConnDate)) {
      inputDate = new Date(waterConnDate);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(waterConnDate)) {
      const [day, month, year] = waterConnDate.split("/");
      inputDate = new Date(year, month - 1, day);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(waterConnDate)) {
      const [month, day, year] = waterConnDate.split("/");
      inputDate = new Date(year, month - 1, day);
    } else {
      inputDate = new Date(waterConnDate);
    }

    if (isNaN(inputDate.getTime())) {
      return "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY";
    }

    const currentDate = new Date();

    if (inputDate > currentDate) {
      return "Water Connection date cannot be in the future";
    }
  }

  // If we've made it this far, the date is valid
  return null;
};

export const validateTowerArea = (towerArea) => {
  if (!towerArea.trim()) {
    return "Mobile Tower area is required";
  }
  return "";
};

export const validateTowerInstallationDate = (towerInstallationDate) => {
  let inputDate;

  if (/^\d{4}-\d{2}-\d{2}$/.test(towerInstallationDate)) {
    inputDate = new Date(towerInstallationDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(towerInstallationDate)) {
    const [day, month, year] = towerInstallationDate.split("/");
    inputDate = new Date(year, month - 1, day);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(towerInstallationDate)) {
    const [month, day, year] = towerInstallationDate.split("/");
    inputDate = new Date(year, month - 1, day);
  } else {
    inputDate = new Date(towerInstallationDate);
  }

  if (isNaN(inputDate.getTime())) {
    return "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY";
  }

  const currentDate = new Date();

  if (inputDate > currentDate) {
    return "Tower Installation date cannot be in the future";
  }

  // If we've made it this far, the date is valid
  return null;
};

export const validateHoardingArea = (hoardingArea) => {
  if (!hoardingArea.trim()) {
    return "Hoarding area is required";
  }
  return "";
};

export const validateHoardingInstallationDate = (hoardingInstallationDate) => {
  let inputDate;

  if (/^\d{4}-\d{2}-\d{2}$/.test(hoardingInstallationDate)) {
    inputDate = new Date(hoardingInstallationDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(hoardingInstallationDate)) {
    const [day, month, year] = hoardingInstallationDate.split("/");
    inputDate = new Date(year, month - 1, day);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(hoardingInstallationDate)) {
    const [month, day, year] = towerInstallationDate.split("/");
    inputDate = new Date(year, month - 1, day);
  } else {
    inputDate = new Date(hoardingInstallationDate);
  }

  if (isNaN(inputDate.getTime())) {
    return "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY";
  }

  const currentDate = new Date();

  if (inputDate > currentDate) {
    return "Hoarding Installation date cannot be in the future";
  }

  // If we've made it this far, the date is valid
  return null;
};

export const validateWaterHarvestingDate = (waterHarvestingDate) => {
  let inputDate;

  if (/^\d{4}-\d{2}-\d{2}$/.test(waterHarvestingDate)) {
    inputDate = new Date(waterHarvestingDate);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(waterHarvestingDate)) {
    const [day, month, year] = waterHarvestingDate.split("/");
    inputDate = new Date(year, month - 1, day);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(waterHarvestingDate)) {
    const [month, day, year] = towerInstallationDate.split("/");
    inputDate = new Date(year, month - 1, day);
  } else {
    inputDate = new Date(waterHarvestingDate);
  }

  if (isNaN(inputDate.getTime())) {
    return "Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY";
  }

  const currentDate = new Date();

  if (inputDate > currentDate) {
    return "Water Harvesting date cannot be in the future";
  }

  return null;
};

/**
 * Validates form data against defined rules.
 * @param {Object} formData - The data from the form.
 * @param {Object} rules - Validation rules for each field.
 * @returns {Object} - An object containing error messages per field.
 */
export const validateForm = (formData, rules) => {
  const errors = {};

  for (const field in rules) {
    const value = formData[field] || '';
    const fieldRules = rules[field];

    if (fieldRules.required && !value.trim()) {
      errors[field] = fieldRules.requiredMessage || `${formatField(field)} is required.`;
      continue;
    }

    if (fieldRules.regex && !fieldRules.regex.test(value)) {
      errors[field] = fieldRules.regexMessage || `${formatField(field)} format is invalid.`;
    }

    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = fieldRules.minLengthMessage || `${formatField(field)} must be at least ${fieldRules.minLength} characters.`;
    }

    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = fieldRules.maxLengthMessage || `${formatField(field)} must be no more than ${fieldRules.maxLength} characters.`;
    }
  }

  return errors;
};

const formatField = (field) =>
  field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());


