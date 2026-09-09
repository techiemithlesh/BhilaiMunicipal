import React, { useEffect, useState } from 'react';
import { Spinner } from '@nextui-org/react';
import axios from 'axios';
import { FaTrash, FaUserPlus } from 'react-icons/fa';
import { getSwmRateApi, getSwmSubCategoryListApi } from '../../../../api/endpoints';
import { getToken } from '../../../../utils/auth';

function SwmConsumerAdd({
    error,
    swmConsumer = [],
    setSwmConsumer,
    setErrors,
    masterData,
}) {
    const token = getToken();
    const [rowLoading, setRowLoading] = useState({});

    // Ensure at least one consumer row exists on mount
    useEffect(() => {
        if (!Array.isArray(swmConsumer) || swmConsumer.length === 0) {
            setSwmConsumer([{ index: 1 }]);
        }
    }, []);

    const handleAdd = () => {
        setSwmConsumer([...swmConsumer, { index: swmConsumer.length + 1 }]);
    };

    const handleRemove = (index) => {
        const filtered = swmConsumer.filter((_, i) => i !== index);
        setSwmConsumer(filtered);
    };

    const handleChange = async (index, field, value) => {
        // --- 1. IMMEDIATE REDUX DISPATCH (Optimistic) ---
        // Create the updated array locally first
        const updatedLocalState = swmConsumer.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        );
        
        // Push to Redux immediately - UI updates instantly
        setSwmConsumer(updatedLocalState);

        // Clear Errors in parallel
        if (setErrors) {
            setErrors((prev) => ({
                ...prev,
                swmConsumer: {
                    ...prev.swmConsumer,
                    [index]: { ...prev.swmConsumer?.[index], [field]: "" },
                },
            }));
        }

        // --- 2. BACKGROUND PROCESSING ---
        const currentItem = updatedLocalState[index];
        let asyncUpdates = {};

        try {
            // Logic for Category Type Change
            if (field === "categoryTypeMasterId" && value) {
                setRowLoading(prev => ({ ...prev, [index]: true }));
                
                if (value !== "1" && value !== 1) {
                    asyncUpdates.category = "APL";
                }

                const response = await axios.post(
                    getSwmSubCategoryListApi,
                    { categoryTypeMasterId: value },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                asyncUpdates.subCategoryList = response?.data?.status ? response.data.data : [];
                asyncUpdates.subCategoryTypeMasterId = "";
                asyncUpdates.rate = "";
                setRowLoading(prev => ({ ...prev, [index]: false }));
            }

            // Logic for Rate Fetching
            // Merge local changes with background changes to check if we can fetch rate
            const mergedItem = { ...currentItem, ...asyncUpdates };
            
            if (
                (field === "category" || field === "subCategoryTypeMasterId" || field === "categoryTypeMasterId") &&
                mergedItem.category && 
                mergedItem.subCategoryTypeMasterId
            ) {
                const rateRes = await axios.post(
                    getSwmRateApi,
                    mergedItem,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                asyncUpdates.rate = rateRes?.data?.status ? rateRes.data.data?.ratePerMonth : "";
            }

            // --- 3. FINAL REDUX SYNC ---
            // Only dispatch again if the API actually gave us new data
            if (Object.keys(asyncUpdates).length > 0) {
                const finalState = updatedLocalState.map((item, i) =>
                    i === index ? { ...item, ...asyncUpdates } : item
                );
                setSwmConsumer(finalState);
            }
        } catch (err) {
            console.error("Redux Sync Error:", err);
            setRowLoading(prev => ({ ...prev, [index]: false }));
        }
    };

    if (!Array.isArray(swmConsumer)) {
        return (
            <div className="flex justify-center p-10">
                <Spinner label="Loading SWM Details..." />
            </div>
        );
    }
    // console.log("errors111",error[`swmConsumer.${0}.mobileNo`]);

    return (
        <div className="flex flex-col gap-2 text-gray-700 owner_details_container">
            <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
                SWM Details
            </h2>

            {swmConsumer.map((owner, index) => (
                <div
                    className="gap-4 grid grid-cols-1 md:grid-cols-4 bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-sm p-4 border border-blue-300 rounded-xl mb-4"
                    key={index}
                >
                    {/* Occupancy Type */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Occupancy Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                            value={owner.occupancyTypeMasterId || ""}
                            onChange={(e) => handleChange(index, "occupancyTypeMasterId", e.target.value)}
                        >
                            <option value="">Select</option>
                            {masterData?.occupancyType?.map((item) => (
                                <option key={item.id} value={item.id}>{item.occupancyName}</option>
                            ))}
                        </select>
                        {error && error[`swmConsumer.${index}.occupancyTypeMasterId`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.occupancyTypeMasterId`]}</span>
                        )}
                    </div>

                    {/* Consumer Name */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Consumer Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Consumer Name"
                            value={owner.ownerName || ""}
                            onChange={(e) => handleChange(index, "ownerName", e.target.value)}
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                        />
                        {error && error[`swmConsumer.${index}.ownerName`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.ownerName`]}</span>
                        )}
                    </div>

                    {/* Guardian Name */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Guardian Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Guardian Name"
                            value={owner.guardianName || ""}
                            onChange={(e) => handleChange(index, "guardianName", e.target.value)}
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                        />
                        {error && error[`swmConsumer.${index}.guardianName`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.guardianName`]}</span>
                        )}
                    </div>

                    {/* Relation */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Relation {owner.guardianName && <span className="text-red-500">*</span>}
                        </label>
                        <select
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                            value={owner.relationType || ""}
                            onChange={(e) => handleChange(index, "relationType", e.target.value)}
                        >
                            <option value="">Select Relation</option>
                            <option value="S/O">S/O</option>
                            <option value="D/O">D/O</option>
                            <option value="W/O">W/O</option>
                            <option value="C/O">C/O</option>
                        </select>
                        {error && error[`swmConsumer.${index}.relationType`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.relationType`]}</span>
                        )}
                    </div>

                    {/* Mobile No */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Mobile No <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            maxLength={10}
                            placeholder="Enter Mobile No"
                            value={owner.mobileNo || ""}
                            onChange={(e) => handleChange(index, "mobileNo", e.target.value.replace(/\D/g, ""))}
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                        />
                        {error && error[`swmConsumer.${index}.mobileNo`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.mobileNo`]}</span>
                        )}
                    </div>

                    {/* Consumer Category */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Consumer Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                            value={owner.categoryTypeMasterId || ""}
                            onChange={(e) => handleChange(index, "categoryTypeMasterId", e.target.value)}
                        >
                            <option value="">Select</option>
                            {masterData?.swmConsumerType?.map((item) => (
                                <option key={item.id} value={item.id}>{item.categoryType}</option>
                            ))}
                        </select>
                        {error && error[`swmConsumer.${index}.categoryTypeMasterId`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.categoryTypeMasterId`]}</span>
                        )}
                    </div>

                    {/* Category (APL/BPL) */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            disabled={owner.categoryTypeMasterId && owner.categoryTypeMasterId != 1}
                            className={`block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs ${owner.categoryTypeMasterId != 1 ? 'bg-gray-100' : ''}`}
                            value={owner.category || ""}
                            onChange={(e) => handleChange(index, "category", e.target.value)}
                        >
                            <option value="">Select</option>
                            <option value="APL">APL</option>
                            <option value="BPL">BPL</option>
                        </select>
                        {error && error[`swmConsumer.${index}.category`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.category`]}</span>
                        )}
                    </div>

                    {/* Consumer Range Type */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">
                            Consumer Range <span className="text-red-500">* {rowLoading[index] && <Spinner size="sm" />}</span>
                        </label>
                        <select
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                            value={owner.subCategoryTypeMasterId || ""}
                            onChange={(e) => handleChange(index, "subCategoryTypeMasterId", e.target.value)}
                        >
                            <option value="">Select Range</option>
                            {owner?.subCategoryList?.map((item) => (
                                <option key={item.id} value={item.id}>{item.subCategoryType}</option>
                            ))}
                        </select>
                        {error && error[`swmConsumer.${index}.subCategoryTypeMasterId`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.subCategoryTypeMasterId`]}</span>
                        )}
                    </div>

                    {/* Effective From */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">Effective From</label>
                        <input
                            type="month"
                            value={owner.dateOfEffective || ""}
                            onChange={(e) => handleChange(index, "dateOfEffective", e.target.value)}
                            className="block bg-white shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-xs"
                        />
                        {error && error[`swmConsumer.${index}.dateOfEffective`]&& (
                            <span className="text-red-500 text-xs mt-1">{error[`swmConsumer.${index}.dateOfEffective`]}</span>
                        )}
                    </div>

                    {/* Rate (Read Only) */}
                    <div className="flex flex-col">
                        <label className="block font-medium text-sm mb-1">Monthly Rate {rowLoading[index] && <Spinner size="sm" />}</label>
                        <input
                            type="text"
                            disabled
                            value={owner.rate || ""}
                            className="block bg-gray-100 shadow-sm px-3 py-2 border border-gray-300 rounded-md w-full text-xs font-bold text-blue-700"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-end justify-end md:col-span-2">
                        <div className="flex items-center space-x-2 bg-gray-100 shadow-inner px-3 py-1 border border-gray-300 rounded-full">
                            <button
                                onClick={handleAdd}
                                type="button"
                                title="Add New Consumer"
                                className="p-2 rounded-full text-green-600 hover:bg-green-50 transition-colors"
                            >
                                <FaUserPlus className="text-lg" />
                            </button>

                            {swmConsumer.length > 1 && (
                                <button
                                    onClick={() => handleRemove(index)}
                                    type="button"
                                    title="Remove Consumer"
                                    className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <FaTrash className="text-lg" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default SwmConsumerAdd;