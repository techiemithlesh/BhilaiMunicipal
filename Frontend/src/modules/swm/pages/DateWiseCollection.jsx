import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import { formatLocalDate } from '../../../utils/common';
import axios from 'axios';
import DataTableFullData from '../../../components/common/DataTableFullData';
import { swmDateWiseCollectionApi } from '../../../api/endpoints';
import { update } from 'lodash';

function DateWiseCollection() {
    const token = getToken();
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isFrozen, setIsFrozen] = useState(false);
    const [fromDate, setFromDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

    const headers = [
        { label: "#", key: "serial" },
        { label: "Date", key: "date" },
        { label: "Count", key: "count" },
        { label: "Amount", key: "amount" },
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
            <td className="px-3 py-2 border">{item?.count}</td>
            <td className="px-3 py-2 border">{item.amount}</td>
        
        </tr>
    );

    const renderFooter = (totals) => (
        <tr className="bg-gray-200 border-t font-bold">
            <td className="px-3 py-2 border text-center">
                Total
            </td>
            <td className="px-3 py-2 border">{totals.total}</td>
            <td className="px-3 py-2 border">{totals.count}</td>
            <td className="px-3 py-2 border">{totals.amount}</td>
        </tr>
    );

    const summaryHeader = (
        <div className="flex flex-col items-center justify-center gap-2 text-sm rounded-sm text-center">
            <p className="text-gray-800 font-semibold">
            Collection Report From {formatLocalDate(summary?.fromDate)} to {formatLocalDate(summary?.uptoDate)}
            </p>
            <p className="text-gray-800 font-semibold">
            Total Collection:{" "}
            <span className="text-green-700 font-bold">
                ₹ {summary?.amount}
            </span>
            </p>
        </div>
    );



    

    const fetchData = async () => {
        setIsFrozen(true);
        try {
        const response = await axios.post(
            swmDateWiseCollectionApi,
            {
                fromDate:fromDate,
                update:toDate,
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
        setPage(1);
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
            data={dataList}
            startingItemsPerPage={10}
            showingItem={[10, 15, 50, 100, 500, 1000]}
            isExport={true}
        />
    </div>
  )
}

export default DateWiseCollection
