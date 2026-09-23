import React, { useEffect, useMemo, useState } from 'react'
import { getToken } from '../../../utils/auth';
import { getWardListApi, swmDateWiseVisitingApi } from '../../../api/endpoints';
import axios from 'axios';
import { formatLocalDate } from '../../../utils/common';
import Select from 'react-select';
import DataTableFullData from '../../../components/common/DataTableFullData';

function DateWiseVisitingReport() {
    const token = getToken();
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [wardList, setWardList] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    const [totalItem, setTotalItem] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [wardId, setWardId] = useState([]);

    const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

    const filters = useMemo(
        () => ({
            fromDate: fromDate || "",
            uptoDate: toDate || "",
            wardId,
        }),
        [fromDate, toDate, wardId]
    );

    useEffect(() => {
        if (token) fetchWardList();
    }, [token]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, page, itemsPerPage]);

    const fetchWardList = async () => {
        try {
            const response = await axios.get(getWardListApi, {
                headers: { Authorization: `Bearer ${token}` },
                params: { all: true },
            });
            if (response?.data?.status) {
                setWardList(response?.data?.data);
            }
        } catch (error) {
            console.error("Error fetching Ward list:", error);
        }
    };

    const fetchData = async () => {
        setIsFrozen(true);
        try {
            const res = await axios.post(
                swmDateWiseVisitingApi,
                {
                    page,
                    perPage: itemsPerPage,
                    key: search.trim() || null,
                    ...filters,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const list = res.data.data || {};
            setDataList(list.data || []);
            setSummary(list.summary || {});
            setTotalItem(list.total || 0);

        } catch (err) {
            console.error("Error fetching collection report:", err);
        } finally {
            setIsFrozen(false);
        }
    };

    const fetchAllData = async () => {
        try {
            const res = await axios.post(
                swmDateWiseVisitingApi,
                {
                    page: 1,
                    perPage: totalItem,
                    key: search.trim() || null,
                    ...filters,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            return res.data.data?.data || [];
        } catch (err) {
            console.error("Error fetching all data for export:", err);
            return [];
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    // ---------------------------- TABLE HEADERS ---------------------------
    const headers = [
        { label: "#", key: "serial" },
        { label: "Date", key: "date" },
        { label: "Count", key: "consumer" },
    ];

    // ---------------------------- TABLE ROWS ------------------------------
    const renderRow = (item, index) => {
        const href = `/swm/report/consumer-visiting?fromDate=${item?.date}&uptoDate=${item?.date}&wardId=${wardId}`;

        return (
            <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border">{index + 1}</td>

                <td className="px-3 py-2 border">
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        {formatLocalDate(item?.date)}
                    </a>
                </td>

                <td className="px-3 py-2 border">{item?.consumer}</td>
            </tr>
        );
    };

    // ---------------------------- FOOTER ------------------------------
    const renderFooter = (totals) => (
        <tr className="bg-gray-200 border-t font-bold">
            <td className="px-3 py-2 border text-center">Total</td>
            <td className="px-3 py-2 border">{totals.total}</td>
            <td className="px-3 py-2 border">{totals.consumer}</td>
        </tr>
    );

    // ---------------------------- SUMMARY HEADER ------------------------
    const summaryHeader = (
        <div className="flex flex-col items-center justify-center gap-2 text-sm rounded-sm text-center">
            <p className="text-gray-800 font-semibold">
                Visiting Report From {formatLocalDate(summary?.fromDate)} to {formatLocalDate(summary?.uptoDate)}
            </p>
            <p className="text-gray-800 font-semibold">
                Total Visited:{" "}
                <span className="text-green-700 font-bold">{summary?.consumer}</span>
            </p>
        </div>
    );

    return (
        <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""} w-full space-y-4`}>
            {/* Filters */}
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

                <div>
                    <label className="block text-sm">Ward No.</label>
                    <Select
                        isMulti
                        options={wardList.map((w) => ({ value: w.id, label: w.wardNo }))}
                        value={wardList
                            .filter((w) => wardId.includes(w.id))
                            .map((w) => ({ value: w.id, label: w.wardNo }))}
                        onChange={(selected) => setWardId(selected.map((opt) => opt.value))}
                        placeholder="Select Ward(s)..."
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

            {/* Table */}
            <DataTableFullData
                title="Date Wise Visiting"
                summaryData={summaryHeader}
                headers={headers}
                renderRow={renderRow}
                footerRow={renderFooter(summary)}
                data={dataList}
                startingItemsPerPage={10}
                showingItem={[10, 15, 50, 100, 500, 1000]}
                isExport={true}
                fetchAllData={fetchAllData}
            />
        </div>
    );
}

export default DateWiseVisitingReport;
