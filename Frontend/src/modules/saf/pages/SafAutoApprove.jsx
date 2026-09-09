import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { debounce } from 'lodash';
import Select from "react-select";
import { Spinner, Button, Input } from '@nextui-org/react';
import { FaEye, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";

import { getToken } from '../../../utils/auth';
import SearchWithTable from "../../../components/common/SearchWithTable";
import FileUpload from '../../../components/common/FileUpload';
import { fetchWardList } from "../../../store/slices/wardSlice";
import { safAddAutoApprovedApi, safListForAutoApprovedApi } from '../../../api/endpoints';
import { modalVariants } from "../../../utils/motionVariable";
import { toastMsg } from '../../../utils/utils';

const SafAutoApprove = () => {
    const dispatch = useDispatch();
    const token = getToken();

    // --- State Management ---
    const [filters, setFilters] = useState({ keyword: "", wardIds: [] });
    const [tableState, setTableState] = useState({
        data: [],
        isLoading: false,
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
        isSearchTriggered: false
    });

    const [modal, setModal] = useState({
        isOpen: false,
        isSubmitting: false,
        selectedSaf: null,
        document: [],
        formData: { remarks: "" },
        errors: {}
    });

    const { wardList = [] } = useSelector((state) => state.ward);

    // --- Initial Load ---
    useEffect(() => {
        dispatch(fetchWardList());
    }, [dispatch]);

    // --- API Calls ---
    const fetchData = useCallback(async (page, perPage, currentWardIds, currentKeyword) => {
        setTableState(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await axios.post(
                safListForAutoApprovedApi,
                { 
                    wardId: currentWardIds, 
                    key: currentKeyword, 
                    page, 
                    perPage 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const { data } = response.data;
            setTableState(prev => ({
                ...prev,
                data: data.data || [],
                totalPages: data.lastPage || 1,
                isLoading: false
            }));
        } catch (error) {
            console.error("Search failed", error);
            toastMsg("Failed to fetch data", "error");
            setTableState(prev => ({ ...prev, isLoading: false, data: [] }));
        }
    }, [token]);

    const debouncedSearch = useMemo(() => debounce(fetchData, 500), [fetchData]);

    // --- Event Handlers ---
    const handleSearchSubmit = () => {
        setTableState(prev => ({ ...prev, isSearchTriggered: true, currentPage: 1 }));
        fetchData(1, tableState.itemsPerPage, filters.wardIds, filters.keyword);
    };

    useEffect(() => {
        if (tableState.isSearchTriggered) {
            fetchData(tableState.currentPage, tableState.itemsPerPage, filters.wardIds, filters.keyword);
        }
    }, [tableState.currentPage, tableState.itemsPerPage, fetchData]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setModal(prev => ({
            ...prev,
            formData: { ...prev.formData, [name]: value },
            errors: { ...prev.errors, [name]: null }
        }));
    };

    const onClose = () => {
        setModal({
            isOpen: false,
            isSubmitting: false,
            selectedSaf: null,
            document: [],
            formData: { remarks: "" },
            errors: {}
        });
    };

    const handleProceed = async () => {
        if (!modal.formData.remarks || !modal.document[0]?.file) {
            return toastMsg("Please provide remarks and a document", "error");
        }

        const formPayload = new FormData();
        formPayload.append("document", modal.document[0].file);
        formPayload.append("id", modal.selectedSaf?.id);
        formPayload.append("remarks", modal.formData.remarks);

        setModal(prev => ({ ...prev, isSubmitting: true }));
        try {
            const res = await axios.post(safAddAutoApprovedApi, formPayload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data" 
                },
            });

            if (res.data?.status) {
                toastMsg(res.data.message, "success");
                onClose();
                handleSearchSubmit();
            } else {
                setModal(prev => ({ ...prev, errors: res.data.errors || {} }));
                toastMsg(res.data?.message || "Operation failed", "error");
            }
        } catch (error) {
            toastMsg("API Error occurred", "error");
        } finally {
            setModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // --- Memos for Select ---
    const wardOptions = useMemo(() => 
        wardList.map(w => ({ value: w.id, label: `${w.wardNo}` })), 
    [wardList]);

    const selectedWardValue = useMemo(() => 
        wardOptions.filter(opt => filters.wardIds.includes(opt.value)),
    [wardOptions, filters.wardIds]);

    return (
        <div className="p-4">
            <SearchWithTable
                filterType="Auto Approved Applications"
                itemsPerPage={tableState.itemsPerPage}
                currentPage={tableState.currentPage}
                totalPages={tableState.totalPages}
                loading={tableState.isLoading}
                setPageNo={(p) => setTableState(prev => ({ ...prev, currentPage: p }))}
                setItemsPerPage={(n) => setTableState(prev => ({ ...prev, itemsPerPage: n }))}
                filters={[
                    {
                        label: "Ward Selection",
                        type: "custom",
                        render: () => (
                            <Select
                                isMulti
                                options={wardOptions}
                                value={selectedWardValue}
                                onChange={(opts) => setFilters(prev => ({ ...prev, wardIds: opts.map(o => o.value) }))}
                                placeholder="All Wards"
                                className="min-w-[220px] text-sm"
                            />
                        ),
                    },
                    {
                        label: "Search",
                        type: "text",
                        value: filters.keyword,
                        onChange: (v) => setFilters(prev => ({ ...prev, keyword: v })),
                        placeholder: "SAF No / Owner Name",
                    },
                ]}
                onSearchSubmit={handleSearchSubmit}
                tableHeaders={["#", "Ward", "SAF No.", "Owner", "Mobile", "Assessment", "Apply Date", "Status", "Action"]}
                tableData={tableState.data}
                renderRow={(row, index) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 border text-center text-sm">{index + 1}</td>
                        <td className="p-3 border text-sm">{row.wardNo}</td>
                        <td className="p-3 border font-medium text-sm">{row.safNo}</td>
                        <td className="p-3 border text-sm">{row.ownerName}</td>
                        <td className="p-3 border text-sm">{row.mobileNo}</td>
                        <td className="p-3 border text-sm">{row.assessmentType}</td>
                        <td className="p-3 border text-sm">{row.applyDate}</td>
                        <td className="p-3 border text-sm">
                            <span className="bg-blue-50 px-2 py-1 rounded text-blue-700 text-xs">{row.appStatus}</span>
                        </td>
                        <td className="p-3 border text-center">
                            <Button 
                                isIconOnly 
                                variant="light" 
                                size="sm" 
                                onClick={() => setModal(prev => ({ ...prev, isOpen: true, selectedSaf: row }))}
                            >
                                <FaEye className="text-blue-600" size={18} />
                            </Button>
                        </td>
                    </tr>
                )}
            />

            <AnimatePresence>
                {modal.isOpen && (
                    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl overflow-hidden"
                        >
                            <div className="flex justify-between items-center bg-blue-600 px-6 py-4 text-white">
                                <h2 className="font-semibold text-lg">
                                    SAF Auto Approval {modal.selectedSaf?.safNo && `[${modal.selectedSaf.safNo}]`}
                                </h2>
                                <button onClick={onClose} className="hover:rotate-90 transition-transform">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="font-medium text-gray-700 text-sm">Supporting Document <span className="text-red-500">*</span></label>
                                        <FileUpload
                                            files={modal.document}
                                            setFiles={(f) => setModal(prev => ({ ...prev, document: f }))}
                                            allowMultiple={false}
                                            acceptedFileTypes={["image/*", "application/pdf"]}
                                        />
                                        {modal.errors?.document && <p className="mt-1 text-red-500 text-xs">{modal.errors.document}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Input
                                            label="Remarks"
                                            labelPlacement="outside"
                                            placeholder="Enter approval remarks"
                                            name="remarks"
                                            value={modal.formData.remarks}
                                            onChange={handleFormChange}
                                            isRequired
                                            variant="bordered"
                                            isInvalid={!!modal.errors?.remarks}
                                            errorMessage={modal.errors?.remarks}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                                    <Button variant="flat" color="danger" onClick={onClose} isDisabled={modal.isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        color="primary" 
                                        onClick={handleProceed} 
                                        isLoading={modal.isSubmitting}
                                        isDisabled={!modal.formData.remarks || modal.document.length === 0}
                                    >
                                        Approve Application
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SafAutoApprove;