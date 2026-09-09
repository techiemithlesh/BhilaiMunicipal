import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getToken, getUserDetails } from "../../utils/auth";
import { collectionSummaryApi, UlbApi } from "../../api/endpoints";
import { formatLocalDate, toTitleCase } from "../../utils/common";

const getTodayDate = () => new Date().toISOString().split("T")[0];
const initialSummaryData = {
  paymentModeWise: [],
  totalCollection: 0,
  holdingCollection: [],
  safCollection: [],
  govtBuildingCollection: [],
  waterCollection: [],
  tradeCollection: [],
};

function RenderTable({ title, data, footer }) {
  return (
    <div className="mb-6">
      <div className="mb-2 font-bold">{title}</div>
      <table className="mb-2 border border-gray-300 w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 border text-left">Description</th>
            <th className="px-2 py-1 border text-left">Holding</th>
            <th className="px-2 py-1 border text-left">Transaction</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, key) => (
            <tr key={key}>
              <td className="px-2 py-1 border">{item?.key} Payment</td>
              <td className="px-2 py-1 border text-left">{item?.count}</td>
              <td className="px-2 py-1 border text-left">{item?.amount}</td>
            </tr>
          ))}
          <tr className="bg-gray-200 font-bold">
            <td className="px-2 py-1 border">Total</td>
            <td className="px-2 py-1 border text-left">{footer?.count}</td>
            <td className="px-2 py-1 border text-left">{footer?.amount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ModeWiseReport() {
  const token = getToken();
  const userDetails = getUserDetails();
  const [fromDate, setFromDate] = useState(getTodayDate());
  const [uptoDate, setUptoDate] = useState(getTodayDate());
  const [summaryData, setSummaryData] = useState(initialSummaryData);
  const [isLoading, setIsLoading] = useState(false);
  const [ulbData, setUlbData] = useState(null);
  const ulbId = userDetails?.ulbId;

  const fetchUlbDtl = useCallback(async () => {
    if (!ulbId) return;

    try {
      const res = await axios.post(UlbApi.replace("{id}", ulbId), {});
      const ulb = res?.data?.data;
      if (ulb) {
        setUlbData(ulb);
      }
    } catch (err) {
      setUlbData({ ulbName: "ULB Info Not Available" });
    }
  }, [ulbId]);

  const handleSearchSubmit = useCallback(async () => {
    setIsLoading(true);
    setSummaryData(initialSummaryData);

    try {
      const response = await axios.post(
        collectionSummaryApi,
        {
          fromDate: fromDate,
          uptoDate: uptoDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response?.data?.status) {
        const apiData = response?.data?.data;
        setSummaryData({ ...initialSummaryData, ...apiData });
      }
    } catch (error) {
      console.error("Search failed", error);
      setSummaryData(initialSummaryData);
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, uptoDate, token]);

  useEffect(() => {
    fetchUlbDtl();
  }, [fetchUlbDtl]);

  return (
    <div className="bg-white p-2 min-h-screen">
      {/* Header */}
      <div className="bg-purple-300 px-4 py-2 rounded-t-lg font-bold text-lg">
        Payment Mode Wise Collection Summery
      </div>

      {/* Search/Filter Controls */}
      <div className="flex flex-wrap items-end gap-4 bg-white px-4 py-4 border border-purple-300 rounded-b-lg">
        <div>
          <label className="block mb-1 font-semibold text-sm">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 border rounded w-40"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-sm">Upto Date</label>
          <input
            type="date"
            value={uptoDate}
            onChange={(e) => setUptoDate(e.target.value)}
            className="px-2 py-1 border rounded w-40"
          />
        </div>
        <button
          className="bg-black disabled:opacity-50 px-5 py-2 rounded font-semibold text-white"
          onClick={handleSearchSubmit}
          disabled={isLoading}
        >
          {isLoading ? "SEARCHING..." : "SEARCH"}
        </button>
      </div>

      {/* Result Section Header */}
      <div className="bg-blue-900 mt-6 px-4 py-2 rounded-t-lg font-bold text-white">
        Result
      </div>

      {/* Result Body */}
      <div className="bg-white px-4 py-6 border border-blue-900 rounded-b-lg">
        <div className="mb-4 text-center">
          <div className="mb-2 font-bold text-2xl">
            <u>{ulbData?.ulbName || "Loading ULB..."}</u>
          </div>
          <div className="font-semibold">
            Collection Report From {formatLocalDate(fromDate, "-")} To{" "}
            {formatLocalDate(uptoDate, "-")}
          </div>
          <div className="mt-2 font-bold text-xl">
            Total Collection: {summaryData.total?.amount || 0}
          </div>
        </div>

        {/* Payment Mode Wise Summary (Row/Divs) */}
        <div className="gap-4 grid grid-cols-2 mb-6">
          {summaryData.paymentModeWise.length > 0 ? (
            <>
              {(() => {
                const data = summaryData.paymentModeWise;
                const half = Math.ceil(data.length / 2);
                const firstHalf = data.slice(0, half);
                const secondHalf = data.slice(half);

                return (
                  <>
                    {/* FIRST COLUMN */}
                    <div>
                      {firstHalf.map((item, key) => (
                        <div key={key}>
                          Total{" "}
                          {item?.key?.length > 3
                            ? toTitleCase(item?.key)
                            : item?.key}{" "}
                          Collection: <b>{item?.amount || 0}</b>
                        </div>
                      ))}
                    </div>

                    {/* SECOND COLUMN */}
                    <div>
                      {secondHalf.map((item, key) => (
                        <div key={key}>
                          Total{" "}
                          {item?.key?.length > 3
                            ? toTitleCase(item?.key)
                            : item?.key}{" "}
                          Collection: <b>{item?.amount || 0}</b>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="col-span-2 text-gray-500 text-center">
              No payment mode wise data available.
            </div>
          )}
        </div>

        {/* Section Tables (Iterated) */}
        {summaryData?.table?.map((section) => (
          <RenderTable
            title={section?.title}
            data={section?.data}
            footer={section?.total}
          />
        ))}
      </div>
    </div>
  );
}
