import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tradeFormData: {
    applicationType: "NEW LICENSE",
    firmTypeId: null,
    ownershipTypeId: null,
    wardMstrId: null,
    newWardMstrId: null,
    firmName: "",
    firmDescription: "",
    firmEstablishmentDate: "",
    premisesOwnerName: "",
    areaInSqft: "",
    address: "",
    pinCode: "",
    licenseForYears: "",
    isTobaccoLicense: 0,
    holdingNo: "",
    natureOfBusiness: [], // to hold [{ tradeItemTypeId: "1" }, ...]
    ownerDtl: [
      {
        ownerName: "",
        guardianName: "",
        mobileNo: "",
      },
    ], // to hold [{ ownerName, guardianName, mobileNo }, ...]
    taxDetails: {},
  },
};

const tradeSlice = createSlice({
  name: "trade",
  initialState,
  reducers: {
    setTradeFormData(state, action) {
      state.tradeFormData = { ...state.tradeFormData, ...action.payload };
    },
    updateFormField(state, action) {
      const { name, value } = action.payload;
      if (["licenseForYears","areaInSqft","firmEstablishmentDate","applicationType","isTobaccoLicense"].includes(name)  && value =="") {
        
        ["licenseCharge","arrearCharge","currentCharge","latePenalty","totalCharge"].map((item)=>{state.tradeFormData[item] = value});
      }
      if (name == "natureOfBusiness") {
        state.tradeFormData[name] = Array.isArray(value)
          ? value.map((ele) => ({
              tradeItemTypeId: ele?.value || ele?.tradeItemTypeId || ele,
            }))
          : [];
        return; 
      }
      state.tradeFormData[name] = value;
    },
    updateOwnerDetail(state, action) {
      const { index, name, value } = action.payload;
      if (state.tradeFormData.ownerDtl[index]) {
        state.tradeFormData.ownerDtl[index][name] = value;
      }
    },
    addOwner(state) {
      state.tradeFormData.ownerDtl.push({
        ownerName: "",
        guardianName: "",
        mobileNo: "",
        emailId: "",
      });
    },
    deleteOwner(state, action) {
      state.tradeFormData.ownerDtl.splice(action.payload, 1);
    },
    setNatureOfBusiness(state, action) {
      state.tradeFormData.natureOfBusiness = action.payload.map(
        (tradeItemTypeId) => ({
          tradeItemTypeId,
        })
      );
    },
    clearFormData(state) {
      state.tradeFormData = { ...initialState.tradeFormData };
    },
  },
});

export const {
  setTradeFormData,
  updateFormField,
  updateOwnerDetail,
  addOwner,
  deleteOwner,
  setNatureOfBusiness,
  clearFormData,
} = tradeSlice.actions;

export default tradeSlice.reducer;
