import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  floorDtl: [{ id: 1 }],
};

const floorSlice = createSlice({
  name: "floor",
  initialState,
  reducers: {
    setFloorDtl(state, action) {
      state.floorDtl = action.payload;
    },
    clearFloorDtl(state) {
      state.floorDtl = [{ id: 1 }];
    },
  },
});

export const { setFloorDtl, clearFloorDtl } = floorSlice.actions;
export default floorSlice.reducer;
