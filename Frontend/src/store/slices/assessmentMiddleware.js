
import { clearForm, setFormData } from "./assessmentSlice";
import { clearFloorDtl, setFloorDtl } from "./floorSlice";
import { clearOwnerDtl, setOwnerDtl } from "./ownerSlice";

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

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