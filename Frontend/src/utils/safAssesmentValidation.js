import {
  validateAppartment,
  validateAreOfPlot,
  validateCurrDist,
  validateCurreCity,
  validateCurrentAddress,
  validateCurrPinCode,
  validateCurrState,
  validateElectricAccount,
  validateElectricBindBookNo,
  validateElectricCategory,
  validateFlatRegistryDate,
  validateHoardingArea,
  validateHoardingInstallationDate,
  validateKhataNo,
  validateMaujaName,
  validateNewWardNo,
  validateOldWardNo,
  validateOwnershipType,
  validatePinCode,
  validatePlotNo,
  validatePropAddress,
  validatePropCity,
  validatePropDist,
  validatePropertyType,
  validatePropState,
  validateRoadWidth,
  validateTowerArea,
  validateTowerInstallationDate,
  validateWaterConnectionDate,
  validateWaterConnectionNo,
  validateZone,
} from "./validation";

export const validateFormData = (name, value, formData) => {
  let errorMessage = "";

  switch (name) {
    case "wardMstrId":
      errorMessage = validateOldWardNo(value);
      break;

    case "newWardMstrId":
      if (formData.wardMstrId !== "") {
        errorMessage = validateNewWardNo(value);
      }
      break;

    case "ownershipTypeMstrId":
      errorMessage = validateOwnershipType(value);
      break;

    case "propTypeMstrId":
      errorMessage = validatePropertyType(value);
      break;

    case "appartmentDetailsId":
      if (formData.propTypeMstrId == 3 && !value) {
        errorMessage = validateAppartment(value);
      }
      break;

    case "flatRegistryDate":
      if (value !== "") {
        errorMessage = validateFlatRegistryDate(value);
      }
      break;

    case "zoneMstrId":
      errorMessage = validateZone(value);
      break;

    case "electConsumerNo":
      if (formData.electAccNo === "" && !value) {
        errorMessage =
          "Electric Khata No is required in case no Electric Account No / Bind Book No";
      }
      break;

    case "electAccNo":
      if (formData.electConsumerNo === "" && !value) {
        errorMessage = validateElectricAccount(value);
      }
      break;

    case "electBindBookNo":
      if (formData.electConsumerNo === "" && !value) {
        errorMessage = validateElectricBindBookNo(value);
      }
      break;

    case "electConsCategory":
      errorMessage = validateElectricCategory(value);
      break;

    case "propAddress":
      errorMessage = validatePropAddress(value);
      break;
    case "propCity":
      errorMessage = validatePropCity(value);
      break;

    case "propDist":
      errorMessage = validatePropDist(value);
      break;

    case "propState":
      errorMessage = validatePropState(value);
      break;

    case "propPinCode":
      errorMessage = validatePinCode(value);
      break;

    case "corrAddress":
      if (formData.isCorrAddDiffer === 1) {
        errorMessage = validateCurrentAddress(value);
      }
      break;

    case "corrCity":
      if (formData.isCorrAddDiffer === 1) {
        errorMessage = validateCurreCity(value);
      }
      break;

    case "corrDist":
      if (formData.isCorrAddDiffer === 1) {
        errorMessage = validateCurrDist(value);
      }
      break;

    case "corrState":
      if (formData.isCorrAddDiffer === 1) {
        errorMessage = validateCurrState(value);
      }
      break;

    case "corrPinCode":
      if (formData.isCorrAddDiffer === 1) {
        errorMessage = validateCurrPinCode(value);
      }
      break;

    case "khataNo":
      errorMessage = validateKhataNo(value);
      break;

    case "plotNo":
      errorMessage = validatePlotNo(value);
      break;

    case "villageMaujaName":
      errorMessage = validateMaujaName(value);
      break;

    case "areaOfPlot":
      errorMessage = validateAreOfPlot(value);
      break;

    case "roadWith":
      errorMessage = validateRoadWidth(value);
      break;

    case "waterConnNo":
      errorMessage = validateWaterConnectionNo(value);
      break;

    // case "waterConnDate":
    //   errorMessage = validateWaterConnectionDate(value);
    //   break;

    case "towerArea":
      if (formData.isMobileTower === "1") {
        errorMessage = validateTowerArea(value);
      }
      break;

    case "towerInstallationDate":
      if (formData.isMobileTower === "1") {
        errorMessage = validateTowerInstallationDate(value);
      }
      break;

    case "hoardingArea":
      if (formData.isHoardingBoard === "1") {
        errorMessage = validateHoardingArea(value);
      }
      break;

    case "hoardingInstallationDate":
      if (formData.isHoardingBoard === "1") {
        errorMessage = validateHoardingInstallationDate(value);
      }

    case "waterHarvestingDate":
      if (formData.isWaterHarvesting === "1") {
        errorMessage = validateWaterConnectionDate(value);
      }

      break;

    default:
      break;
  }

  return errorMessage;
};

function getOrdinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function isEmptyOrWhitespace(str) {
  return !str || /^\s*$/.test(str);
}

