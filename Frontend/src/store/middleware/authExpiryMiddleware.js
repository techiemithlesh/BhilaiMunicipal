// import { logout } from "../slices/citizenAuthSlice";

// const authExpiryMiddleware = (storeAPI) => (next) => (action) => {
//   // Avoid triggering on logout to prevent recursion
//   if (action.type !== logout.type) {
//     const state = storeAPI.getState();
//     const { token, expiry } = state.citizenAuth;

//     if (token && expiry) {
//       const currentTime = Date.now();
//       if (currentTime >= expiry) {
//         console.warn("Token expired. Logging out...");
//         storeAPI.dispatch(logout());
//       }
//     }
//   }

//   return next(action);
// };

// export default authExpiryMiddleware;
