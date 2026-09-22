import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom';
import { getWardListApi, swmTodayWastCollationApi } from '../../../api/endpoints';
import { Select, SelectItem } from "@nextui-org/react";
import { getToken } from '../../../utils/auth';
import CommonTable from '../../../components/common/CommonTable';

function TodayWastCollection() {
    const [searchParams] = useSearchParams();
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [isFrozen, setIsFrozen] = useState(false);
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [wardId, setWardId] = useState(
    searchParams.getAll("wardId[]").map(Number) || []
    );
    const [today, setToday] = useState(searchParams.get("today")||new Date().toISOString().split("T")[0]);
    const [isVisited,setIsVisited] = useState(searchParams.get("isVisited")!== null ? JSON.parse(searchParams.get("isVisited")):true);
    const [wardList, setWardList] = useState([]);
    const token = getToken();

    useEffect(() => {
        if (token) fetchWardList();
    }, [token]);

    // load table data
    useEffect(() => {
        if (token) fetchData();
    }, [token, page, itemsPerPage,isVisited]);

    const filters = useMemo(
            () => ({
                isVisited,
                date: today || "",
                wardId,
    }),[today, wardId,isVisited]);

    const fetchWardList = async () => {
        try {
        const response = await axios.get(getWardListApi, {
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true },
        });
        if (response?.data?.status) {
            setWardList(response?.data?.data || []);
        }
        } catch (error) {
        console.error("Error fetching Ward list:", error);
        }
    };

    const fetchData = async () => {
        setIsFrozen(true);
        try {
        const res = await axios.post(
            swmTodayWastCollationApi,
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

        const list = res?.data?.data || {};
        setDataList(list.data || []);
        setSummary(list.summary || {});
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
            swmTodayWastCollationApi,
            {
            all:true,    
            page: 1,
            perPage: totalItem,
            key: search.trim() || null,
            ...filters,
            },
            {
            headers: { Authorization: `Bearer ${token}` },
            }
        );
        return (res?.data?.data?.data || []);
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
        { label: "Consumer No", key: "consumerNo" },
        { label: "Holding No", key: "holdingNo" },
        { label: "Owner Name", key: "ownerName" },
        { label: "Mobile No", key: "mobileNo" },
        { label: "Address", key: "address" },
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
            <td className="px-3 py-2 border">{item.address}</td>
        </tr>
    );

    const renderFooter = (totals) => (
        <tr className="bg-gray-200 border-t font-bold">
            <td colSpan={6} className="px-3 py-2 border text-center">
                Total
            </td>
            <td className="px-3 py-2 border">{totals.totalConsumer}</td>
        </tr>
    );

    const filterComponent = (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
            <div>
                <label className="block text-sm">Ward No.</label>
                <Select
                selectionMode="multiple"
                placeholder="Select Ward(s)..."
                selectedKeys={wardId.map(String)}
                onSelectionChange={(keys) => setWardId([...keys].map(Number))}
                >
                {wardList.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                    {w.wardNo}
                    </SelectItem>
                ))}
                </Select>
            </div>
            <div>
                <label className="block text-sm">Date</label>
                <input type='date' value={today} onChange={(e)=>setToday(e.target.value)} className="px-2 py-1 border rounded w-full" />
            </div>
            <div>
                <label className="block text-sm mb-1 font-medium">Is West Collected</label>

                <div className="flex items-center gap-4">
                <label className="flex items-center gap-1">
                    <input
                    type="radio"
                    name="isVisited"
                    checked={isVisited === true}
                    onChange={() =>
                        setIsVisited(true)
                    }
                    />
                    Yes
                </label>

                <label className="flex items-center gap-1">
                    <input
                    type="radio"
                    name="isVisited"
                    checked={isVisited === false}
                    onChange={() =>
                        setIsVisited(false)
                    }
                    />
                    No
                </label>
                </div>
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
            data={dataList}
            headers={headers}
            renderRow={renderRow}
            footerRow={renderFooter(summary)}
            title="West Collection"
            totalPages={totalPage}
            currentPage={page}
            setPageNo={setPage}
            totalItem={totalItem}
            setItemsPerPage={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            isSearchInput={true}
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            fetchAllData={fetchAllData}
            filterComponent={filterComponent}
          />
        </div>
  )
}

export default TodayWastCollection
