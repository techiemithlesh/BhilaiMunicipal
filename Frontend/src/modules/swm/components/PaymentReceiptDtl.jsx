import React, { useEffect, useState } from 'react'
import QRCodeComponent from '../../../components/common/QRCodeComponent';
import { swmConsumerPaymentReceiptApi } from '../../../api/endpoints';
import { formatLocalDate, hostInfo, toDataURL, toTitleCase } from '../../../utils/common';
import axios from 'axios';

function PaymentReceiptDtl({ data = null, id, setIsFrozen = () => { } }) {
    const [receiptData, setReceiptData] = useState({});
    const [qurCode, setQurCode] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [leftLogoBase64, setLeftLogoBase64] = useState(null);
    const [rightLogoBase64, setRightLogoBase64] = useState(null);

    useEffect(() => {
        if (id) fetchData();
        return () => {
            setIsFrozen(false);
            setReceiptData({});
            setQurCode(null);
        };
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
        const host = hostInfo();
        setQurCode(
            <QRCodeComponent
                value={host + "/swm/payment-receipt/" + id}
                size={90}
            />
        );
        try {
            if (data) {
                setReceiptData(data || {});
                return;
            }
            const response = await axios.post(swmConsumerPaymentReceiptApi, { id });
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
        /* ✅ Added 'relative' and 'overflow-hidden' to ensure watermark stays inside */
        <div className="relative bg-white p-6 print:p-2 border-2 border-red-500 border-dotted font-sans text-sm print-container overflow-hidden">
            
            {/* ✅ FIXED WATERMARK UI: Centered perfectly behind all content */}
            {logoBase64 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 print:flex">
                    <img
                        src={logoBase64}
                        alt="Watermark"
                        className="w-[350px] opacity-[0.08] grayscale select-none"
                    />
                </div>
            )}

            {/* ✅ Wrapped content in relative z-10 to stay ABOVE watermark */}
            <div className="relative z-10">
                <div className="mb-4 pb-4 border-b">
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

                <div className="gap-4 grid grid-cols-2 mb-4">
                    <div>
                        <p>Receipt No. : <strong>{receiptData?.tranNo}</strong></p>
                        <p>Department : <strong>{receiptData?.department}</strong></p>
                        <p>Account : <strong>{receiptData?.accountDescription}</strong></p>
                    </div>
                    <div>
                        <p>Date : <strong>{formatLocalDate(receiptData?.tranDate)}</strong></p>
                        <p>Ward No : <strong>{receiptData?.wardNo}</strong></p>
                        <p>New Ward No : <strong>{receiptData?.newWardNo}</strong></p>
                        <p>Consumer No : <strong>{receiptData?.consumerNo}</strong></p>
                        <p>Holding No : <strong>{receiptData?.holdingNo}</strong></p>
                    </div>
                </div>

                <div className="mb-4">
                    <p>Received From : <strong>{receiptData?.ownerName}</strong></p>
                    <p>Address : <strong>{receiptData?.address}</strong></p>
                    <p>A Sum of Rs. : <strong>{receiptData?.amount}</strong></p>
                    <p>(In words) : <strong className="inline-block border-b border-black border-dotted">{receiptData?.amountInWords}</strong></p>
                    <p>
                        Towards : <strong>{receiptData?.accountDescription}</strong>
                        &nbsp;&nbsp;&nbsp;Vide : <strong>{receiptData?.paymentMode}</strong>
                        &nbsp;&nbsp;&nbsp; Payment Type : <strong className="text-red-500">{receiptData?.tranDtl?.tranType}</strong>
                    </p>
                    {receiptData?.chequeDtl && (
                        <p>
                            {toTitleCase(receiptData?.paymentMode)} No : <strong className="inline-block border-b border-black border-dotted">{receiptData?.chequeNo}</strong>
                            &nbsp;&nbsp;&nbsp;&nbsp; {toTitleCase(receiptData?.paymentMode)} Date : <strong className="inline-block border-b border-black border-dotted">{receiptData?.chequeDate}</strong>
                            &nbsp;&nbsp;&nbsp;&nbsp; Bank Name : <strong className="inline-block border-b border-black border-dotted">{receiptData?.bankName}</strong>
                            &nbsp;&nbsp;&nbsp;&nbsp; Branch Name : <strong className="inline-block border-b border-black border-dotted">{receiptData?.branchName}</strong>
                        </p>
                    )}
                </div>

                <div className="md-4">
                    <strong>N.B.Online Payment/Cheque/Draft/ Bankers Cheque are Subject to realisation.</strong>
                </div>
                <div className="md-4 mt-1 mb-1">
                    <strong>USER CHARGE DETAILS</strong>
                </div>

                <table className="mb-4 border w-full text-center border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-1 border" rowSpan={2}>Description</th>
                            <th className="p-1 border" rowSpan={2}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-1 border">Period : <strong className="border-b border-black border-dotted">{formatLocalDate(receiptData?.fromDate)}</strong> To <strong className="border-b border-black border-dotted">{formatLocalDate(receiptData?.uptoDate)}</strong></td>
                            <td className="p-1 border">{receiptData?.monthlyDemandAmount}</td>
                        </tr>
                        {receiptData?.fineRebate?.map((item, index) => (
                            <tr key={`tr_${index}`}>
                                <td className="p-1 border">{item?.headName}</td>
                                <td className="p-1 border">{item?.amount}</td>
                            </tr>
                        ))}
                        <tr>
                            <td className="p-1 border font-semibold">Total Amount</td>
                            <td className="p-1 border font-semibold">{receiptData?.amount}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border font-semibold">Total Paid Amount</td>
                            <td className="p-1 border font-bold">{receiptData?.amount}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border font-semibold">Due Amount</td>
                            <td className="p-1 border font-bold">{receiptData?.dueAmount || 0}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="flex justify-between gap-6 mt-6">
                    <div>{qurCode}</div>
                    <div className="text-gray-700 text-sm">
                        <p>Visit: <a href={receiptData?.ulbDtl?.ulbUrl} className="text-blue-600">{receiptData?.ulbDtl?.ulbUrl}</a></p>
                        <p>Call: {receiptData?.ulbDtl?.tollFreeNo}</p>
                        <p className="mt-2 text-xs">In collaboration with <br /> {receiptData?.ulbDtl?.collaboration}</p>
                    </div>
                </div>

                <p className="mt-4 text-gray-500 text-xs text-center italic">
                    ** This is a computer-generated receipt and does not require signature. **
                </p>
            </div>
        </div>
    )
}

export default PaymentReceiptDtl