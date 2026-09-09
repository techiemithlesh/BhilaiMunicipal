export const defaultFormFields = {
  isMobileTower: false,
  isHoardingBoard: false,
  isPetrolPump: false,
  isWaterHarvesting: false,
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
