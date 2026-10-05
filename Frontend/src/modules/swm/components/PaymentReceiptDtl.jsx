import React, { useEffect, useState } from 'react'
import QRCodeComponent from '../../../components/common/QRCodeComponent';
import { swmConsumerPaymentReceiptApi } from '../../../api/endpoints';
import { formatLocalDate, formatTimeAMPM, hostInfo, toDataURL, toTitleCase } from '../../../utils/common';
import axios from 'axios';
import { useTranslation } from "react-i18next";
import "../../../i18n";

function PaymentReceiptDtl({ data = null, id, setIsFrozen = () => { } }) {
    const isTest = JSON.parse(import.meta.env.VITE_REACT_APP_TEST || "false");
    const [receiptData, setReceiptData] = useState({});
    const [qurCode, setQurCode] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [leftLogoBase64, setLeftLogoBase64] = useState(null);
    const [rightLogoBase64, setRightLogoBase64] = useState(null);
    const { t, i18n } = useTranslation();

    useEffect(() => {
        // Receipts default to Hindi; the English/Hindi toggle can still switch it.
        i18n.changeLanguage("hi");
        // eslint-disable-next-line
    }, []);

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
            const { waterMarkImg, leftLogo, rightLogo } = receiptData.ulbDtl;
            try {
                const [mainLogo, left, right] = await Promise.all([
                    toDataURL(waterMarkImg),
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

    const ulbName =
    i18n.language === "hi"
      ? receiptData?.ulbDtl?.hindiUlbName || receiptData?.ulbDtl?.ulbName
      : receiptData?.ulbDtl?.ulbName;

    return (
        /* ✅ Added 'relative' and 'overflow-hidden' to ensure watermark stays inside */
        <div className="relative bg-white p-6 print:p-2 border-2 border-red-500 border-dotted font-sans text-sm print-container overflow-hidden">
            {isTest && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 overflow-hidden">
                <div className="whitespace-nowrap text-red-800 opacity-10 text-[10rem] font-bold -rotate-[35deg] uppercase select-none">
                    TEST TEST TEST TEST TEST
                </div>
                </div>
            )}
            
            {/* ✅ FIXED WATERMARK UI: Centered perfectly behind all content */}
            {logoBase64 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
                    <img
                        src={logoBase64}
                        alt="Watermark"
                        className="w-[440px] opacity-[0.55] select-none"
                    />
                </div>
            )}

            {/* ✅ Wrapped content in relative z-10 to stay ABOVE watermark */}
            <div className="relative z-10">
                <div className="mb-4 pb-4 border-b">
                    <div className="flex items-center justify-center gap-4 text-center">
                        {leftLogoBase64 && (
                            <img src={leftLogoBase64} alt="Left Logo" className="w-[50px] h-[50px] object-contain shrink-0" />
                        )}
                        <h1 className="font-bold text-xl text-gray-800">
                            {ulbName}
                        </h1>
                        {rightLogoBase64 && (
                            <img src={rightLogoBase64} alt="Right Logo" className="w-[90px] h-[35px] object-contain shrink-0" />
                        )}
                    </div>

                    <h2 className="mt-3 font-semibold text-center">
                        <span className="px-6 pt-1 pb-1 border-2 border-black">
                            {t(receiptData?.description)}
                        </span>
                    </h2>
                </div>

                <div className="gap-4 grid grid-cols-2 mb-4">
                    <div>
                        <p>{t(`Receipt No.`)} : <strong>{receiptData?.tranNo}</strong></p>
                        <p>{t(`Department`)} : <strong>{t(receiptData?.department)}</strong></p>
                        <p>{t(`Account`)} : <strong>{t(receiptData?.accountDescription)}</strong></p>
                    </div>
                    <div>
                        <p>{t(`Date`)} : <strong>{formatLocalDate(receiptData?.tranDate)}</strong></p>
                        <p>{t(`Ward No`)} : <strong>{receiptData?.wardNo}</strong></p>
                        <p>{t(`Consumer No`)} : <strong>{receiptData?.consumerNo}</strong></p>
                        <p>{t(`Holding No`)} : <strong>{receiptData?.holdingNo}</strong></p>
                    </div>
                </div>

                <div className="mb-4">
                    <p>{t(`Received From`)} : <strong>{receiptData?.ownerName}</strong></p>
                    <p>{t(`Address`)} : <strong>{receiptData?.address}</strong></p>
                    <p>{t(`A Sum of Rs.`)} : <strong>{receiptData?.amount}</strong></p>
                    <p>({t(`In words`)}) : <strong className="inline-block border-b border-black border-dotted">{receiptData?.amountInWords}</strong></p>
                    <p>
                        {t(`Towards`)} : <strong>{t(receiptData?.accountDescription)}</strong>
                        &nbsp;&nbsp;&nbsp;{t(`Vide`)} : <strong>{receiptData?.paymentMode}</strong>
                        &nbsp;&nbsp;&nbsp; {t(`Payment Type`)} : <strong className="text-red-500">{receiptData?.tranDtl?.tranType}</strong>
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
                    <strong>
                        {t("N.B.")} {t("Cheque / Draft / Banker Cheque / Online payment are subject to realization")}
                    </strong>
                </div>
                <div className="md-4 mt-1 mb-1">
                    <strong>{t(`USER CHARGE DETAILS`)}</strong>
                </div>

                <table className="mb-4 border w-full text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-1 border" rowSpan={2}>{t(`Description`)}</th>
                            <th className="p-1 border" rowSpan={2}>{t(`Amount`)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-1 border">{t(`Period`)} : <strong className="border-b border-black border-dotted">{formatLocalDate(receiptData?.fromDate)}</strong> {t(`To`)} <strong className="border-b border-black border-dotted">{formatLocalDate(receiptData?.uptoDate)}</strong></td>
                            <td className="p-1 border">{receiptData?.monthlyDemandAmount}</td>
                        </tr>
                        {receiptData?.fineRebate?.map((item, index) => (
                            <tr key={`tr_${index}`}>
                                <td className="p-1 border">{item?.headName}</td>
                                <td className="p-1 border">{item?.amount}</td>
                            </tr>
                        ))}
                        <tr>
                            <td className="p-1 border font-semibold">{t(`Total Amount`)}</td>
                            <td className="p-1 border font-semibold">{receiptData?.amount}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border font-semibold">{t(`Amount Received`)}</td>
                            <td className="p-1 border font-bold">{receiptData?.amount}</td>
                        </tr>
                        <tr>
                            <td className="p-1 border font-semibold">{t(`Due Amount`)}</td>
                            <td className="p-1 border font-bold">{receiptData?.dueAmount || 0}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="flex justify-end pr-[16%] mt-2 text-[12px]">
                    {t("Signature of Tax Collector")}
                </div>
        
                {/* ===================== NOTES + FOOTER ===================== */}
                <div className="flex justify-between items-start gap-6 mt-2 text-[12px] leading-tight">
                    <div className="max-w-[62%]">
                    <p className="font-bold">{t("Note")}:-</p>
                    <ul className="list-disc pl-8">
                        <li>{t("This is a computer-generated receipt and does not require signature.")}</li>
                        <li>{t("Net Banking/Online Payment/Cheque/Draw/Banker's Check are subject to collection.")}</li>
                        <li>
                        {t(
                            "You will receive SMS on your registered mobile number. For the amount paid.If SMS is not received then call to verify your payment amount",
                        )}{" "}
                        <strong>{(receiptData?.ulbDtl?.tollFreeNo)}</strong> {t("Or go")}{" "}
                        <strong className="block">{receiptData?.ulbDtl?.ulbUrl || hostInfo()}</strong>
                        </li>
                        <li>
                        {t("Print Date")} : {formatLocalDate(receiptData?.printingDate, "-")}{" "}
                        {formatTimeAMPM(receiptData?.printingDate)}
                        </li>
                    </ul>
                    </div>
        
                    <div className="text-center pt-8 pr-2">
                    <p className="font-bold uppercase">{(ulbName)}</p>
                    <p>{t("In collaboration with")}</p>
                    <p>{(receiptData?.ulbDtl?.collaboration)}</p>
                    </div>
                </div>

                <p className="mt-4 text-gray-500 text-xs text-center italic">
                    ** {t(`This is a computer-generated receipt and does not require signature.`)} **
                </p>
            </div>
        </div>
    )
}

export default PaymentReceiptDtl