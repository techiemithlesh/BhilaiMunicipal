import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import axios from "axios";
import { fetchWardList } from "../../../store/slices/wardSlice";
import { citizenPropertySearchApi } from "../../../api/endpoints";
import toast from "react-hot-toast";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const PropertySearch = () => {
  const dispatch = useDispatch();
  const [holdingNo, setHoldingNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [userData, setUserData] = useState(null);
  const token = useSelector((state) => state.citizenAuth.token);

  useEffect(() => {
    dispatch(fetchWardList());
  }, [dispatch]);

  const debouncedSearch = useCallback(
    debounce(async (holdingNo, mobileNo) => {
      try {
        const response = await axios.post(
          citizenPropertySearchApi,
          {
            holdingNo,
            mobileNo,
            ulbId: ulbId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { status, message, data } = response.data;
        if (status && data) {
          toast.success(message);
          setUserData(data);
        } else {
          toast.error(message || "No record found.");
          setUserData(null);
        }
      } catch (error) {
        toast.error("Search failed");
        setUserData(null);
      }
    }, 500),
    [token]
  );

  const onSearchSubmit = () => {
    debouncedSearch(holdingNo, mobileNo);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white shadow border border-blue-800 rounded-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="gap-4 grid grid-cols-1 md:grid-cols-4 p-4"
        >
          <label className="block font-medium text-sm">
            Enter Holding Number
            <input
              type="text"
              placeholder="Holding No"
              className="px-3 py-2 border rounded w-full"
              value={holdingNo}
              onChange={(e) => setHoldingNo(e.target.value)}
            />
          </label>

          <label className="block font-medium text-sm">
            Last 4 Digits of Mobile
            <input
              type="text"
              placeholder="e.g. 1234"
              maxLength={4}
              className="px-3 py-2 border rounded w-full"
              value={mobileNo}
              onChange={(e) =>
                setMobileNo(e.target.value.replace(/[^0-9]/g, ""))
              }
            />
          </label>

          <div className="flex justify-center items-center">
            <button
              type="submit"
              className="bg-success-400 hover:bg-gray-800 px-4 rounded-full h-8 text-white"
            >
              SEARCH
            </button>
          </div>
        </form>
      </div>
      {/* Card Section */}
      <div className="rounded-lg">
        {userData ? (
          <div className="bg-blue-50 shadow-md p-6 border border-blue-200 rounded-xl">
            <h3 className="mb-4 font-bold text-blue-800 text-lg">
              Property Details
            </h3>
            <div className="gap-x-8 gap-y-3 grid grid-cols-1 md:grid-cols-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Owner Name:</span>
                <span className="ml-2">{userData.ownerName || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Mobile No:</span>
                <span className="ml-2">{userData.mobileNo || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Holding No:</span>
                <span className="ml-2">
                  {userData.newHoldingNo || userData.holdingNo || "NA"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Assessment Type:
                </span>
                <span className="ml-2">{userData.assessmentType || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Property Type:
                </span>
                <span className="ml-2">{userData.propertyType || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Khata No:</span>
                <span className="ml-2">{userData.khataNo || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Plot No:</span>
                <span className="ml-2">{userData.plotNo || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Village/Mauja Name:
                </span>
                <span className="ml-2">
                  {userData.villageMaujaName || "NA"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-gray-700">Address:</span>
                <span className="ml-2">
                  {userData.propAddress || "NA"}, {userData.propCity || "NA"},{" "}
                  {userData.propDist || "NA"}, {userData.propState || "NA"},{" "}
                  {userData.propPinCode || "NA"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Circle:</span>
                <span className="ml-2">{userData.zone || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Ward No:</span>
                <span className="ml-2">
                  {userData.newWardNo || userData.wardNo || "NA"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Area of Plot (In Sqrft):
                </span>
                <span className="ml-2">{userData.areaOfPlot || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Electricity Consumer No:
                </span>
                <span className="ml-2">{userData.electConsumerNo || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Water Connection No:
                </span>
                <span className="ml-2">{userData.waterConnNo || "NA"}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Is Mobile Tower:
                </span>
                <span className="ml-2">
                  {userData.isMobileTower ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Is Hoarding Board:
                </span>
                <span className="ml-2">
                  {userData.isHoardingBoard ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Is Petrol Pump:
                </span>
                <span className="ml-2">
                  {userData.isPetrolPump ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">
                  Is Water Harvesting:
                </span>
                <span className="ml-2">
                  {userData.isWaterHarvesting ? "Yes" : "No"}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                // onClick={() =>
                //   navigate(`/holding/search/details/${userData.id}`)
                // }
              >
                Pay Taxes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow p-4 py-6 border border-blue-800 rounded-lg text-gray-500 text-center">
            {holdingNo || mobileNo
              ? "No records found."
              : "Search results will appear here."}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySearch;
