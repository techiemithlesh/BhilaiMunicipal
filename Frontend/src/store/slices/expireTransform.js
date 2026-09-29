import { createTransform } from "redux-persist";

const expireTransform = createTransform(
  // 1. Transform state being incoming (saving to storage)
  (inboundState) => inboundState,
  
  // 2. Transform state being outgoing (retrieving from storage)
  (outboundState, key) => {
    
    if (key === "assessment" && outboundState.lastUpdated) {
      const fifteenMinutes = 1.5 * 60 * 1000;
      const now = Date.now();
      if (now - outboundState.lastUpdated > fifteenMinutes) {
        return { formData: {}, lastUpdated: null };
      }
    }
    return outboundState;
  },
  // Apply this specifically to the assessment slice
  { whitelist: ["assessment"] }
);

export default expireTransform;