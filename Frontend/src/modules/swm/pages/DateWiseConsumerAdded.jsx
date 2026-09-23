import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { getToken } from '../../../utils/auth';
import { formatLocalDate, formatLocalDateTime } from '../../../utils/common';
import CommonTable from '../../../components/common/CommonTable';
import Select from "react-select";
import axios from 'axios';
import { getWardListApi, swmDateWiseAddConsumersApi, userApi } from '../../../api/endpoints';
import { FaFilePdf } from 'react-icons/fa';
import defaultAvatar from "../../../assets/images/default-avatar.jpg";
import ImagePreview from '../../../components/common/ImagePreview';


function DateWiseConsumerAdded() {
    const token = getToken();
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [isFrozen, setIsFrozen] = useState(false);
    
    const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
    const [uptoDate, setUptoDate] = useState(new Date().toISOString().split("T")[0]);
    const [isActive, setIsActive] = useState(true);
    const [wardId, setWardId] = useState([]);
    const [userId, setUserId] = useState([]);

    const [collectorList, setCollectorList] = useState([]);
    const [wardList, setWardList] = useState([]);

    const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
    const [previewImg, setPreviewImg] = useState("");

    // Memoize options arrays so they don't re-calculate on every single render pass
    const wardOptions = useMemo(() => 
        wardList.map((w) => ({ value: w.id, label: w.wardNo })), 
        [wardList]
    );

    const selectedWardValues = useMemo(() => 
        wardOptions.filter((opt) => wardId.includes(opt.value)), 
        [wardOptions, wardId]
    );

    const filters = useMemo(
        () => ({
          fromDate,
          uptoDate,
          wardId,
          userId,
          isActive,
        }),
        [fromDate, uptoDate, wardId, userId, isActive]
    );

    // Load initial configuration filters once on component mount
    useEffect(() => {
        const fetchInitialMetadata = async () => {
            setIsFrozen(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` }, params: { all: true } };
                const [userRes, wardRes] = await Promise.all([
                    axios.get(userApi, config),
                    axios.get(getWardListApi, config)
                ]);

                if (userRes?.data?.status) {
                    setCollectorList(userRes.data.data.map((item) => ({ value: item.id, label: item.name })));
                }
                if (wardRes?.data?.status) {
                    setWardList(wardRes?.data?.data || []);
                }
            } catch (error) {
                console.error("Error fetching preliminary metadata lists:", error);
            }finally{
                setIsFrozen(false);
            }
        };
        fetchInitialMetadata();
    }, [token]);

    useEffect(() => {
        if (token) fetchData();
    }, [token, page, itemsPerPage, isActive]);

    // Main API retrieval function wrapped in useCallback to prevent re-creation performance leaks
    const fetchData = async () => {
        setIsFrozen(true);
        try {
            const { data } = await axios.post(
                swmDateWiseAddConsumersApi,
                {
                    page,
                    perPage: itemsPerPage,
                    key: search.trim() || null,
                    ...filters,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const list = data.data || {};
            setDataList(list.data || []);
            setTotalPage(list.lastPage || 1);
            setTotalItem(list.total || 0);
        } catch (err) {
            console.error("Error fetching RFID list:", err);
        } finally {
            setIsFrozen(false);
        }
    };

    const fetchAllData = async () => {
        try {
            const { data } = await axios.post(
                swmDateWiseAddConsumersApi,
                {
                    page: 1,
                    perPage: totalItem || 1000, // Fallback ceiling safety boundary
                    key: search.trim() || null,
                    ...filters,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return data.data?.data || [];
        } catch (err) {
            console.error("Error fetching export datasets:", err);
            return [];
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchData();
    };

    // Corrected the condition lookup from fromDate.isActive to standard state isActive
    const headers = useMemo(() => {
        const baseHeaders = [
            { label: "#", key: "serial" },
            { label: "Ward No", key: "wardNo" },
            { label: "Consumer No", key: "consumerNo" },
            { label: "Holding No", key: "holdingNo" },
            { label: "Address No", key: "address" },
            { label: "Owner Name", key: "ownerName" },
            { label: "Guardian Name", key: "guardianName" },
            { label: "Mobile No", key: "mobileNo" },
            { label: isActive ? "Crated Date" : "Deactivated date", key: isActive ? "applyDate" : "deactivatedDate" },
            { label: isActive ? "Created By" : "Deactivated By", key: isActive ? "userName" : "deactivatedByUserName" },
        ];

        if (!isActive) {
            baseHeaders.push(
                { label: "Remarks", key: "remarks" },
                { label: "Supporting Doc", key: "" }
            );
        }
        return baseHeaders;
    }, [isActive]);

    const renderRow = (item, index) => (
        <tr key={item.id} className="hover:bg-gray-50 text-sm">
            <td className="px-3 py-2 border text-center">{((page - 1) * itemsPerPage) + index + 1}</td>
            <td className="px-3 py-2 border">{item?.wardNo}</td>
            <td className="px-3 py-2 border">{item?.consumerNo}</td>
            <td className="px-3 py-2 border">{item?.holdingNo}</td>
            <td className="px-3 py-2 border">{item?.address}</td>
            <td className="px-3 py-2 border">{item?.ownerName}</td>            
            <td className="px-3 py-2 border">{item?.guardianName}</td>
            <td className="px-3 py-2 border">{item?.mobileNo}</td>            
            <td className="px-3 py-2 border">{isActive ? formatLocalDate(item?.applyDate) : formatLocalDateTime(item?.deactivatedDate)}</td>

            <td className="px-3 py-2 border">
                {isActive ? (
                    <img
                        src={item?.userImg || defaultAvatar}
                        alt="user avatar"
                        onClick={() => openPreviewModel(item?.userImg || defaultAvatar)}
                        className="inline-block ml-2 w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer mr-3"
                    />
                ) : (
                    <img
                        src={item?.deactivatedByUserImg || defaultAvatar}
                        alt="user avatar"
                        onClick={() => openPreviewModel(item?.deactivatedByUserImg || defaultAvatar)}
                        className="inline-block ml-2 w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer mr-3"
                    />
                )}
                {isActive ? item?.userName : item?.deactivatedByUserName}
            </td>
            
            {!isActive && (
                <>
                    <td className="px-3 py-2 border">{item?.remarks}</td>
                    <td className="px-3 py-2 border">
                        {item.docPath ? (
                            item.docPath.toLowerCase().endsWith(".pdf") ? (
                                <FaFilePdf
                                    size={40}
                                    className="mx-auto text-red-600 cursor-pointer"
                                    onClick={() => openPreviewModel(item.docPath)}
                                    title="Click to view PDF"
                                />
                            ) : (
                                <img
                                    src={item.docPath}
                                    alt="document image"
                                    onClick={() => openPreviewModel(item.docPath)}
                                    className="inline-block ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
                                />
                            )
                        ) : (
                            <span className="text-gray-400">No file</span>
                        )}
                    </td>                    
                </>
            )}
        </tr>
    );

    const filterComponent = (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4 items-end bg-gray-50 p-4 rounded-lg border">
            <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {setFromDate(e.target.value); }}
                    className="px-2 py-1.5 border rounded w-full bg-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                    type="date"
                    value={uptoDate}
                    onChange={(e) => {setUptoDate(e.target.value); }}
                    className="px-2 py-1.5 border rounded w-full bg-white"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Ward No.</label>
                <Select
                    isMulti
                    options={wardOptions}
                    value={selectedWardValues}
                    onChange={(selected) => {setWardId(selected ? selected.map((opt) => opt.value) : []); }}
                    placeholder="Select Ward(s)..."
                    className="text-sm"
                />
            </div>
            <div>
                <label className="block text-sm">Collector</label>
                <Select
                isMulti
                options={collectorList}
                value={collectorList.filter((opt) => userId.includes(opt.value))}
                onChange={(opt) => setUserId(opt.map((o) => o.value))}
                placeholder="Select Collector"
                />
            </div>       
            <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <div className="flex items-center gap-4 h-[38px]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="isActive"
                            checked={isActive === true}
                            onChange={() => { setIsActive(true); }}
                        />
                        Active
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                        <input
                            type="radio"
                            name="isActive"
                            checked={isActive === false}
                            onChange={() => { setIsActive(false); }}
                        />
                        Deactivated
                    </label>
                </div>
            </div>
        </div>
    );

    const openPreviewModel = (link) => {
        setIsModalPreviewOpen(true);
        setPreviewImg(link);
    };

    const closePreviewModel = () => {
        setIsModalPreviewOpen(false);
        setPreviewImg("");
    };

    return (
        <div className={`${isFrozen ? "pointer-events-none filter blur-sm transition-all" : ""} w-full space-y-4`}>
            <CommonTable
                data={dataList}
                headers={headers}
                renderRow={renderRow}
                title="Consumer Status Metrics Audit Logs"
                totalPages={totalPage}
                currentPage={page}
                setPageNo={setPage}
                totalItem={totalItem}
                setItemsPerPage={setItemsPerPage}
                itemsPerPage={itemsPerPage}
                isSearchInput={true} // Switched to true since search logic is wired up
                search={search}
                setSearch={setSearch}
                onSearch={handleSearch}
                fetchAllData={fetchAllData}
                filterComponent={filterComponent}
            />

            {isModalPreviewOpen && (
                <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
            )}
        </div>
    );
}

export default DateWiseConsumerAdded;