import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import rootReducer from "./rootReducer";
import expireTransform from "./slices/expireTransform";
import { assessmentMiddleware } from "./slices/assessmentMiddleware";

const persistConfig = {
  key: "root",
  storage,
  transforms: [expireTransform], // Add this line
  whitelist: [
    "citizenAuth",
    "citizenTrade",
    "assessment",
    "owner",
    "floor",
    "ward",
    "trade",
    "swmConsumer",
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(assessmentMiddleware), // Handles real-time inactivity,
});

export const persistor = persistStore(store);
