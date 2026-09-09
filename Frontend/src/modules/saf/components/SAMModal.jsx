import { useEffect, useRef, useState } from "react";
import { formatLocalDate, hostInfo } from "../../../utils/common";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import axios from "axios";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import jhakhandLog from "../../../assets/images/logo.jpg";
import html2canvas from "html2canvas";
import { memoReceiptApi } from "../../../api/endpoints";

function SAMModal({ id, onClose, lag = "EN" }) {
  const [isFrozen, setIsFrozen] = useState(false);
  const [receiptData, setReceiptData] = useState({});
  const [qurCode, setQurCode] = useState(null);
  const printRef = useRef();
  const [isHindi, setIsHindi] = useState(false);

  useEffect(() => {
    setIsHindi(lag !== "EN");
  }, [lag]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(memoReceiptApi, { id });
      if (response?.data?.status) {
        setReceiptData(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const handlePrint = async () => {
    if (!printRef.current) return;

    // Generate canvas from the printRef
    const canvas = await html2canvas(printRef.current, {
      scale: 2, // Better resolution
      useCORS: true, // If you have external images
      logging: false,
    });

    const dataUrl = canvas.toDataURL("image/png");
    // Create a new window with the canvas image
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @medial{
              @page {
                size: A4;               
                margin: 10mm 15mm;      
                padding: 0;             
              }
              .print-container > * {
                margin-bottom: 6mm;
              }

            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for image to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  useEffect(() => {
    const host = hostInfo();
    setQurCode(
      <QRCodeComponent
        value={host + "/saf/sam-memo/" + id + "/" + (isHindi ? "HN" : "EN")}
        size={90}
      />
    );
  }, [isHindi]);

  return (
    <div className="z-50 print:static fixed inset-0 flex justify-center items-center bg-black print:bg-transparent bg-opacity-50 p-4 print:p-0">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg print:shadow-none p-6 print:p-0 rounded-lg w-full print:max-w-full max-w-6xl max-h-[90vh]"
      >
        <div className="print:hidden flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">SAM Receipt</h2>
          <div className="flex gap-2">
            {!isHindi ? (
              <button
                onClick={() => setIsHindi(true)}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
              >
                Hindi
              </button>
            ) : (
              <button
                onClick={() => setIsHindi(false)}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
              >
                English
              </button>
            )}
            <button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
            >
              Print
            </button>
            {onClose && (
              <button
                className="text-gray-600 hover:text-red-600"
                onClick={onClose}
              >
                <FaTimes size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex-grow print:overflow-visible overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <div className="overflow-x-auto" ref={printRef}>
              <div className="bg-white mx-auto p-6 print:p-2 border border-gray-300 border-dotted print:border-none max-w-3xl font-sans print:text-black text-sm">
                {/* Header */}
                <div className="mb-4 pb-2 border-b text-center">
                  <div className="relative flex justify-center items-center">
                    <img
                      src={receiptData?.ulbDtl?.logoImg}
                      alt="RMC Logo"
                      className="left-0 absolute w-14 h-14"
                    />
                    <h1 className="w-full font-bold text-xl">
                      {isHindi
                        ? receiptData?.ulbDtl?.hindiUlbName
                        : receiptData?.ulbDtl?.ulbName}
                    </h1>
                  </div>
                  <h2 className="mt-1 font-semibold text-sm">
                    {isHindi
                      ? "झारखण्ड नगरपालिका अधिनियम -2011 की धरा 152 (3) के अंतर्गत स्वनिर्धारित किये गए संपत्ति कर की सूचना |"
                      : "Notice of property tax customized under section 152(3) of Jharkhand Municipal Act-2011"}
                  </h2>
                </div>

                {/* Details */}
                <div className="mb-2 text-xs text-right">
                  <div>
                    {isHindi ? "मेमो सं०" : "Memo No."}:{" "}
                    <strong>{receiptData?.memoNo}</strong>
                  </div>
                  <div>
                    {isHindi ? "दिनांक" : "Date"}:{" "}
                    <strong>{formatLocalDate(receiptData?.createdAt)}</strong>
                  </div>
                  <div>
                    {isHindi ? "प्रभावी" : "Effective"}:{" "}
                    <strong>{receiptData?.effective}</strong>
                  </div>
                </div>

                <div className="mb-4 text-sm leading-tight">
                  <p>
                    {isHindi ? "श्री /श्रीमती /सुश्री" : "Mr/Mrs/Ms"}:{" "}
                    <strong>{receiptData?.ownerName}</strong>
                  </p>
                  <p>
                    {isHindi ? "पता" : "Address"}:{" "}
                    <strong>{receiptData?.propAddress}</strong>
                  </p>
                  <p className="pt-1">
                    &nbsp;&nbsp;&nbsp;
                    {isHindi
                      ? "एतद् द्वारा आपको सूचित किया जाता है कि आपके"
                      : "You are hereby informed that"}{" "}
                    {receiptData?.oldHoldingNo && (
                      <>
                        {isHindi ? "पुराना गृह सं०" : "Old Holding Number"} -{" "}
                        <strong>{receiptData?.oldHoldingNo}</strong>
                      </>
                    )}{" "}
                    {isHindi ? "नया गृह सं०" : "your New Holding Number"} -{" "}
                    <strong>{receiptData?.newHoldingNo}</strong>{" "}
                    {isHindi ? "पुराना वार्ड सं०" : "in Ward No"} -{" "}
                    <strong>{receiptData?.wardNo}</strong>,
                    {isHindi ? "नया वार्ड सं०" : "New Ward No"} -{" "}
                    <strong>{receiptData?.newWardNo}</strong>{" "}
                    {isHindi
                      ? "हुआ है , आपके स्व० निर्धारण घोषणा पत्र के आधार पर वार्षिक किराया मूल्य"
                      : "has been done, on the basis of your self-assessment declaration form. The annual rental price has been fixed at Rs"}{" "}
                    <strong>{receiptData?.arv}/-</strong>{" "}
                    {isHindi
                      ? "निर्धारित किया गया है |"
                      : "based on your self-assessment declaration."}
                  </p>
                  <p>
                    {isHindi
                      ? "इसके अनुसार प्रति तिमाही कर निम्न प्रकार होगा |"
                      : "Accordingly the tax per quarter will be as follows."}
                  </p>
                </div>

                {/* Tax Table */}
                <table className="mb-4 border w-full text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-2 py-1 border text-left">
                        {isHindi ? "क्रम स०" : "SL. No."}
                      </th>
                      <th className="px-2 py-1 border text-left">
                        {isHindi ? "ब्यौरे" : "Particulars"}
                      </th>
                      <th className="px-2 py-1 border text-right">
                        {isHindi ? "राशि (in Rs.)" : "Amount (in Rs.)"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 border">1.</td>
                      <td className="px-2 border">
                        {isHindi ? "गृह कर" : "House Tax"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.holdingTax || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 border">2.</td>
                      <td className="px-2 border">
                        {isHindi ? "जल कर" : "Water Tax"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.waterTax || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 border">3.</td>
                      <td className="px-2 border">
                        {isHindi ? "शौचालय कर" : "Latrine Tax"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.latrineTax || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 border">4.</td>
                      <td className="px-2 border">
                        {isHindi ? "वर्षा जल संचयन जुर्माना" : "RWH Penalty"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.rwhTax || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 border">5.</td>
                      <td className="px-2 border">
                        {isHindi ? "शिक्षा उपकर" : "Education Cess"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.educationCessTax || 0}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 border">6.</td>
                      <td className="px-2 border">
                        {isHindi ? "स्वास्थ्य उपकर" : "Health Cess"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.healthCessTax || 0}
                      </td>
                    </tr>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan="2" className="px-2 border text-right">
                        {isHindi
                          ? "कुल राशि (प्रति तिमाही )"
                          : "Total Amount (per quarter)"}
                      </td>
                      <td className="px-2 border text-right">
                        {receiptData?.totalTax || 0}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signature Box */}
                <div className="flex justify-between gap-6 mt-3">
                  <div>{qurCode}</div>
                  <div className="text-gray-700 text-sm">
                    <div className="p-3 border border-gray-400"></div>
                    <p>
                      {isHindi
                        ? "आवेदक द्वारा हस्ताक्षर किए जाने के लिए"
                        : "To be signed by the Applicant"}
                    </p>
                  </div>
                </div>

                {/* Note Section */}
                <div className="pt-2 border-t text-xs">
                  <p className="mb-1 font-semibold underline">
                    {isHindi ? "नोट" : "Note"}:-
                  </p>
                  <ol className="space-y-1 ml-5 list-decimal">
                    <li>
                      {isHindi
                        ? "कर निर्धारण की सूची, राँची नगर निगम के वेबसाइट"
                        : "The tax assessment list is displayed on the website of"}{" "}
                      {receiptData?.ulbDtl?.ulbName} :
                      {isHindi
                        ? "पर प्रदर्शित है |"
                        : "For Details Please Visit"}{" "}
                      : {receiptData?.ulbDtl?.ulbUrl} OR Call us at{" "}
                      {receiptData?.ulbDtl?.tollFreeNo}
                    </li>
                    <li>
                      {isHindi
                        ? "नियमावली कंडिका 11.4 के अलोक में वर्षा जल संरक्षण कि व्यवस्था नहीं होने के कारण अतिरिक्त गृह कर लगाया जो संपत्ति कर का 50% होगा | हिदायत दी जाती है कि , वर्षा जल संरक्षण संरचना लगा कर निगम को सूचित करे तथा अतिरिक्त गृह कर से राहत पाये|"
                        : "In the light of manual 11.4, additional house tax will be levied which will be 50% of the property tax due to lack of arrangement of rainwater harvesting. It is advised to inform the corporation by installing rainwater conservation structure and get relief from additional house tax."}
                    </li>
                    <li>
                      {isHindi
                        ? "प्रत्येक वित्तीय वर्ष में संपत्ति कर का भुगतान त्रैमासिक देय होगा |"
                        : "Property tax will be paid quartely in each financial year."}
                    </li>
                    <li>
                      {isHindi
                        ? "यदि किसी वर्ष के लिए संपूर्ण घृति कर का भुगतान वित्तीय वर्ष के 30 जून के पूर्व कर दिया जाता है , तो करदाता को 5% कि रियायत दी जाएगी |"
                        : "If the entire hourly tax for a year is paid before 30 June of the financial year, a rebate of 5% will be given to the taxpayer."}
                    </li>
                    <li>
                      {isHindi
                        ? "किसी देय घृति को निद्रिष्टि समयावधि (प्रत्येक तिमाही ) के अंदर या उसके पूर्व नहीं चुकाया जाता है , तो 1% प्रतिमाह कि दर से साधारण ब्याज देय होगा |"
                        : "Simple Interest will be payable at the rate of 1% per month if any payable are not not paid within or before the specified time period (every quarter)."}
                    </li>
                    <li>
                      {isHindi
                        ? "यह कर निर्धारण आपके स्व -निर्धारण एवं की गयी घोषणा के आधार पर कि जा रही है,इस स्व -निर्धारण -सह-घोषणा पत्र कि स्थानीय जांच तथा समय निगम करा सकती है एवं तथ्य गलत पाये जाने पर नियमावली कंडिका 13.2 के अनुसार निर्धारित शास्ति (Fine) एवं अंतर राशि देय होगा |"
                        : "This tax assessment is being done on the basis of your self-determination and declaration made, this self-assessment-cum-declaration can be conducted by the local corporation in due course of time and if the facts are found to be incorrect, the penalty prescribed in accordance with manual Condica 13.2 (Fine) and difference amount will be payable."}
                    </li>
                    <li>
                      {isHindi
                        ? `${receiptData?.ulbDtl?.hindiUlbName} द्वारा संग्रहित इस संपत्ति कर इन इमारतों / ढांचों को कोई कानूनी हैसियत प्रदान नहीं करता है और / या न ही अपने मालिकों / दखलकार को कानूनी अधिकार प्रदान करता है |`
                        : `The property is collected by ${receiptData?.ulbDtl?.ulbName} does not confer any legal status on these buildings and / or its owners / occupiers Confers any legal right to.`}
                    </li>
                    <li>
                      {isHindi
                        ? `अगर आपने नए होल्डिंग न० का आखरी अंक 5/6/7/8 है तो यह विशिष्ट संरचनाओं कि श्रेणी के अंतर्गत माना जायेगा |`
                        : `If the last digit of your new holding number is 5/6/7/8, then it will be considered under the category of specific structures.`}
                    </li>
                  </ol>
                </div>

                {/* Footer */}
                <div className="mt-4 font-bold text-xs">
                  {isHindi
                    ? `नोट :- यह एक कंप्यूटर जनित रसीद है। इस रसीद के लिए भौतिक हस्ताक्षर की आवश्यकता नहीं है।`
                    : `NOTE: This is a computer-generated receipt. This receipt does not require physical signature.`}
                </div>
              </div>
            </div>
          </div>
          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default SAMModal;
