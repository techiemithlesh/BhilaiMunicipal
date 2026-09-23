import React, { useEffect, useMemo, useState } from 'react'
import { getToken } from '../../../utils/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { getWardListApi, swmConsumerVisitingApi } from '../../../api/endpoints';
import { formatLocalDate, formatTimeAMPM } from '../../../utils/common';
import Select from 'react-select';
import CommonTable from '../../../components/common/CommonTable';
import axios from 'axios';
import { FaEye } from 'react-icons/fa';

function VisitingReport() {
    const token = getToken();
    const [searchParams, setSearchParams] = useSearchParams();

    const today = new Date().toISOString().split("T")[0];
    const [fromDate, setFromDate] = useState(
        searchParams.get("fromDate") || today
    );
    const [toDate, setToDate] = useState(searchParams.get("uptoDate") || today);
    const [wardId, setWardId] = useState(
        searchParams.get("wardId")
            ? searchParams.get("wardId").split(",").map(Number)
            : []
    );
    const [wardList, setWardList] = useState([]);
    const [dataList, setDataList] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

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
                swmConsumerVisitingApi,
                {
                    page,
                    perPage: itemsPerPage,
                    key: search.trim() || null,
                    ...filters,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const list = res.data.data || {};
            setDataList(list.data || []);
            setTotalPage(list.lastPage || 1);
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
                swmConsumerVisitingApi,
                {
                    page: 1,
                    perPage: totalItem,
                    key: search.trim() || null,
                    ...filters,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return (res.data.data?.data || []).map((item) => ({
                ...item,
                fromUpto: `${item.fromFyear} (${item.fromQtr}) / ${item.uptoFyear} (${item.uptoQtr})`,
            }));
        } catch (err) {
            console.error("Error fetching all data for export:", err);
            return [];
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    const headers = [
        { label: "#", key: "serial" },
        { label: "Ward No.", key: "wardNo" },
        { label: "Consumer No.", key: "consumerNo" },
        { label: "Holding No.", key: "holdingNo" },
        { label: "Owner Name", key: "ownerName" },
        { label: "Mobile No.", key: "mobileNo" },
        { label: "Date", key: "visitingDate" },
        { label: "Time", key: "visitingTime" },
        { label: "Action", key: "action" },
    ];

    const renderRow = (item, index, currentPage, perPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 border">
                {(currentPage - 1) * perPage + index + 1}
            </td>
            <td className="px-3 py-2 border">{item.wardNo}</td>
            <td className="px-3 py-2 border">{item.consumerNo}</td>
            <td className="px-3 py-2 border">{item.holdingNo}</td>
            <td className="px-3 py-2 border">{item.ownerName}</td>
            <td className="px-3 py-2 border">{item.mobileNo}</td>
            <td className="px-3 py-2 border">{formatLocalDate(item.visitingDate, '-')}</td>
            <td className="px-3 py-2 border">{formatTimeAMPM(item.visitingDate + ":" + item.visitingTime)}</td>
            <td className="flex items-center gap-2 px-3 py-2 border">
                <Link
                    to={`/swm/dtl/${item.consumerId}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                >
                    <FaEye className="w-5 h-5" />
                </Link>
            </td>
        </tr>
    );

    const filterComponent = (
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
        </div>
    );

    

    return (
        <div
            className={`${
            isFrozen ? "pointer-events-none filter blur-sm" : ""
            } w-full space-y-4`}
        >
            <CommonTable
            title="Visiting Report"
            data={dataList}
            headers={headers}
            renderRow={renderRow}
            totalPages={totalPage}
            currentPage={page}
            setPageNo={setPage}
            totalItem={totalItem}
            setItemsPerPage={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            isSearchInput={false}
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            fetchAllData={fetchAllData}
            filterComponent={filterComponent}
            />
        </div>
    )
}

export default VisitingReport
