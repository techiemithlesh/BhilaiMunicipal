import { clearForm } from "./assessmentSlice";

let timeoutId = null;

export const assessmentMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // If data is updated, restart the real-time countdown
  if (action.type === "assessment/setFormData") {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      store.dispatch(clearForm());
    }, 15 * 60 * 1000); 
  }

  return result;
};