import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { propertyNoticeReceiptApi } from '../../../api/endpoints';
import { formatReadableDate, hostInfo, toDataURL } from '../../../utils/common';
import QRCodeComponent from '../../../components/common/QRCodeComponent';

function NoticeDtl({ data = null, id, setIsFrozen = () => { } }) {
    const token = getToken();
    const [receiptData, setReceiptData] = useState({});
    const [qurCode, setQurCode] = useState(null);
    const [logoBase64, setLogoBase64] = useState(null);
    const [signatureBase64, setSignatureBase64] = useState(null);

    useEffect(() => {
        if (id) fetchData();
        // Reset all variables when modal closes
        return () => {
            setIsFrozen(false);
            setReceiptData({});
            setQurCode(null);
        };
        // eslint-disable-next-line
    }, [id, token]);

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


    useEffect(() => {
        const loadSignatures = async () => {
            if (!receiptData?.userDtl) return;

            const { signatureImg } = receiptData.userDtl;

            try {
                const [mainLogo] = await Promise.all([
                    toDataURL(signatureImg),
                ]);

                setSignatureBase64(mainLogo);
            } catch (err) {
                console.error("Error loading logos:", err);
            }
        };

        loadSignatures();
    }, [receiptData]);


    const fetchData = async () => {
        setIsFrozen(true);
        const host = hostInfo();
        try {
            if (data) {
                setReceiptData(data || {});
                return;
            }
            const response = await axios.post(
                propertyNoticeReceiptApi,
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
        <div className="w-full p-6 bg-white text-[14px] leading-5">

            {/* HEADER LOGO + TITLE */}
            <div className="text-center pb-2">
                <img
                    src={logoBase64}
                    alt="logo"
                    className="w-20 mx-auto mb-2"
                />
                <h1 className="text-2xl font-bold">कार्यालय {receiptData?.ulbDtl?.hindiUlbName || receiptData?.ulbDtl?.ulbName}, {receiptData?.ulbDtl?.district}</h1>
                <div className="text-sm font-semibold">(<u>{receiptData?.description}</u>)</div>
            </div>

            {/* NOTICE NUMBER / DATE */}
            <div className="flex justify-between mt-1 text-sm">
                <div>
                    नोटिस संख्या :<strong><u>{receiptData.noticeNo}</u></strong> 
                </div>
                <div>
                    नोटिस तिथि :<strong><u>{receiptData.noticeDate}</u></strong>
                </div>
            </div>

            {/* OWNER DETAILS */}
            <div className="mt-2">
                <p>प्रेषित</p>

                <p>श्री/श्रीमती/कुमारी : <strong><u>{receiptData.ownerName}</u></strong> </p>
                <p>पिता/पति का नाम : <strong><u>{receiptData.guardianName}</u></strong> </p>
                <p>होल्डिंग न0 : <strong><u>{receiptData.newHoldingNo}</u></strong> </p>
                <p>वार्ड न0 : <strong><u>{receiptData.wardNo}</u></strong>  &nbsp;
                    नया वार्ड न0 : <strong><u>{receiptData.newWardNo}</u></strong> 
                </p>
                <p>पता : <strong><u>{receiptData.address}</u></strong> </p>
                <p>मोबाइल न0 : <strong><u>{receiptData.mobileNo}</u></strong> </p>
            </div>

            {/* BODY DESCRIPTION */}
            <div className="mt-1">
                <p>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    आपके भवन (होल्डिंग नं० - <strong> <u>{receiptData.newHoldingNo}</u></strong> )
                    का धृतिकर बकाया आपके द्वारा
                    <strong> <u>{formatReadableDate(receiptData?.fromDate)}</u>  से  <u>{formatReadableDate(receiptData?.uptoDate)}</u> </strong>
                    अवधि तक का धृतिकर जमा नहीं किया गया है। जिसके फल स्वरुप {receiptData?.ulbDtl?.state} नगरपालिका कर भुगतान ( समय,प्रक्रिया तथा वसूली ) विनिमय,- 2017 के नियम 3.1.2 तहत आपको उक्त अवधि का धृतिकर का भुगतान नोटिस प्राप्ति के 30 दिन के अंतर्गत अनिवार्य रूप से करना है। इस मांग पत्र में उल्लेखित राशि की गणना निम्न रूप से की गई है।
                </p>
            </div>

            {/* TABLE – PARTICULARS */}
            <div className="mt-1">
                <table className="w-full border text-sm">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border px-2 py-1">SL. NO.</th>
                            <th className="border px-2 py-1">Particular (विवरण)</th>
                            <th className="border px-2 py-1 text-right">Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.rows || [
                            { sl: 1, label: `Holding Tax to be paid for the period form <strong> <u>${formatReadableDate(receiptData?.fromDate)}</u></strong> upto  <strong> <u>${formatReadableDate(receiptData?.uptoDate)}</u></strong>`, amount: receiptData?.notice?.demandAmount },
                            { sl: 2, label: `* Interest amount @ 1% per month under section 182(3) of ${receiptData?.ulbDtl?.ulbName} Act 2011 section 182(3) एवं ${receiptData?.ulbDtl?.state} नगरपालिका संपत्ति कर (निर्धारण, संग्रहण और वसूली) नियमावली 2013 यथा संशोधित के नियम 12.2 के अनुसार।`, amount: receiptData?.notice?.penalty },
                            { sl: 3, label: `** Penalty amount under ${receiptData?.ulbDtl?.state} नगरपालिका कर भुगतान ( समय,प्रक्रिया तथा वसूली ) विनिमय,- 2017 के नियम 3.1.4`, amount: receiptData?.noticePenalty }
                        ]).map((row, index) => (
                            <tr key={index}>
                                <td className="border px-2 py-1 text-center">{row.sl}</td>
                                <td
                                    className="border px-2 py-1"
                                    dangerouslySetInnerHTML={{ __html: row.label }}
                                />
                                <td className="border px-2 py-1 text-right">{row.amount}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 font-semibold">
                            <td className="border px-2 py-1 text-center"></td>
                            <td className="border px-2 py-1">कुल भुगतये राशि</td>
                            <td className="border px-2 py-1 text-right">{receiptData.payableAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="mt-1">
                <p>
                    अतएव {receiptData?.ulbDtl?.state} नगरपालिका कर भुगतान ( समय , प्रक्रिया तथा वसूली ) विनियम,-2017 के विहित प्रावधान के अनुसार आपको उक्त अवधि का धृतिकर का भुगतान अनिवार्य रूप से करना है।
                    <br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    इस राशि का भुगतान नोटिस प्राप्त होने के 01(एक) माह के अंदर करना सुनिश्चित करेंगे। अन्यथा उक्त विनिमय 2017 की कंडिका 3.1.4 के विहित प्रावधान के अनुसार दण्ड की राशि निम्न प्रकार से अधिरोपित की जायेगी :-
                </p>
            </div>

            {/* PENALTY TABLE */}
            <div className="mt-1">
                <table className="w-full border text-sm">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border px-2 py-1">क्रमांक</th>
                            <th className="border px-2 py-1">विलम्बित अवधी</th>
                            <th className="border px-2 py-1">दण्ड की राशि</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border px-2 py-1 text-center">01.</td>
                            <td className="border px-2 py-1">निर्धारित अवधी से एक सप्ताह की अवधी तक</td>
                            <td className="border px-2 py-1">भुगतेय राशि का 1 प्रतिशत</td>
                        </tr>
                        <tr>
                            <td className="border px-2 py-1 text-center">02.</td>
                            <td className="border px-2 py-1">निर्धारित अवधी से दो सप्ताह की अवधी तक</td>
                            <td className="border px-2 py-1">भुगतेय राशि का 2 प्रतिशत</td>
                        </tr>
                        <tr>
                            <td className="border px-2 py-1 text-center">03.</td>
                            <td className="border px-2 py-1">निर्धारित अवधी से एक माह की अवधी तक</td>
                            <td className="border px-2 py-1">भुगतेय राशि का 3 प्रतिशत</td>
                        </tr>
                        <tr>
                            <td className="border px-2 py-1 text-center">04.</td>
                            <td className="border px-2 py-1">निर्धारित अवधी से दो माह की अवधी तक</td>
                            <td className="border px-2 py-1">भुगतेय राशि का 5 प्रतिशत</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-1">
                <p>
                    उसके पश्चात प्रत्येक माह के लिए 2 प्रतिशत अतिरिक्त दण्ड की राशि भुगतेय होगी।
                    <br />
                    अतएव आप कर का भुगतान ससमय करना सुनिश्चित करें।
                    <br />
                    * भुगतान के समय अद्यतन ब्याज की गणना की जाएगी
                    <br />
                    ** दण्ड राशि का गणना भुगतान के समय निर्धारित किया जाएगा।

                </p>
            </div>

            {/* FOOTER NOTES */}
            <div className="mt-1 text-sm text-center leading-6">
                <p className='text-xs'>
                    ( this value of the total payble amount is subject to the date of notice generation. It may vary every month )
                </p>
                <p className="">
                    इसे सख्त ताकीद समझा जाए।
                </p>
                <p className="text-xs">
                    ** This is a computer-generated demand notice with facsimile signature and dose not require a physical signature and stamp **
                </p>
                <p className="">
                    ** Without Prejudice **
                </p>
            </div>

            {/* SIGNATURE */}
            <div className="flex flex-col items-end mt-8 pr-4 text-right">
                <img 
                    src={signatureBase64} 
                    alt="signature" 
                    className="h-20 w-20 object-contain mb-1"
                />
                <p>उप प्रशासक</p>
                <p>राँची नगर निगम, राँची</p>
            </div>
        </div>
    );

}

export default NoticeDtl
