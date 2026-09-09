import React, { useState } from 'react';
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { monthWisePropDemandDueApi } from '../../../api/endpoints';
import DataTableFullData from '../../../components/common/DataTableFullData';

function MonthWiseCreatedProp() {
    const token = getToken();
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [isFrozen, setIsFrozen] = useState(false);

    // 1. Fixed: Initialize with YYYY-MM for the 'month' input type
    const currentMonth = new Date().toISOString().slice(0, 7); 
    const [fromDate, setFromDate] = useState(currentMonth);
    const [toDate, setToDate] = useState(currentMonth);

    const headers = [
        { label: "#", key: "serial" },
        { label: "Month", key: "month" },
        { label: "Total Property", key: "totalProperty" },
        { label: "Existing Property", key: "totalExistingProperty" },
        { label: "New Property", key: "totalNewAssessProperty" },
        { label: "Total Demand Property", key: "demandTotalProperty" },
        { label: "Total Demand", key: "totalTax" },
        { label: "Total Balance Property", key: "dueProperty" },
        { label: "Total Balance", key: "balanceTax" },
    ];

    const renderRow = (item, index) => (
        <tr key={index} className="hover:bg-gray-50">
            <td className="px-3 py-2 border">{index + 1}</td>
            <td className="px-3 py-2 border">{item?.month}</td>
            <td className="px-3 py-2 border">{item?.totalProperty}</td>
            <td className="px-3 py-2 border">{item?.totalExistingProperty}</td>
            <td className="px-3 py-2 border">{item?.totalNewAssessProperty}</td>
            <td className="px-3 py-2 border">{item?.demandTotalProperty}</td>
            <td className="px-3 py-2 border">{item?.totalTax}</td>
            <td className="px-3 py-2 border">{item?.dueProperty}</td>
            <td className="px-3 py-2 border">{item?.balanceTax}</td>            
        </tr>
    );

    const renderFooter = (totals) => (
        <tr className="bg-gray-200 border-t font-bold">
            <td className="px-3 py-2 border text-center">Total</td>
            <td className="px-3 py-2 border">{totals?.totalMonths || 0}</td>
            <td className="px-3 py-2 border">{totals?.totalProperty || 0}</td>
            <td className="px-3 py-2 border">{totals?.totalExistingProperty || 0}</td>
            <td className="px-3 py-2 border">{totals?.totalNewAssessProperty || 0}</td>
            <td className="px-3 py-2 border">{totals?.demandTotalProperty || 0}</td>
            <td className="px-3 py-2 border">{totals?.totalTax || 0}</td>
            <td className="px-3 py-2 border">{totals?.dueProperty || 0}</td>
            <td className="px-3 py-2 border">{totals?.balanceTax || 0}</td>
        </tr>
    );

    const fetchData = async () => {
        setIsFrozen(true);
        try {
            // 2. Fixed: Convert YYYY-MM to YYYY-MM-DD for the backend
            const payload = {
                fromDate: `${fromDate}-01`,
                uptoDate: `${toDate}-01`, 
            };

            const response = await axios.post(
                monthWisePropDemandDueApi,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // 3. Fixed: Accessing nested data based on your API response structure
            const result = response.data?.data;
            setSummary(result?.summary || {});
            setDataList(result?.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsFrozen(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Loading Overlay logic */}
            {isFrozen && (
                <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
                    <span className="text-blue-500 font-bold">Loading...</span>
                </div>
            )}

            <div className={`gap-4 grid grid-cols-1 md:grid-cols-4 ${isFrozen ? "blur-sm" : ""}`}>
                <div>
                    <label className="block text-sm font-medium">From Month</label>
                    <input
                        type="month"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="px-2 py-1 border rounded w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">UpTo Month</label>
                    <input
                        type="month"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="px-2 py-1 border rounded w-full"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={fetchData}
                        disabled={isFrozen}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-1.5 rounded text-white transition-colors"
                    >
                        Search
                    </button>
                </div>
            </div>

            <DataTableFullData
                title="Month Wise Property Demand Due"
                headers={headers}
                renderRow={renderRow}
                footerRow={renderFooter(summary)}
                data={dataList}
                startingItemsPerPage={10}
                isExport={true}
            />
        </div>
    );
}

export default MonthWiseCreatedProp;