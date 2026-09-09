import axios from 'axios';
import { useEffect, useState } from 'react'
import QRCodeComponent from '../../../components/common/QRCodeComponent';
import { waterAppPaymentReceiptApi } from '../../../api/endpoints';
import { formatLocalDate, hostInfo, toDataURL, toTitleCase } from '../../../utils/common';

function PaymentReceiptDtl({ data = null, id, setIsFrozen = () => { } }) {
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
            const response = await axios.post(waterAppPaymentReceiptApi, { id });
            if (response?.data?.status) {
                setReceiptData(response.data.data || {});
            }
            setQurCode(
                <QRCodeComponent
                    value={`${host}/water-app/payment-receipt/${id ?? data?.tranDtl?.id}`}
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
        <>
            <div className="bg-white p-6 border-2 border-red-500 border-dotted font-sans text-sm print-container">
                <div className="p-5">

                    <div className="mb-4 pb-4 border-b text-center">
                        <img
                            src={logoBase64}
                            alt="Logo"
                            className="mx-auto mb-2 w-20 h-20"
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
                                Receipt No. : <strong>{receiptData?.tranNo}</strong>
                            </p>
                            <p>
                                Department : <strong>{receiptData?.department}</strong>
                            </p>
                            <p>
                                Account :{" "}
                                <strong>{receiptData?.accountDescription}</strong>
                            </p>
                        </div>
                        <div>
                            <p>
                                Date :{" "}
                                <strong>{formatLocalDate(receiptData?.tranDate)}</strong>
                            </p>
                            <p>
                                Ward No : <strong>{receiptData?.wardNo}</strong>
                            </p>
                            <p>
                                Application No :{" "}
                                <strong>{receiptData?.applicationNo}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p>
                            Received From Mr. / Ms. /Mss. :{" "}
                            <strong>{receiptData?.ownerName}</strong>
                        </p>
                        <p>
                            Address : <strong>{receiptData?.address}</strong>
                        </p>
                        <p>
                            A Sum of Rs. : <strong>{receiptData?.amount}</strong>
                        </p>
                        <p>
                            (In words) :{" "}
                            <strong className="inline-block border-b border-black border-dotted">
                                {receiptData?.amountInWords}
                            </strong>
                        </p>
                        <p>
                            Towards : <strong>{receiptData?.accountDescription}</strong>
                            &nbsp;&nbsp;&nbsp;Vide :{" "}
                            <strong>{receiptData?.paymentMode}</strong>
                            &nbsp;&nbsp;&nbsp; Payment Type :{" "}
                            <strong className="text-red-500">
                                {receiptData?.tranDtl?.tranType}
                            </strong>
                        </p>
                        {receiptData?.chequeDtl && (
                            <p>
                                {toTitleCase(receiptData?.paymentMode)} No :{" "}
                                <strong className="inline-block border-b border-black border-dotted">
                                    {receiptData?.chequeNo}
                                </strong>
                                &nbsp;&nbsp;&nbsp;&nbsp;
                                {toTitleCase(receiptData?.paymentMode)} Date :{" "}
                                <strong className="inline-block border-b border-black border-dotted">
                                    {receiptData?.chequeDate}
                                </strong>
                                &nbsp;&nbsp;&nbsp;&nbsp; Bank Name :{" "}
                                <strong className="inline-block border-b border-black border-dotted">
                                    {receiptData?.bankName}
                                </strong>
                                &nbsp;&nbsp;&nbsp;&nbsp; Branch Name :{" "}
                                <strong className="inline-block border-b border-black border-dotted">
                                    {receiptData?.branchName}
                                </strong>
                                &nbsp;&nbsp;&nbsp;&nbsp;
                            </p>
                        )}
                    </div>
                    <div className="md-4">
                        <strong>
                            N.B.Online Payment/Cheque/Draft/ Bankers Cheque are Subject
                            to realisation.
                        </strong>
                    </div>
                    <div className="mt-1 mb-1 md-4">
                        <strong>WATER CONNECTION FEE DETAILS</strong>
                    </div>

                    <table className="mb-4 border w-full text-center border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-1 border" rowSpan={2}>
                                    Description
                                </th>
                                <th className="p-1 border" rowSpan={2}>
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-1 border">
                                    {receiptData?.tranDtl?.chargeType}
                                </td>
                                <td className="p-1 border">
                                    {receiptData?.connectionFee}
                                </td>
                            </tr>

                            {receiptData?.fineRebate?.map((item, index) => (
                                <tr key={`tr_${index}`}>
                                    <td className="p-1 border">{item?.headName}</td>
                                    <td className="p-1 border">{item?.amount}</td>
                                </tr>
                            ))}

                            <tr>
                                <td className="p-1 border font-semibold">Total Amount</td>
                                <td className="p-1 border font-semibold">
                                    {receiptData?.amount}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-1 border font-semibold">
                                    Total Paid Amount
                                </td>
                                <td className="p-1 border font-bold">
                                    {receiptData?.amount}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-between gap-6 mt-6">
                        <div>{qurCode}</div>
                        <div className="text-gray-700 text-sm">
                            <p>
                                Visit:{" "}
                                <a
                                    href={receiptData?.ulbDtl?.ulbUrl}
                                    className="text-blue-600"
                                >
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
                        ** This is a computer-generated receipt and does not require
                        signature. **
                    </p>
                </div>
            </div>
            <div className="mt-4 p-1 text-gray-500 text-xs text-center italic">
                नोट:- यह केवल पावती रसीद है I अंतिम जल संयोजन स्वीकृति पेपर नहीं
                है । जल संयोजन की स्वीकृति के पश्चात् ही रांची नगर निगम के
                निबंधित प्लम्बर के द्वारा जल संयोजन करवाना सुनिश्चित करें । जल
                संयोजन स्वीकृति हेतु कार्यालय जलापूर्ति शाखा (तीसरा तल्ला) रांची
                नगर निगम, रांची से संपर्क करें । यदि बिना जल संयोजन की स्वीकृति
                के आपके द्वारा जल संयोजन लिया जाता है तो दण्डात्मक करवाई की जा
                सकती है ।
            </div>

        </>
    )
}

export default PaymentReceiptDtl
