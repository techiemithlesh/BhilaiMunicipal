import { useState } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { formatLocalDate } from '../../utils/common';
import DataTableFullData from '../../components/common/DataTableFullData';
import { dateWiseCollectionApi } from '../../api/endpoints';

function DateWiseCollection() {
    const token = getToken();
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [isFrozen, setIsFrozen] = useState(false);
    const [fromDate, setFromDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

    const headers = [
        { label: "#", key: "serial" },
        { label: "Date", key: "date" },
        { label: "Property", key: "propertyAmount" },
        { label: "Total Property", key: "totalProperty" },
        { label: "Saf", key: "safAmount" },
        { label: "Total Saf", key: "totalSaf" },
        { label: "Water", key: "waterAmount" },
        { label: "Total Water", key: "totalWater" },
        { label: "Trade", key: "tradeAmount" },
        { label: "Total Trade", key: "totalTrade" },
        { label: "Total", key: "totalAmount" },
    ];

    const renderRow = (item, index) => (
        <tr
        key={item.id}
        className={`hover:bg-gray-50`}
        >
            <td className="px-3 py-2 border">
                {index + 1}
            </td>
            <td className="px-3 py-2 border">{formatLocalDate(item?.date)}</td>
            <td className="px-3 py-2 border">{item?.propertyAmount}</td>
            <td className="px-3 py-2 border">{item?.totalProperty}</td>
            <td className="px-3 py-2 border">{item?.safAmount}</td>
            <td className="px-3 py-2 border">{item?.totalSaf}</td>
            <td className="px-3 py-2 border">{item?.waterAmount}</td>
            <td className="px-3 py-2 border">{item?.totalWater}</td>
            <td className="px-3 py-2 border">{item?.tradeAmount}</td>
            <td className="px-3 py-2 border">{item?.totalTrade}</td>
            <td className="px-3 py-2 border">{item.totalAmount}</td>
        
        </tr>
    );

    const renderFooter = (totals) => (
        <tr className="bg-gray-200 border-t font-bold">
            <td className="px-3 py-2 border text-center">
                Total
            </td>
            <td className="px-3 py-2 border">{totals.total}</td>
            <td className="px-3 py-2 border">{totals.propertyAmount}</td>
            <td className="px-3 py-2 border">{totals.totalProperty}</td>
            <td className="px-3 py-2 border">{totals.safAmount}</td>
            <td className="px-3 py-2 border">{totals.totalSaf}</td>
            <td className="px-3 py-2 border">{totals.waterAmount}</td>
            <td className="px-3 py-2 border">{totals.totalWater}</td>
            <td className="px-3 py-2 border">{totals.tradeAmount}</td>
            <td className="px-3 py-2 border">{totals.totalTrade}</td>
            <td className="px-3 py-2 border">{totals.totalAmount}</td>
        </tr>
    );
    const footerData = [
            { content: 'Total' }, 
            { content: summary?.total },
            { content: summary?.propertyAmount },
            { content: summary?.totalProperty },
            { content: summary?.safAmount },
            { content: summary?.totalSaf },
            { content: summary?.waterAmount },
            { content: summary?.totalWater },
            { content: summary?.tradeAmount },
            { content: summary?.totalTrade },
            { content: summary?.totalAmount },
        ]; 

    const summaryHeader = (
        <div className="flex flex-col items-center justify-center gap-2 text-sm rounded-sm text-center">
            <p className="text-gray-800 font-semibold">
            Collection Report From {formatLocalDate(summary?.fromDate)} to {formatLocalDate(summary?.uptoDate)}
            </p>
            <p className="text-gray-800 font-semibold">
            Total Collection:{" "}
            <span className="text-green-700 font-bold">
                ₹ {summary?.totalAmount}
            </span>
            </p>
        </div>
    );



    

    const fetchData = async () => {
        setIsFrozen(true);
        try {
        const response = await axios.post(
            dateWiseCollectionApi,
            {
                fromDate:fromDate,
                uptoDate:toDate,
            },
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );
        setSummary(response.data.data?.summary || {});
        setDataList(response.data.data?.data || []);
        } catch (error) {
            console.error("Error fetching menu list:", error);
        } finally {
            setIsFrozen(false);
        }
    };

    const handleSearch = () => {
        fetchData();
    };

  return (
    <div
      className={`${
        isFrozen ? "pointer-events-none filter blur-sm" : ""
      } w-full space-y-4`}
    >
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
            <div>
                <label className="block text-sm">From Date</label>
                <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2 py-1 border rounded w-full"
                />
            </div>
            <div>
                <label className="block text-sm">To Date</label>
                <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2 py-1 border rounded w-full"
                />
            </div>
            <div className="flex justify-end items-center gap-2 ml-auto w-full md:w-1/3">            
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 px-3 py-1 rounded text-white whitespace-nowrap"
                >
                    Search
                </button>
            </div>
        </div>
        <DataTableFullData
            title="Date Wise Collection Details"
            summaryData={summaryHeader}
            headers={headers}
            renderRow={renderRow}
            footerRow={renderFooter(summary)}
            footerData = {footerData}
            data={dataList}
            startingItemsPerPage={10}
            isExport={true}
        />
    </div>
  )
}

export default DateWiseCollection
