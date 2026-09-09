import React, { useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { dateWiseApplySafApi } from '../../../api/endpoints';
import { formatLocalDate } from '../../../utils/common';
import DataTableFullData from '../../../components/common/DataTableFullData';

function DateWiseApplySaf() {
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
        { label: "Total Property", key: "totalProperty" },
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
            <td className="px-3 py-2 border">{item?.totalProperty}</td>
        
        </tr>
    );

    const renderFooter = (totals) => (
        <tr className="bg-gray-200 border-t font-bold">
            <td className="px-3 py-2 border text-center">
                Total
            </td>
            <td className="px-3 py-2 border">{totals.total}</td>
            <td className="px-3 py-2 border">{totals.totalProperty}</td>
        </tr>
    );

    const summaryHeader = (
        <div className="flex flex-col items-center justify-center gap-2 text-sm rounded-sm text-center">
            <p className="text-gray-800 font-semibold">
            Saf Apply Report From {formatLocalDate(summary?.fromDate)} to {formatLocalDate(summary?.uptoDate)}
            </p>
            <p className="text-gray-800 font-semibold">
            Total Apply:{" "}
            <span className="text-green-700 font-bold">
                ₹ {summary?.totalProperty}
            </span>
            </p>
        </div>
    );


    const fetchData = async () => {
        setIsFrozen(true);
        try {
        const response = await axios.post(
            dateWiseApplySafApi,
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
            title="Date Wise Apply Saf"
            summaryData={summaryHeader}
            headers={headers}
            renderRow={renderRow}
            footerRow={renderFooter(summary)}
            data={dataList}
            startingItemsPerPage={10}
            isExport={true}
        />
    </div>
  )
}

export default DateWiseApplySaf
