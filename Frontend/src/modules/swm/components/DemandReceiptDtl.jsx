import React, { useEffect, useState } from "react";
import axios from "axios";
import { swmConsumerDemandReceiptApi } from "../../../api/endpoints";
import { formatCustomMonthYear, formatLocalDate, toDataURL } from "../../../utils/common";
import { getToken } from "../../../utils/auth";

function DemandReceiptDtl({ data = null, id, setIsFrozen = () => {} }) {
    const [receiptData, setReceiptData] = useState({});
    const [qurCode, setQurCode] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [leftLogoBase64, setLeftLogoBase64] = useState(null);
    const [rightLogoBase64, setRightLogoBase64] = useState(null);
    const token = getToken();

    useEffect(() => {
        if (id) fetchData();

        // Reset on unmount
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

            const { logoImg, leftLogo, rightLogo } = receiptData.ulbDtl;
            try {
                const [mainLogo, left, right] = await Promise.all([
                    toDataURL(logoImg),
                    toDataURL(leftLogo),
                    toDataURL(rightLogo),
                ]);
                setLogoBase64(mainLogo);
                setLeftLogoBase64(left);
                setRightLogoBase64(right);
            } catch (err) {
                console.error("Error loading logos:", err);
            }
        };
        loadLogos();
    }, [receiptData]);

    const fetchData = async () => {
        setIsFrozen(true);
        try {
            if (data) {
                setReceiptData(data || {});
                return;
            }
            const response = await axios.post(swmConsumerDemandReceiptApi, 
                { id },
                {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                }
            );
            if (response?.data?.status) {
                setReceiptData(response.data.data || {});
            }
        } catch (error) {
            console.error("Error fetching receipt:", error);
        } finally {
            setIsFrozen(false);
        }
    };

    return (
        <div className="bg-white p-6 print:p-2 border-2 border-red-500 border-dotted print:border-none font-sans text-sm print-container">
            <div className="mb-4 pb-4 border-b">
                {/* Header Section */}
                <div className="flex items-center justify-center gap-4 text-center">
                    {leftLogoBase64 && (
                        <img src={leftLogoBase64} alt="Left Logo" className="w-16 h-16 object-contain" />
                    )}
                    <h1 className="font-bold text-xl text-gray-800">
                        {receiptData?.ulbDtl?.ulbName}
                    </h1>
                    {rightLogoBase64 && (
                        <img src={rightLogoBase64} alt="Right Logo" className="w-16 h-16 object-contain" />
                    )}
                </div>

                <h2 className="mt-3 font-semibold text-center">
                    <span className="px-6 pt-1 pb-1 border-2 border-black">
                        {receiptData?.description}
                    </span>
                </h2>
            </div>

            {/* Basic Info */}
            <div className="gap-4 grid grid-cols-2 mb-4">
                <div>
                    <p>Department : <strong>{receiptData?.department}</strong></p>
                    <p>Account : <strong>{receiptData?.accountDescription}</strong></p>
                </div>
                <div>
                    <p>Print Date : <strong>{formatLocalDate(receiptData?.printDate)}</strong></p>
                    <p>Ward No : <strong>{receiptData?.wardNo}</strong></p>
                    <p>New Ward No : <strong>{receiptData?.newWardNo}</strong></p>
                    <p>Consumer No : <strong>{receiptData?.consumerNo}</strong></p>
                    <p>Holding No : <strong>{receiptData?.holdingNo}</strong></p>
                </div>
            </div>

            {/* Owner Details */}
            <div className="mb-4">
                <p>Received From : <strong>{receiptData?.ownerName}</strong></p>
                <p>Address : <strong>{receiptData?.address}</strong></p>
                <p>Mobile No. : <strong>{receiptData?.mobileNo}</strong></p>
                
            </div>

            {/* Demand Table */}
            <table className="mb-4 border w-full text-center border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-1 border">Tax Type</th>
                        <th className="p-1 border">From Month</th>
                        <th className="p-1 border">Upto Month</th>
                        <th className="p-1 border">Monthly Demand</th>
                        <th className="p-1 border">Total Dues</th>
                    </tr>
                </thead>
                <tbody>
                    {receiptData?.rateDemandList?.length > 0 && receiptData.rateDemandList.map((item, index) => (
                        <tr key={index}>
                            {index === 0 && (
                                <td className="p-1 border text-left" rowSpan={receiptData.rateDemandList.length}>
                                    Solid Waste User Charge
                                </td>
                            )}
                            <td className="p-1 border">{formatLocalDate(item?.demandFrom)}</td>
                            <td className="p-1 border">{formatLocalDate(item?.demandUpto)}</td>
                            <td className="p-1 border">{item?.rate}</td>
                            <td className="p-1 border">{item?.balance}</td>
                        </tr>
                    ))}

                    <tr>
                        <td colSpan={4} className="p-1 text-right border font-semibold">Total Demand</td>
                        <td className="p-1 border font-semibold">{receiptData?.totalRateDemand}</td>
                    </tr>

                    {receiptData?.otherPenaltyList?.length > 0 &&
                        receiptData.otherPenaltyList.map((item, index) => (
                            <tr key={`penalty_${index}`}>
                                <td colSpan={4} className="p-1 text-right border font-semibold">
                                    {item?.penaltyName || "Other Penalty"}
                                </td>
                                <td className="p-1 border font-semibold">{item?.amount}</td>
                            </tr>
                        ))
                    }

                    {receiptData?.advanceAmount > 0 && (
                        <tr>
                            <td colSpan={4} className="p-1 text-right border font-semibold">Remaining Advance</td>
                            <td className="p-1 border font-semibold">{receiptData?.advanceAmount}</td>
                        </tr>
                    )}

                    <tr>
                        <td colSpan={4} className="p-1 text-right border font-semibold">Total Payable Amount</td>
                        <td className="p-1 border font-bold">{receiptData?.payableAmount}</td>
                    </tr>
                    <tr>
                        <td colSpan={5} className="p-1 text-left border ">
                            Total Demand (In Words): <span className="font-semibold">{receiptData?.amountInWords}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <div className="flex justify-between gap-6 mt-6">
                <div></div>
                <div className="text-gray-700 text-sm">
                    <p>
                        Visit:{" "}
                        <a href={receiptData?.ulbDtl?.ulbUrl} className="text-blue-600">
                            {receiptData?.ulbDtl?.ulbUrl}
                        </a>
                    </p>
                    <p>Call: {receiptData?.ulbDtl?.tollFreeNo}</p>
                    <p className="mt-2">
                        In collaboration with <br />
                        {receiptData?.ulbDtl?.collaboration}
                    </p>
                </div>
            </div>

            <p className="mt-4 text-gray-500 text-xs text-center italic">
                ** This is a computer-generated receipt and does not require signature. **
            </p>
        </div>
    );
}

export default DemandReceiptDtl;
