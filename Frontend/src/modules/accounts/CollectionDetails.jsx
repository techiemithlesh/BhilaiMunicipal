import { useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { cashUserApi, cashVerificationApi } from "../../api/endpoints";
import { getToken } from "../../utils/auth";
import axios from "axios";
import { formatLocalDate } from "../../utils/common";
import SectionCard from "../../components/common/SectionCard";
import toast from "react-hot-toast";

const updateCheckStatus = (data, isChecked) => {
  if (!data) return [];
  return data.map((item) => ({
    ...item,
    isChecked: item?.verificationStatus ? false : isChecked,
  }));
};

const CollectionDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = getToken();
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [uptoDate, setUptoDate] = useState(searchParams.get("uptoDate") || "");
  const [userId, setUserId] = useState(searchParams.get("userId") || null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [summary, setSummary] = useState([]);
  const [userDtl, setUserDtl] = useState({});
  const [responseData, setResponseData] = useState(null);

  // 1. NEW STATE: To track the master checkbox state
  const [isAllChecked, setIsAllChecked] = useState(false);

  // 2. NEW STATE: To manage the checkbox state of individual rows
  const [collectionData, setCollectionData] = useState({
    property: [],
    water: [],
    trade: [],
  });

  const colors = ["bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-red-200"];

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        cashUserApi,
        { fromDate, uptoDate, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setResponseData(data);
        setSummary(data?.paymentModeSummary);
        setUserDtl(data?.userDtl);
        // Initialize the collection data with a new 'isChecked' flag set to false
        setCollectionData({
          property: updateCheckStatus(data?.property, false),
          water: updateCheckStatus(data?.water, false),
          trade: updateCheckStatus(data?.trade, false),
        });
      }
    } catch (err) {
      console.error("Error fetching pending list:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, uptoDate, userId]);

  const handleCheckAll = (e) => {
    const checked = e.target.checked;
    setIsAllChecked(checked);

    // Update all data arrays to reflect the master checkbox state
    setCollectionData((prev) => ({
      property: updateCheckStatus(prev.property, checked),
      water: updateCheckStatus(prev.water, checked),
      trade: updateCheckStatus(prev.trade, checked),
    }));
  };

  const handleRowCheck = (type, index) => {
    setCollectionData((prev) => {
      const newArray = [...prev[type]];
      const currentItem = newArray[index];
      newArray[index] = { ...currentItem, isChecked: !currentItem.isChecked };

      // Logic to update the master "Check All" checkbox status
      const allItems = [...newArray, ...prev.water, ...prev.trade];
      const allChecked = allItems.every((item) => item.isChecked);
      setIsAllChecked(allChecked);

      return { ...prev, [type]: newArray };
    });
  };

  const handleVerify = async () => {
    // Helper function to process one array (e.g., 'property')
    const prepareCategoryPayload = (categoryData) => {
      if (!categoryData) return [];
      return categoryData
        .filter((item) => item.isChecked) // Keep only the checked items
        .map((item) => ({
          id: item.id,
        }));
    };

    const payload = {
      property: prepareCategoryPayload(collectionData.property),
      water: prepareCategoryPayload(collectionData.water),
      trade: prepareCategoryPayload(collectionData.trade),
    };
    //  validation if no items are selected
    const totalChecked =
      payload.property.length + payload.water.length + payload.trade.length;
    if (totalChecked === 0) {
      toast.error("Please select at least one transaction to verify.");
      return;
    }

    setIsFrozen(true);
    try {
      const response = await axios.post(cashVerificationApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        toast.success(response.data?.message);
        fetchData();
      } else {
        toast.error(
          "Verification failed: " + (response.data.message || "Unknown error.")
        );
      }
    } catch (error) {
      toast.error("Verification error:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  // Helper to render rows for a specific data type
  const renderTableRows = (type) => (item, idx) =>
    (
      <tr key={idx}>
        <td className="px-3 py-2 border">
          {item?.verificationStatus ? (
            ""
          ) : (
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={item.isChecked || false}
              onChange={() => handleRowCheck(type, idx)}
            />
          )}
        </td>
        <td className="px-3 py-2 border">{item?.tranNo}</td>
        <td className="px-3 py-2 border">{item?.paymentMode}</td>
        <td className="px-3 py-2 border">{item?.appNo}</td>
        <td className="px-3 py-2 border">{item?.chequeNo}</td>
        <td className="px-3 py-2 border">{item?.chequeDate}</td>
        <td className="px-3 py-2 border">{item?.bankName}</td>
        <td className="px-3 py-2 border">{item?.branchName}</td>
        <td className="px-3 py-2 border">{item?.payableAmt}</td>
        <td className="px-3 py-2 border">
          {item.verificationStatus ? (
            <FaCheckCircle className="text-green-600" size={18} />
          ) : (
            <FaTimesCircle className="text-red-600" size={18} />
          )}
        </td>
        <td className="px-3 py-2 border">{item?.verifiedByUserName}</td>
        <td className="px-3 py-2 border">{item?.verifyDate}</td>
      </tr>
    );

  const commonHeaders = [
    "#",
    "Transaction No",
    "Payment Mode",
    "App No",
    "Cheque No",
    "Cheque Date",
    "Bank Name",
    "Branch Name",
    "Amount",
    "Verify Status",
    "Verified By",
    "Verified On",
  ];
  return (
    <div
      className={`${
        isFrozen ? "pointer-events-none filter blur-sm" : ""
      } bg-white shadow-md p-6 rounded-lg`}
    >
      <h2 className="bg-blue-900 mb-4 px-4 py-2 rounded font-bold text-white text-lg">
        TC Collection Details
      </h2>

      {/* Collector Info - Using Flex for Layout */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b">
        {/* Details on Left */}
        <div className="space-y-1 text-sm">
          <p>
            <b>Collector Name :</b> {userDtl?.name}
          </p>
          <p>
            <b>Transaction Date :</b> {formatLocalDate(fromDate)} To{" "}
            {formatLocalDate(uptoDate)}
          </p>
          <p>
            <b>Total Amount :</b> {responseData?.totalAmount}
          </p>
        </div>

        {/* Image on Right */}
        <div>
          <img
            src={userDtl?.userImg}
            alt="Collector Image"
            // onClick={() => openPreviewModel(userDtl?.userImg)} // Keep this if you have the function defined
            className="shadow-md border-2 border-gray-300 rounded-lg w-20 h-20 object-cover cursor-pointer"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="gap-4 grid grid-cols-4 mb-6">
        {summary?.map((item, i) => {
          const colorClass = colors[i % 4];
          return (
            <div
              key={i}
              className={`p-4 rounded-lg text-center font-bold shadow ${colorClass}`}
            >
              <p className="text-2xl">{item?.amount}</p>
              <p className="uppercase">{item?.mode}</p>
            </div>
          );
        })}
      </div>

      {/* Tables */}
      <div className="space-y-6 w-full">
        {/* property */}
        <SectionCard
          title={`Property Payment - Total No of Transaction: ${collectionData?.property?.length}, Total Amount: ${responseData?.propertyAmount} `}
          headers={commonHeaders}
          data={collectionData?.property}
          renderRow={renderTableRows("property")}
        />
        {/* water */}
        <SectionCard
          title={`Water Payment - Total No of Transaction: ${collectionData?.water?.length}, Total Amount: ${responseData?.waterAmount} `}
          headers={commonHeaders}
          data={collectionData?.water}
          renderRow={renderTableRows("water")}
        />
        {/* trade */}
        <SectionCard
          title={`Trade Payment - Total No of Transaction: ${collectionData?.trade?.length}, Total Amount: ${responseData?.tradeAmount} `}
          headers={commonHeaders}
          data={collectionData?.trade}
          renderRow={renderTableRows("trade")}
        />
      </div>

      {/* Footer actions */}
      <div className="flex justify-between items-center mt-6">
        <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={isAllChecked}
            onChange={handleCheckAll}
          />
          Check All Transactions
        </label>
        <button
          className="bg-blue-600 hover:bg-blue-700 shadow px-4 py-2 rounded text-white"
          onClick={handleVerify} // ⭐️ ATTACH THE NEW HANDLER
        >
          Verify Now
        </button>
      </div>
    </div>
  );
};

export default CollectionDetails;
