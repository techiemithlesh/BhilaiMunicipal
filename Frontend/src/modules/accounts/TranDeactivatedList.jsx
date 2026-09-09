import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ModuleListApi, tranDeactivationListApi } from '../../api/endpoints';
import { getToken } from '../../utils/auth';
import { formatLocalDate, formatLocalDateTime } from '../../utils/common';
import { FaFilePdf } from 'react-icons/fa';
import defaultAvatar from "../../assets/images/default-avatar.jpg";
import ImagePreview from '../../components/common/ImagePreview';
import CommonTable from '../../components/common/CommonTable';
import axios from 'axios';
import Select from "react-select";

function TranDeactivatedList() {
    const [searchParams] = useSearchParams();

    const [moduleList, setModuleList] = useState([]);
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});
    const [isFrozen, setIsFrozen] = useState(false);
    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [moduleId, setModuleId] = useState("");
    const [tranNo, setTranNo] = useState("");
    const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
    const [isSearch,setIsSearch] = useState(false);
    const [previewImg, setPreviewImg] = useState("");
    const token = getToken();

    const filters = useMemo(
        () => ({
            fromDate: fromDate || "",
            uptoDate: toDate || "",
            moduleId,
            tranNo,
        }),
        [fromDate, toDate, moduleId, tranNo]
    ); 

    const fetchData = async () => {
        setIsFrozen(true);
        try {
            const res = await axios.post(
                tranDeactivationListApi,
                {
                    page,
                    perPage: itemsPerPage,
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
            console.error("Error fetching deactivation list:", err);
        } finally {
            setIsFrozen(false);
        }
    };


    useEffect(() => {
        fetchModule();
    }, [token]);

    const fetchModule = useCallback(async () => {
        try {
            const response = await axios.post(
                ModuleListApi,
                { all: "all" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response?.data?.status) {
                setModuleList(response?.data?.data);
            }
        } catch (err) {
            console.error("Error fetching module list:", err);
        }
    }, [token]);


    useEffect(() => {
        if (token && isSearch) fetchData();
    }, [token, page, itemsPerPage]);


    const fetchAllData = async () => {
        try {
            const res = await axios.post(
                tranDeactivationListApi,
                {
                    page: 1,
                    perPage: totalItem,
                    ...filters,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return (res?.data?.data?.data || []).map((item) => ({
                ...item,
                fromUpto: `${item.fromFyear} (${item.fromQtr}) / ${item.uptoFyear} (${item.uptoQtr})`,
            }));
        } catch (err) {
            console.error("Error fetching all data for export:", err);
            return [];
        }
    };

    const handleSearch = () => {
        setIsSearch(true);
        setPage(1);
        fetchData();
    };

    const openPreviewModel = (link) => {
        setIsModalPreviewOpen(true);
        setPreviewImg(link);
    };

    const closePreviewModel = () => {
        setIsModalPreviewOpen(false);
        setPreviewImg("");
    };

    const headers = [
        { label: "#", key: "serial" },
        { label: "Tran No.", key: "tranNo" },
        { label: "Tran Date.", key: "tranDate" },
        { label: "Payment Mode", key: "paymentMode" },
        { label: "Amount", key: "payableAmt" },
        { label: "Tran Type", key: "tranType" },
        { label: "Deactivation Date", key: "createdAt" },
        { label: "remarks", key: "remarks" },
        { label: "Document", key: "" },
        { label: "Deactivated By", key: "deactivateBy" },
    ];

    const renderRow = (item, index, page, itemsPerPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 border">
                {(page - 1) * itemsPerPage + index + 1}
            </td>
            <td className="px-3 py-2 border">{item.tranNo}</td>
            <td className="px-3 py-2 border">{formatLocalDate(item.tranDate)}</td>
            <td className="px-3 py-2 border">{item.paymentMode}</td>
            <td className="px-3 py-2 border">{item.payableAmt}</td>
            <td className="px-3 py-2 border">{item.tranType}</td>
            <td className="px-3 py-2 border">{formatLocalDateTime(item.createdAt)}</td>
            <td className="px-3 py-2 border">{item.remarks}</td>
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
            <td className="px-3 py-2 border">
                <img
                    src={item?.userImg || defaultAvatar}
                    alt="user avatar"
                    onClick={() => openPreviewModel(item?.userImg || defaultAvatar)}
                    className="inline-block ml-2 w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer mr-3"
                />
                {item.deactivateBy}
            </td>
        </tr>
    );

    const filterComponent = (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
            <div>
                <label className="block text-sm">From Date</label>
                <input
                    type="date"
                    value={fromDate || ''}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2 py-1 border rounded w-full"
                />
            </div>
            <div>
                <label className="block text-sm">To Date</label>
                <input
                    type="date"
                    value={toDate || ''}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 py-1 border rounded w-full"
                />
            </div>
            <div>
                <label className="block text-sm">Tran No.</label>
                <input
                    type="text"
                    value={tranNo}
                    onChange={(e) => setTranNo(e.target.value)}
                    className="px-2 py-1 border rounded w-full"
                />
            </div>
            <div>
                <label className="block text-sm">Module</label>
                <Select
                    options={moduleList.map((w) => ({ value: w.id, label: w.moduleName }))}
                    value={moduleList.find(w => w.id == moduleId) ? { value: moduleId, label: moduleList.find(w => w.id === moduleId).moduleName } : null}
                    onChange={(selectedOption) => setModuleId(selectedOption ? selectedOption.value : "")}
                    isClearable
                    placeholder="Select Module..."
                />
            </div>

        </div>
    );
    return (
        <div
            className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""
                } w-full space-y-4`}
        >
            <CommonTable
                data={dataList}
                headers={headers}
                renderRow={renderRow}
                title="Deactivated Tran List"
                totalPages={totalPage}
                currentPage={page}
                setPageNo={setPage}
                totalItem={totalItem}
                setItemsPerPage={setItemsPerPage}
                itemsPerPage={itemsPerPage}
                search={search}
                setSearch={setSearch}
                onSearch={handleSearch}
                isSearchInput={false}
                fetchAllData={fetchAllData}
                filterComponent={filterComponent}
            />

            {isModalPreviewOpen && (
                <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
            )}
        </div>
    )
}

export default TranDeactivatedList