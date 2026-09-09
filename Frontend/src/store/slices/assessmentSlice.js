import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  formData: {},
  lastUpdated: null
};

const assessmentSlice = createSlice({
  name: "assessment",
  initialState,
  reducers: {
    setFormData(state, action) {
      state.formData = { ...state.formData, ...action.payload };
      state.lastUpdated = Date.now();
    },
    clearForm(state) {
      state.formData = {};
      state.lastUpdated = null;
    }
  }
});

export const { setFormData, clearForm } = assessmentSlice.actions;
export default assessmentSlice.reducer;
