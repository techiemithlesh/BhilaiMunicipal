import { createTransform } from "redux-persist";

const expireTransform = createTransform(
  // 1. Transform state being incoming (saving to storage)
  (inboundState) => inboundState,
  
  // 2. Transform state being outgoing (retrieving from storage)
  (outboundState, key) => {
    console.log("name.......",key);
    if (key === "assessment" && outboundState.lastUpdated) {
      const fifteenMinutes = 1.5 * 60 * 1000;
      const now = Date.now();
      console.log("now...",now);
    console.log("resetting...",outboundState.lastUpdated);
    console.log("test...",now - outboundState.lastUpdated > fifteenMinutes);
      if (now - outboundState.lastUpdated > fifteenMinutes) {
        console.log("Assessment data expired, resetting...");
        return { formData: {}, lastUpdated: null }; // Return initial state
      }
    }
    return outboundState;
  },
  // Apply this specifically to the assessment slice
  { whitelist: ["assessment"] }
);

export default expireTransform;