export const validateOwnerDtl = (owner, index) => {
  let errors = [];

  if (!owner) {
    errors.owner = `Owner details are missing`;
    return errors;
  }

  if (isEmptyOrWhitespace(owner.ownerName)) {
    errors.ownerName = `Name is required`;
  }

  if (isEmptyOrWhitespace(owner.dob)) {
    // errors.dob = `Date of birth is required`;
  } else {
    const today = new Date();
    const dobDate = new Date(owner.dob);

    // Remove time part to compare only dates
    today.setHours(0, 0, 0, 0);
    dobDate.setHours(0, 0, 0, 0);

    // Date 10 years ago
    // const tenYearsAgo = new Date();
    // tenYearsAgo.setFullYear(today.getFullYear() - 10);

    if (dobDate > today) {
      errors.dob = `birth cannot be in the future`;
    }
  }

  if (isEmptyOrWhitespace(owner.guardianName)) {
    errors.guardianName = `Guardian name is required`;
  }

  if (isEmptyOrWhitespace(owner.relationType)) {
    errors.relationType = `Relation is required`;
  }

  if (isEmptyOrWhitespace(owner.mobileNo)) {
    errors.mobileNo = "Mobile no is required";
  } else if (!/^[6-9]\d{9}$/.test(owner.mobileNo)) {
    errors.mobileNo = "Enter a valid 10-digit mobile number starting with 6-9";
  }

  if (!isEmptyOrWhitespace(owner.email)) {
    // Only validate if email is not empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(owner.email)) {
      errors.email = `Email is not valid`;
    }
  }

  if (
    isEmptyOrWhitespace(owner.aadhaarNo) &&
    isEmptyOrWhitespace(owner.panNo)
  ) {
    errors.identification = `Owner must provide either Aadhaar or PAN number`;
  } else {
    // If Aadhaar is provided, validate its format (assuming 12 digits)
    if (
      !isEmptyOrWhitespace(owner.aadhaarNo) &&
      !/^\d{12}$/.test(owner.aadhaarNo)
    ) {
      errors.aadhaarNo = `Aadhaar number should be 12 digits`;
    }

    // If PAN is provided, validate its format (assuming 10 alphanumeric characters)
    if (
      !isEmptyOrWhitespace(owner.panNo) &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(owner.panNo)
    ) {
      errors.panNo = `PAN number should be in the correct format (e.g., ABCDE1234F)`;
    }
  }

  return errors;
};

export const validateFloorDtl = (floor, index, formData) => {
  let errors = [];

  if (!(formData.propTypeMstrId == 4 && formData.propTypeMstrId !== "")) {
    if (isEmptyOrWhitespace(floor.floorMasterId)) {
      errors.floorMasterId = `${getOrdinal(index + 1)} Floort is required`;
    }

    if (isEmptyOrWhitespace(floor.usageTypeMasterId)) {
      errors.usageTypeMasterId = `${getOrdinal(
        index + 1
      )} Floor's Usage Type is required`;
    }

    if (isEmptyOrWhitespace(floor.usageTypeMasterId)) {
      errors.usageTypeMasterId = `${getOrdinal(
        index + 1
      )} Floor's Usage Type is required`;
    }

    if (isEmptyOrWhitespace(floor.occupancyTypeMasterId)) {
      errors.occupancyTypeMasterId = `${getOrdinal(
        index + 1
      )} Floor's Occupancy Type is required`;
    }

    if (isEmptyOrWhitespace(floor.constructionTypeMasterId)) {
      errors.constructionTypeMasterId = `${getOrdinal(
        index + 1
      )} Floor's Constructon Type is required`;
    }

    if (isEmptyOrWhitespace(floor.builtupArea)) {
      errors.builtupArea = `${getOrdinal(
        index + 1
      )} Floor's Builtup Area is required`;
    }

    const dateFrom = floor.dateFrom ? new Date(floor.dateFrom) : null;
    const dateUpto = floor.dateUpto ? new Date(floor.dateUpto) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isEmptyOrWhitespace(floor.dateFrom)) {
      errors.dateFrom = `${getOrdinal(
        index + 1
      )} Floor's From Date is required`;
    }

    if (!isEmptyOrWhitespace(floor.dateUpto)) {
      const dateUpto = new Date(floor.dateUpto);

      // Check if the dateUpto is a valid date and in the future
      if (isNaN(dateUpto.getTime())) {
        errors.dateUpto = `${getOrdinal(index + 1)} Invalid Date Format`;
      } else if (dateUpto > today) {
        errors.dateUpto = `${getOrdinal(
          index + 1
        )} Floor's Upto date can not be in future`;
      }

      // NEW: Comparison Logic (From Date should not be greater than Upto Date)
      if (dateFrom && !isNaN(dateFrom.getTime()) && dateFrom > dateUpto) {
        errors.dateFrom = `${getOrdinal(
          index + 1
        )} From Date cannot be later than Upto Date`;
      }
    }
  }

  return errors;
};
