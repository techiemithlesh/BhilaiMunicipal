import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchTradeMstrData } from "../../../utils/commonFunc";
import axios from "axios";
import { tradeApplicationDetailsApi } from "../../../api/endpoints";
import { setTradeFormData } from "../../../store/slices/citizenTradeSlice";
import TradeSearchDetails from "./TradeSearchDetails";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;
export default function RenewLicense() {
  const token = useSelector((state) => state.citizenAuth.token);
  const { id, applicationType } = useParams();
  const dispatch = useDispatch();
  const [mstrData, setMstrData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTradeMstrData(setMstrData, token);
  }, [token]);

  const fetchLicenseDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        tradeApplicationDetailsApi,
        { id: id, ulbId: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === true) {
        const d = response.data.data;

        // Map API response to tradeFormData structure
        const mapped = {
          applicationType: applicationType,
          firmTypeId: d.firmTypeId?.toString() ?? null,
          ownershipTypeId: d.ownershipTypeId?.toString() ?? null,
          priviesLicenseId: d.priviesLicenseId?.toString() ?? null,
          wardMstrId: d.wardMstrId?.toString() ?? null,
          newWardMstrId: d.newWardMstrId?.toString() ?? null,
          firmName: d.firmName ?? "",
          firmDescription: d.firmDescription ?? "",
          firmEstablishmentDate: d.firmEstablishmentDate ?? "",
          premisesOwnerName: d.premisesOwnerName ?? "",
          areaInSqft: d.areaInSqft ?? "",
          address: d.address ?? "",
          pinCode: d.pinCode ?? "",
          licenseForYears: d.licenseForYears?.toString() ?? "",
          isTobaccoLicense: d.isTobaccoLicense ? 1 : 0,
          holdingNo: d.holdingNo ?? "",
          natureOfBusiness:
            typeof d.natureOfBusiness === "string" &&
            d.natureOfBusiness.trim() !== ""
              ? d.natureOfBusiness
                  .split(",")
                  .map((item) => ({
                    tradeItemTypeId: mstrData.itemType
                      ?.find((ele) => ele.tradeItem.trim() === item.trim())
                      ?.id.toString(),
                  }))
                  .filter(Boolean) // Remove undefined if not found
              : [],
          ownerDtl: Array.isArray(d.owners)
            ? d.owners.map((o) => ({
                ownerName: o.ownerName ?? "",
                guardianName: o.guardianName ?? "",
                mobileNo: o.mobileNo ?? "",
                emailId: o.email ?? "",
              }))
            : [],
          taxDetails: d.taxDetails ?? {},
        };
        dispatch(setTradeFormData(mapped));
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching license details:", error);
    }
    setIsLoading(false);
  };

  // Fetch details on mount
  useEffect(() => {
    if (mstrData.itemType) {
      fetchLicenseDetails();
    }
    // eslint-disable-next-line
  }, [id, token, mstrData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="inline-block border-4 border-t-transparent border-blue-600 rounded-full w-8 h-8 animate-spin"></span>
        <span className="ml-4 font-semibold text-blue-600">Loading...</span>
      </div>
    );
  }
  return <TradeSearchDetails />;
}
