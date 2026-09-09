import React, { useEffect, useState } from 'react'
import { formatLocalDate, hostInfo, toDataURL, toTitleCase } from '../../../utils/common';
import axios from 'axios';
import QRCodeComponent from '../../../components/common/QRCodeComponent';
import { propDueApi } from '../../../api/endpoints';
import { getToken } from '../../../utils/auth';

function DemandPrintModalDtl({ data = null, id, setIsFrozen = () => { } }) {
    const token = getToken();
    const [receiptData, setReceiptData] = useState({});
    const [qurCode, setQurCode] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);

    useEffect(() => {
        if (id) fetchData();
        // Reset all variables when modal closes
        return () => {
            setIsFrozen(false);
            setReceiptData({});
            setQurCode(null);
        };
        // eslint-disable-next-line
    }, [id]);

    useEffect(() => {
        const loadLogos = async () => {
            if (!receiptData?.ulbDtl) return;

            const { logoImg } = receiptData.ulbDtl;

            try {
                const [mainLogo] = await Promise.all([
                    toDataURL(logoImg),
                ]);

                setLogoBase64(mainLogo);
            } catch (err) {
                console.error("Error loading logos:", err);
            }
        };

        loadLogos();
    }, [receiptData]);



    const fetchData = async () => {
        setIsFrozen(true);
        const host = hostInfo();
        try {
            if (data) {
                setReceiptData(data || {});
                return;
            }
            const response = await axios.post(propDueApi, 
                { id },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response?.data?.status) {
                setReceiptData(response.data.data || {});
            }
            setQurCode(
                <QRCodeComponent
                    value={`${host}/saf/payment-receipt/${id ?? data?.tranDtl?.id}`}
                    size={90}
                />
            );
        } catch (error) {
            console.error("Error fetching receipt:", error);
        } finally {
            setIsFrozen(false);
        }
    };
    return (
        <div className="bg-white p-6 border-2 border-red-500 border-dotted font-sans text-sm print-container">
            <div className='p-8'>

                <div className="mb-4 pb-4 border-b text-center">
                    <img
                        src={logoBase64}
                        alt="Watermark"
                        className="absolute top-1/2 left-1/2 w-72 opacity-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    />
                    <h1 className="font-bold text-xl">
                        {receiptData?.ulbDtl?.ulbName}
                    </h1>
                    <h2 className="mt-3 font-semibold">
                        <span className="px-6 pt-1 pb-1 border-2 border-black">
                            {receiptData?.description}
                        </span>
                    </h2>
                </div>

                <div className="gap-4 grid grid-cols-2 mb-4">
                    <div>
                        <p>
                            Holding No.: <strong>{receiptData?.holdingNo}</strong>
                        </p>
                        <p>
                            New Holding No.: <strong>{receiptData?.newHoldingNo}</strong>
                        </p>
                        <p>
                            Department: <strong>{receiptData?.department}</strong>
                        </p>
                        <p>
                            Account:{" "}
                            <strong>{receiptData?.accountDescription}</strong>
                        </p>
                    </div>
                    <div>
                        <p>
                            Date:{" "}
                            <strong>{formatLocalDate(receiptData?.date)}</strong>
                        </p>
                        <p>
                            Ward No: <strong>{receiptData?.wardNo}</strong>
                        </p>
                        <p>
                            Circle: <strong>{receiptData?.zone}</strong>
                        </p>
                        
                    </div>
                </div>

                <div className="mb-4">
                    <p>
                        Received From: <strong>{receiptData?.ownerName}</strong>
                    </p>
                    <p>
                        Address: <strong>{receiptData?.address}</strong>
                    </p>
                    <p>
                        Mobile No: <strong>{receiptData?.mobileNo}</strong>
                    </p>                
                </div>

                <table className="mb-4 border w-full text-center border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-1 border" colSpan={2}>
                                Demand
                            </th>
                            {/* <th className="p-1 border" rowSpan={2}>
                                Quarterly Tax
                            </th>
                            <th className="p-1 border" rowSpan={2}>
                                Rainwater Harvesting Tax
                            </th> */}
                            <th className="p-1 border" rowSpan={2}>
                                Total Quarterly Tax
                            </th>
                            <th className="p-1 border" rowSpan={2}>
                                Total Qtr
                            </th>
                            <th className="p-1 border" rowSpan={2}>
                                Total Dues
                            </th>
                        </tr>
                        <tr>
                            <th className="p-1 border" >
                                Demand From
                            </th>
                            <th className="p-1 border">
                                Demand Upto
                            </th>
                        </tr>                    
                    </thead>
                    <tbody className='text-right'>
                        {receiptData?.previousDemandReceipt?.totalDue !=0 &&(
                            <tr>
                                <td className="p-1 border">{receiptData?.previousDemandReceipt?.fromQtr} / {receiptData?.previousDemandReceipt?.fromYear}</td>
                                <td className="p-1 border">{receiptData?.previousDemandReceipt?.uptoQtr} / {receiptData?.previousDemandReceipt?.uptoYear}</td>
                                {/* <td className="p-1 border">{receiptData?.previousDemandReceipt?.qtrTax}</td>
                                <td className="p-1 border">{receiptData?.previousDemandReceipt?.qtrRwh}</td> */}
                                <td className="p-1 border">{receiptData?.previousDemandReceipt?.totalQtrTax}</td>
                                <td className="p-1 border">{receiptData?.previousDemandReceipt?.totalQtr}</td>
                                <td className="p-1 border">{receiptData?.previousDemandReceipt?.totalDue}</td>
                            </tr>
                        )}
                        <tr>
                            <td className="p-1 border">{receiptData?.currentDemandReceipt?.fromQtr} / {receiptData?.currentDemandReceipt?.fromYear}</td>
                            <td className="p-1 border">{receiptData?.currentDemandReceipt?.uptoQtr} / {receiptData?.currentDemandReceipt?.uptoYear}</td>
                            {/* <td className="p-1 border">{receiptData?.currentDemandReceipt?.qtrTax}</td>
                            <td className="p-1 border">{receiptData?.currentDemandReceipt?.qtrRwh}</td> */}
                            <td className="p-1 border">{receiptData?.currentDemandReceipt?.totalQtrTax}</td>
                            <td className="p-1 border">{receiptData?.currentDemandReceipt?.totalQtr}</td>
                            <td className="p-1 border">{receiptData?.currentDemandReceipt?.totalDue}</td>
                        </tr>   
                        <tr>
                            <td colSpan={3} className="p-1 border text-red-500">* Total Quarterly Tax x Total Quarter = Total Dues</td>
                            <td className="p-1 border">Total Dues</td>
                            <td className="p-1 border">{(Number(receiptData?.previousDemandReceipt?.totalDue) + Number(receiptData?.currentDemandReceipt?.totalDue)).toFixed(2)}</td>
                        </tr>  
                        <tr>
                            <td colSpan={3} className="p-1 border"></td>
                            <td className="p-1 border">1.5 % Penalty</td>
                            <td className="p-1 border">{receiptData?.monthlyPenalty}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-1 border"></td>
                            <td className="p-1 border">Notice Penalty</td>
                            <td className="p-1 border">{receiptData?.noticePenalty}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-1 border"></td>
                            <td className="p-1 border">Notice Additional Penalty</td>
                            <td className="p-1 border">{receiptData?.noticeAdditionalPenalty}</td>
                        </tr>
                                    
                        {receiptData?.otherPenaltyList?.map((item, index) => (
                            <tr key={`tr_${index}`}>
                                <td colSpan={3} className="p-1 border"></td>
                                <td className="p-1 border" >
                                    {item?.penaltyType}
                                </td>
                                <td className="p-1 border">{item?.penaltyAmt}</td>
                            </tr>
                        ))}
                        {receiptData?.additionalTaxList?.map((item, index) => (
                            <tr key={`tr_${index}`}>
                                <td colSpan={3} className="p-1 border"></td>
                                <td className="p-1 border" >
                                    {item?.taxType}
                                </td>
                                <td className="p-1 border">{item?.amount}</td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan={3} className="p-1 border"></td>
                            <td className="p-1 border" >Less First Qtr Rebate</td>
                            <td className="p-1 border">{receiptData?.firstQuatreRebate}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-1 border"></td>
                            <td className="p-1 border" >Less Total Advance</td>
                            <td className="p-1 border">{receiptData?.advanceAmount}</td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="p-1 border"></td>
                            <td className="p-1 border" >SWM Amount</td>
                            <td className="p-1 border">{receiptData?.swmPayableAmount}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border font-semibold" colSpan={3}></td>
                            <td className="p-1 border" >Grand Total Demand</td>
                            <td className="p-1 border font-semibold">
                                {receiptData?.totalPayableAmount}
                            </td>
                        </tr>
                        <tr>
                            <td className="p-1 border font-semibold" >Total Demand (in words)</td>
                            <td className="p-1 border text-left" colSpan={4} >{receiptData?.totalPayableAmountInWord}</td>
                        </tr>
                    </tbody>
                </table>

                <p className="mt-4 text-gray-500 text-xs text-center italic">
                    ** This is a computer-generated receipt and does not require
                    signature. **
                </p>
            </div>
        </div>
    );
}

export default DemandPrintModalDtl
