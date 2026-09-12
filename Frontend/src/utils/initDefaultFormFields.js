export const defaultFormFields = {
  isMobileTower: false,
  isHoardingBoard: false,
  isPetrolPump: false,
  isWaterHarvesting: false,
  isWidow: false,
  isSchool: false,
  isComplex: false,
  isDp: false,
  isExArmy: false,
  isDisabledPerson: false,
  isOldProperty: false,
  isChabutra: false,
  isShopHolding: false,
  isBpl: false,
};

export function applyDefaults(currentData) {
  const updated = { ...currentData };
  for (const key in defaultFormFields) {
    if (updated[key] === undefined) {
      updated[key] = defaultFormFields[key];
    }
  }
  return updated;
}
