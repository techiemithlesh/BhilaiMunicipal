import { combineReducers } from "@reduxjs/toolkit";
import assessmentReducer from "./slices/assessmentSlice";
import ownerReducer from "./slices/ownerSlice";
import swmConsumerReducer from "./slices/swmConsumerSlice";
import floorReducer from "./slices/floorSlice";
import wardReducer from "./slices/wardSlice";
import citizenAuthReducer from "./slices/citizenAuthSlice";
import tradeReducer from "./slices/tradeSlice";
import { citizenTradeReducer } from "./slices/citizenTradeSlice";

const rootReducer = combineReducers({
  citizenAuth: citizenAuthReducer,
  assessment: assessmentReducer,
  owner: ownerReducer,
  floor: floorReducer,
  ward: wardReducer,
  trade: tradeReducer,
  citizenTrade: citizenTradeReducer,
  swmConsumer:swmConsumerReducer,
});

export default rootReducer;
