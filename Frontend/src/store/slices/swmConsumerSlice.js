import { createSlice } from "@reduxjs/toolkit";
const data = {
      index:"",
      id: "",
      categoryTypeMasterId:"",
      subCategoryTypeMasterId:"",
      subCategoryList:[],
      category:"APL",
      occupancyTypeMasterId: "",
      ownerName: "",
      gender: "",
      guardianName: "",
      relationType: "",
      mobileNo: "",
      email: "",
      rate:"",
      lockStatus: false,
    };
const initialState = {
  swmConsumerDtl: [
    {...data}
  ],
};

const swmConsumerSlice = createSlice({
  name: "swmConsumer",
  initialState,
  reducers: {
    setSwmConsumerDtl(state, action) {
      state.swmConsumerDtl = action.payload;
    },
    clearSwmConsumerDtl(state) {
      state.swmConsumerDtl = [
        {...data}
      ];
    },
  },
});

export const { setSwmConsumerDtl, clearSwmConsumerDtl } = swmConsumerSlice.actions;
export default swmConsumerSlice.reducer;