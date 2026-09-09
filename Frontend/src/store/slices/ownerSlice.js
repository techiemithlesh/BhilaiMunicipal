import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  OwnerDtl: [
    {
      id: "",
      safDetailId: "",
      ownerName: "",
      gender: "",
      dob: "",
      guardianName: "",
      relationType: "",
      aadharNo: "",
      mobileNo: "",
      email: "",
      panNo: "",
      isArmedForce: false,
      isSpeciallyAbled: false,
      lockStatus: false,
      oldId: "",
      userId: "",
      createdAt: "",
      updatedAt: "",
    },
  ],
};

const ownerSlice = createSlice({
  name: "owner",
  initialState,
  reducers: {
    setOwnerDtl(state, action) {
      state.OwnerDtl = action.payload;
    },
    clearOwnerDtl(state) {
      state.OwnerDtl = [
        {
          id: "",
          safDetailId: "",
          ownerName: "",
          gender: "",
          dob: "",
          guardianName: "",
          relationType: "",
          aadharNo: "",
          mobileNo: "",
          email: "",
          panNo: "",
          isArmedForce: false,
          isSpeciallyAbled: false,
          lockStatus: false,
          oldId: "",
          userId: "",
          createdAt: "",
          updatedAt: "",
        },
      ];
    },
  },
});

export const { setOwnerDtl, clearOwnerDtl } = ownerSlice.actions;
export default ownerSlice.reducer;
