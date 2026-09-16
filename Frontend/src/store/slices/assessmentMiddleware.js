// import { clearForm } from "./assessmentSlice";

// let timeoutId = null;

// export const assessmentMiddleware = (store) => (next) => (action) => {
//   const result = next(action);

//   // If data is updated, restart the real-time countdown
//   if (action.type === "assessment/setFormData") {
//     if (timeoutId) clearTimeout(timeoutId);

//     timeoutId = setTimeout(() => {
//       store.dispatch(clearForm());
//     }, 15 * 60 * 1000); 
//   }

//   return result;
// };

import { clearForm, setFormData } from "./assessmentSlice";
import { clearFloorDtl, setFloorDtl } from "./floorSlice";
import { clearOwnerDtl, setOwnerDtl } from "./ownerSlice";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const assessmentMiddleware = (store) => {
  let timeoutId = null;

  return (next) => (action) => {
    const result = next(action);console.log("result",result);

    // List of action types that should reset the inactivity timer
    const formUpdateActions = [
      setFormData?.type,
      setFloorDtl?.type,
      setOwnerDtl?.type,
    ];

    if (formUpdateActions.includes(action.type)) {console.log("timeoutId",timeoutId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        store.dispatch(clearForm());
        store.dispatch(clearOwnerDtl());
        store.dispatch(clearFloorDtl());
      }, IDLE_TIMEOUT_MS);
    }

    return result;
  };
};