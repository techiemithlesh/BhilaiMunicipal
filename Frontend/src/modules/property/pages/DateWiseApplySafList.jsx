import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../../../utils/auth';
import { formatLocalDate } from '../../../utils/common';
import { Link, useSearchParams } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import axios from 'axios';
import { dateWiseApplySafListApi, getWardListApi } from '../../../api/endpoints';
import Select from "react-select";
import CommonTable from '../../../components/common/CommonTable';

function DateWiseApplySafList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const token = getToken();
    const [dataList, setDataList] = useState([]);
    const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || new Date().toISOString().split("T")[0]);
    const [toDate, setToDate] = useState(searchParams.get("toDate") || new Date().toISOString().split("T")[0]);
    const [wardId, setWardId] = useState([]);
    const [wardList, setWardList] = useState([]);

    const [isFrozen, setIsFrozen] = useState(false);
    const [isWardLoading, setIsWardLoading] = useState(false);

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

    const fetchData = async (customFilters = null) => {
        setIsFrozen(true);
        try {
            const res = await axios.post(
                dateWiseApplySafListApi,
                {
                    page,
                    perPage: itemsPerPage,
                    key: search.trim() || null,
                    ...(customFilters || filters),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const list = res.data.data || {};
            setDataList(list.data || []);
            setTotalPage(list.lastPage || 1);
            setTotalItem(list.total || 0);
        } catch (error) {
            console.error("Error fetching menu list:", error);
        } finally {
            setIsFrozen(false);
        }
    };

    const initFiltersAndFetchData = async () => {
        try {
            setIsWardLoading(true);

            // Added 'await' here
            const wardRes = await axios.get(getWardListApi, {
                headers: { Authorization: `Bearer ${token}` },
                params: { all: true },
            });

            const wardIds = searchParams.getAll("wardId[]").map(Number);

            if (wardRes?.data?.status) {
                const wardOpts = wardRes.data.data.map((w) => ({
                    value: w.id,
                    label: w.wardNo,
                }));
                setWardList(wardOpts);
                setWardId(wardIds);
            }

            // Fixed the array truthy trap using .length > 0
            if (
                searchParams.get("fromDate") || 
                searchParams.get("toDate") || 
                searchParams.getAll("wardId[]").length > 0
            ) {
                await fetchData({
                    fromDate: searchParams.get("fromDate") || "",
                    uptoDate: searchParams.get("toDate") || "",
                    wardId: wardIds,
                });
            }
        } catch (err) {
            console.error("Error initializing filters and data:", err);
        } finally {
            setIsWardLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            setIsFrozen(true);
            initFiltersAndFetchData();
        }
    }, [token]);

    useEffect(() => {
        // Skip pagination fetch on initial render if initFiltersAndFetchData already triggered it
        if (token) {
            fetchData();
        }
    }, [page, itemsPerPage]);

    const fetchAllData = async (customFilters = null) => {
        try {
            const res = await axios.post(
                dateWiseApplySafListApi,
                {
                    page: 1,
                    perPage: totalItem,
                    key: search.trim() || null,
                    ...(customFilters || filters),
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
        { label: "Ward No", key: "wardNo" },
        { label: "SAF No", key: "safNo" },
        { label: "Owner Name", key: "ownerName" },
        { label: "Guardian Name", key: "guardianName" },
        { label: "Mobile No", key: "mobileNo" },
        { label: "Property Type", key: "propertyType" },
        { label: "Assessment Type", key: "assessmentType" },
        { label: "Apply Date", key: "applyDate" },
        { label: "Address", key: "propAddress" },
        { label: "Status", key: "appType" },
        { label: "View", key: "" },
    ];

    const renderRow = (item, index) => (
        <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 border"> {index + 1} </td>
            <td className="px-3 py-2 border">{item?.wardNo}</td>
            <td className="px-3 py-2 border">{item?.safNo}</td>
            <td className="px-3 py-2 border">{item?.ownerName}</td>
            <td className="px-3 py-2 border">{item?.guardianName}</td>
            <td className="px-3 py-2 border">{item?.mobileNo}</td>
            <td className="px-3 py-2 border">{item?.propertyType}</td>
            <td className="px-3 py-2 border">{item?.assessmentType}</td>
            <td className="px-3 py-2 border">{formatLocalDate(item?.applyDate)}</td>
            <td className="px-3 py-2 border">{item?.propAddress}</td>
            <td className="px-3 py-2 border">{item?.appType}</td>
            <td className="px-1 py-1 border text-center leading-4">
                <Link
                    to={`/saf/details/${item.id}`}
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center text-blue-600 hover:text-blue-800"
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
                    isLoading={isWardLoading}
                    options={wardList}
                    value={wardList.filter((opt) => wardId.includes(opt.value))}
                    onChange={(selected) => setWardId(selected.map((opt) => opt.value))}
                    placeholder="Select Ward(s)..."
                />
            </div>
        </div>
    );

    return (
        <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""} w-full space-y-4`}>
            <CommonTable
                data={dataList}
                headers={headers}
                renderRow={renderRow}
                title="Collection Report"
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
    );
}

export default DateWiseApplySafList;