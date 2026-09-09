import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { getApartmentAddApi, getApartmentDtlApi, getApartmentEditApi, getRoadMasterListApi, getWardListApi } from '../../../api/endpoints';
import { toastMsg } from '../../../utils/utils';
import { Spinner } from '@nextui-org/react';
import InputField from '../../../components/common/InputField';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import Select from "react-select";

function ApartmentAddEditModal({ item, onClose, onSuccess }) {
    const token = getToken();
    const [wardList, setWardList] = useState([]);
    const [roadList, setRoadList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [formData, setFormData] = useState({});
    const [userImgPreview, setUserImgPreview] = useState();
    const [rwhImgPreview, setRwhImgPreview] = useState();

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const init = async () => {
            try{
                setIsLoading(true);
                await fetchRoadList();
                await fetchWardList();
                if (token && item?.id) {
                    await fetchInitialData();
                }
            }catch (error) {
                console.error("Error during initial data fetch:", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [token, item]);

    const wardOption = wardList.map((item) => ({
        value: item.id,
        label: item.wardNo,
    }));

    const roadOption = roadList.map((item) => ({
        value: item.id,
        label: item.roadType,
    }));

    const fetchWardList = async () => {
        try {
            const res = await axios.get(getWardListApi, {
                headers: { Authorization: `Bearer ${token}` },
                params: { all: "all" },
            });
            if (res.data.status){
                setWardList(res.data.data);
            } 
        } catch (error) {
            console.error("Error fetching wards:", error);
        }
    };

    const fetchRoadList = async () => {
        try {
            const res = await axios.post(getRoadMasterListApi,
                {all:true},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.data.status){
                setRoadList(res.data.data);
            } 
        } catch (error) {
            console.error("Error fetching wards:", error);
        }
    };


    const fetchInitialData = async () => {
        try {
            const response = await axios.post(
                getApartmentDtlApi,
                {
                    id: item?.id,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response?.data?.status) {
                setFormData({
                    ...response?.data?.data,
                });
                setUserImgPreview(data?.apartmentImage);
                setRwhImgPreview(data?.waterHarvestingImage);
            }
        } catch (err) {
            console.error("Error loading data", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value,type,checked,files } = e.target;
        let newValue = value;
        if(type=="checkbox"){
            newValue=checked;
        }
        if (type == "file") {
            const reader = new FileReader();

            reader.onload = function (e) {
                if (name === "apartmentImageDoc" && e.target.result)
                setUserImgPreview(e.target.result);
                if (name === "waterHarvestingImageDoc" && e.target.result)
                setRwhImgPreview(e.target.result);
            };

            reader.readAsDataURL(files[0]);
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name]: files[0],
            }));
            } else{

                setFormData((prev) => ({ ...prev, [name]: newValue }));
            }
        setErrors((prev) => ({ ...prev, [name]: null }));
    };
    const handleSelectChange = (name, option) => {
        setFormData((p) => ({ ...p, [name]: option ? option.value : null }));
        setErrors((p) => ({ ...p, [name]: null }));
    };


    console.log("formData",formData);

    const handleFormSubmit = async () => {
        const form = new FormData();

        Object.keys(formData).forEach((key) => {
            form.append(key, formData[key]);
        });
        setIsFrozen(true);
        try {
            const api = item?.id ? getApartmentEditApi : getApartmentAddApi;
            const res = await axios.post(api, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            if (res.data.status === true) {
                toastMsg(res.data.message, "success");
                onClose();
                onSuccess();
            } else {
                setErrors(res.data.errors || {});
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsFrozen(false);
        }
    };
    return (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 p-4">
            {isLoading ? (
                <Spinner />
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={modalVariants}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-6xl max-h-[95vh]"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg">
                            {item?.id ? "Update" : "Add"} Officer
                        </h2>
                        <button onClick={onClose}>
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="relative flex-grow pr-2 overflow-y-auto">
                        <div
                            className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""
                                } w-full space-y-4`}
                        >
                            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                                <div>
                                    <label className="block font-semibold text-gray-700 text-sm">
                                        Ward No
                                    </label>
                                    <Select
                                        name="wardMstrId"
                                        value={wardOption.find(
                                        (opt) => opt.value === formData.wardMstrId
                                        )}
                                        onChange={(selected)=>handleSelectChange("wardMstrId",selected)}
                                        options={wardOption}
                                        placeholder="Select Role"
                                        isClearable
                                    />
                                    {errors?.wardMstrId&&(
                                        <span className="text-red-500">{errors?.wardMstrId}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 text-sm">
                                        Road Type
                                    </label>
                                    <Select
                                        name="roadTypeMstrId"
                                        value={roadOption.find(
                                        (opt) => opt.value === formData.roadTypeMstrId
                                        )}
                                        onChange={(selected)=>handleSelectChange("roadTypeMstrId",selected)}
                                        options={roadOption}
                                        placeholder="Select"
                                        isClearable
                                    />
                                    {errors?.roadOption&&(
                                        <span className="text-red-500">{errors?.roadOption}</span>
                                    )}
                                </div>
                                <InputField
                                    label="Apartment Code"
                                    name="aptCode"
                                    type='text'
                                    value={formData.aptCode ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.aptCode}
                                />
                                <InputField
                                    label="Apartment Name"
                                    name="apartmentName"
                                    type='text'
                                    value={formData.apartmentName ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.apartmentName}
                                />                                
                                <div>
                                    <label
                                    htmlFor='isWaterHarvesting'
                                    className="flex items-center space-x-2 text-sm"
                                    >
                                        <input
                                           id="isWaterHarvesting"
                                            name="isWaterHarvesting"
                                            type="checkbox"
                                            value={formData.isWaterHarvesting ?? ""}
                                            checked={formData.isWaterHarvesting ?? ""}
                                            onChange={handleInputChange}
                                        />
                                        <span>Has RWH</span>
                                    </label>
                                    {errors?.isWaterHarvesting && <p className="mt-1 text-red-500 text-sm">{errors.isWaterHarvesting}</p>}

                                </div>
                                {formData?.isWaterHarvesting &&(
                                    <InputField
                                        label="Water Harvesting Date"
                                        name="waterHarvestingDate"
                                        type='date'
                                        value={formData.waterHarvestingDate ?? ""}
                                        onChange={handleInputChange}
                                        error={errors.waterHarvestingDate}
                                    />
                                )}
                                <div>
                                    <label
                                    htmlFor='hasBlocks'
                                    className="flex items-center space-x-2 text-sm"
                                    >
                                        <input
                                           id="hasBlocks"
                                            name="hasBlocks"
                                            type="checkbox"
                                            value={formData.hasBlocks ?? ""}
                                            checked={formData.hasBlocks ?? ""}
                                            onChange={handleInputChange}
                                        />
                                        <span>Has No Of Block</span>
                                    </label>
                                    {errors?.hasBlocks && <p className="mt-1 text-red-500 text-sm">{errors.hasBlocks}</p>}

                                </div>
                                {formData?.hasBlocks &&(
                                    <InputField
                                        label="No Of Block"
                                        name="noOfBlock"
                                        type='int'
                                        value={formData.noOfBlock ?? ""}
                                        onChange={handleInputChange}
                                        error={errors.noOfBlock}
                                    />
                                )}
                                <InputField
                                    label="Address"
                                    name="apartmentAddress"
                                    type='text'
                                    value={formData.apartmentAddress ?? ""}
                                    onChange={handleInputChange}
                                    error={errors.apartmentAddress}
                                />
                            </div>

                                
                            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
                                <div className="mb-4">
                                    <label htmlFor="img" className="block text-gray-700">
                                        Apartment Img
                                    </label>
                                    <input
                                        type="file"
                                        id="img"
                                        name="apartmentImageDoc"
                                        className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
                                        onChange={handleInputChange}
                                    />
                                    <img
                                        src={userImgPreview ? userImgPreview : formData.apartmentImage}
                                        className="w-44 h-44 img-fluid"
                                        alt={formData.apartmentName}
                                    />
                                    {errors.apartmentImageDoc && <span className="text-red-400">{errors.apartmentImageDoc}</span>}
                                </div>
                                {formData?.isWaterHarvesting &&(
                                    <div className="mb-4">
                                        <label htmlFor="rwh" className="block text-gray-700">
                                            RWH Img
                                        </label>
                                        <input
                                            type="file"
                                            id="rwh"
                                            name="waterHarvestingImageDoc"
                                            className="block mt-1 px-3 py-2 border border-gray-300 rounded-md w-full"
                                            onChange={handleInputChange}
                                        />
                                        <img
                                            src={rwhImgPreview ? rwhImgPreview : formData.waterHarvestingImage}
                                            className="w-44 h-44 img-fluid"
                                            alt={formData.apartmentName}
                                        />
                                        {errors.waterHarvestingImageDoc && <span className="text-red-400">{errors.waterHarvestingImageDoc}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white"
                                    onClick={handleFormSubmit}
                                    disabled={isFrozen}
                                >
                                    {item?.id ? "Update" : "Add"}
                                </button>
                            </div>
                        </div>

                        {isFrozen && (
                            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 rounded">
                                <div className="font-semibold text-gray-800 text-lg">
                                    Processing...
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default ApartmentAddEditModal
