import axios from "axios";
import { getNewWardByOldWardApi, getTradeMstrDataApi } from "../api/endpoints";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

export const fetchNewWardByOldWard = async (wardMstrId, token, ulbID) => {
  const payLoad = { oldWardId: `${wardMstrId}` };
  if (ulbID) payLoad.ulbID = ulbID;

  try {
    const response = await axios.post(getNewWardByOldWardApi, payLoad, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response?.data?.status ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching new ward:", error);
    return [];
  }
};

export const fetchTradeMstrData = async (
  setState,
  token,
  payload = {},
  setLoading = () => {}
) => {
  try {
    setLoading(true); // start loading
    const res = await axios.post(getTradeMstrDataApi, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data.status) {
      setState(res.data.data);
    } else {
      console.warn("API responded with status=false", res.data);
    }
  } catch (error) {
    console.error("Error fetching master data:", error);
  } finally {
    setLoading(false); // stop loading always
  }
};

export const fetchCitizenNewWardByOldWard = async (wardMstrId, token) => {
  try {
    const response = await axios.post(
      getNewWardByOldWardApi,
      { oldWardId: `${wardMstrId}`, ulbID: ulbId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response?.data?.status ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching new ward:", error);
    return [];
  }
};

export const preparePayload = (formData) => {
  return {
    applicationType: formData.applicationType,
    firmTypeId: Number(formData.firmTypeId),
    ownershipTypeId: Number(formData.ownershipTypeId),
    wardMstrId: Number(formData.wardMstrId),
    newWardMstrId: Number(formData.newWardMstrId),
    firmName: formData.firmName,
    firmDescription: formData.firmDescription,
    firmEstablishmentDate: formData.firmEstablishmentDate,
    premisesOwnerName: formData.premisesOwnerName,
    areaInSqft: formData.areaInSqft,
    address: formData.address,
    landmark: formData.landmark,
    pinCode: formData.pinCode,
    licenseForYears: formData.licenseForYears,
    isTobaccoLicense: 0,
    holdingNo: formData.holdingNo,
    natureOfBusiness: (formData.natureOfBusiness || []).map((n) => ({
      tradeItemTypeId: String(n.tradeItemTypeId),
    })),
    ownerDtl: (formData.ownerDtl || []).map((o) => ({
      ownerName: o.ownerName,
      guardianName: o.guardianName,
      mobileNo: o.mobileNo,
    })),
  };
};
