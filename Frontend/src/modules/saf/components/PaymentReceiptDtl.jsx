import React, { useEffect, useState } from "react";
import { safPaymentReceiptApi } from "../../../api/endpoints";
import axios from "axios";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatReadableYearMonth,
  formatTimeAMPM,
  hostInfo,
  toDataURL,
  toTitleCase,
} from "../../../utils/common";
import { useTranslation } from "react-i18next";
import "../../../i18n";

function PaymentReceiptDtl({ data = null, id, setIsFrozen = () => {} }) {
  const isTest = JSON.parse(import.meta.env.VITE_REACT_APP_TEST || "false");
  const { t, i18n } = useTranslation();
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
        const [mainLogo] = await Promise.all([toDataURL(logoImg)]);

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
      const response = await axios.post(safPaymentReceiptApi, { id });
      if (response?.data?.status) {
        setReceiptData(response.data.data || {});
      }
      setQurCode(
        <QRCodeComponent
          value={`${host}/saf/payment-receipt/${id ?? data?.tranDtl?.id}`}
          size={90}
        />,
      );
    } catch (error) {
      console.error("Error fetching receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };


  // console.log("receiptData", receiptData);

  return (
    // <div className="bg-white p-6 print:p-2 border-2 border-red-500 border-dotted print:border-none font-sans text-xs">
    <div className="relative bg-white p-2 border-2 border-red-500 border-dotted font-sans text-xs overflow-hidden">
      {logoBase64 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 print:flex">
          <img
            src={logoBase64}
            alt="Watermark"
            className="w-[300px] opacity-[0.08] grayscale select-none"
          />
        </div>
      )}
      {isTest && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 overflow-hidden">
          <div className="whitespace-nowrap text-red-800 opacity-10 text-[10rem] font-bold -rotate-[35deg] uppercase select-none">
            TEST TEST TEST TEST TEST
          </div>
        </div>
      )}
      <div className="relative z-10">
        {/* ===================== HEADER ===================== */}
        <div className="mb-4 pb-4 border-b text-center">
          <div className="flex items-center justify-between gap-4">
            {logoBase64 && (
              <img
                src={logoBase64}
                alt="Logo"
                className="w-20 h-20 object-contain"
              />
            )}

            <div className="flex-1">
              <h1 className="font-bold text-xl">
                {receiptData?.ulbDtl?.ulbName}
              </h1>
              <span className="inline-block mt-2 px-6 py-1 border-2 border-black font-semibold">
                {t(receiptData?.description)}
              </span>
            </div>
            {qurCode}
          </div>
        </div>
        <table className="mb-4 w-full [&_td:nth-child(even)]:font-bold">
          <tbody>
            <tr>
              <td>{t("Department/Section")}</td>
              <td>: {t(receiptData?.department)}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{t("Account")}</td>
              <td>: {t(receiptData?.accountDescription)}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{t("Receipt No.")}</td>
              <td>: {receiptData?.tranNo}</td>
              <td>{t("Date")}</td>
              <td>: {formatLocalDateTime(receiptData?.tranDtl?.createdAt)}</td>
            </tr>
            <tr>
              <td>{t("Plot Area")}</td>
              <td>: {receiptData?.propertyDtl?.areaOfPlot}</td>
              <td>{t("Ward No")}</td>
              <td>: {receiptData?.propertyDtl?.wardNo}</td>
            </tr>
            <tr>
              <td>{t("Property Type")}</td>
              <td>: {receiptData?.propertyDtl?.propertyType}</td>
              <td></td>
              <td></td>
            </tr>
            <tr></tr>
            {receiptData?.safNo ? (
              <>
                <td>{t("Holding No")}</td>
                <td>: {receiptData?.holdingNo}</td>
                <td></td>
                <td></td>
              </>
            ) : (
              <>
                <td>{t("Holding No")}</td>
                <td>: {receiptData?.holdingNo}</td>
                <td>{t("New Holding No")}</td>
                <td>: {receiptData?.newHoldingNo}</td>
              </>
            )}
            <tr>
              <td>{t("Plot No")}</td>
              <td>: {receiptData?.propertyDtl?.plotNo}</td>
              <td>{t("Khata No")}</td>
              <td>: {receiptData?.propertyDtl?.khataNo}</td>
            </tr>
            <tr>
              <td>{t("Usage Type")}</td>
              <td>: {receiptData?.usageType}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{t("Mr/Miss")}</td>
              <td>: {receiptData?.ownerName}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{t(receiptData?.relationType??"S/O")}</td>
              <td>: {receiptData?.guardianName}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{t("Mobile No")}</td>
              <td>: {receiptData?.mobileNo}</td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>{t("Address")}</td>
              <td>: {receiptData?.propertyDtl?.propAddress}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <table className="mb-4 border w-full text-center border-collapse">
          <tbody>
            <tr>
              <th className="p-1 border" rowSpan={2}>
                {t("Sl No")}
              </th>
              <th className="p-1 border" rowSpan={2}>
                {t("Tax Type")}
              </th>
              <th className="p-1 border" colSpan={2}>
                {t("Arrear Year")}
              </th>
              <th className="p-1 border" colSpan={2}>
                {t("Current Year")}
              </th>
              <th className="p-1 border" rowSpan={2}>
                {t("Total")}
              </th>
            </tr>
            <tr>
              <th>{t("Period")}</th>
              <th>{t("Demand Amount")}</th>
              <th>{t("Period")}</th>
              <th>{t("Demand Amount")}</th>
            </tr>
            <tr>
              <td className="p-1 border">1</td>
              <td className="p-1 border">{t("Holding Tax")}</td>
              <td className="p-1 border">
                {receiptData?.previousPaymentReceipt?.fromYear} to{" "}
                {receiptData?.previousPaymentReceipt?.uptoYear}
              </td>
              <td className="p-1 border">
                {receiptData?.previousPaymentReceipt?.totalDue}
              </td>
              <td className="p-1 border">
                {receiptData?.currentPaymentReceipt?.fromYear} to{" "}
                {receiptData?.currentPaymentReceipt?.uptoYear}
              </td>
              <td className="p-1 border">
                {receiptData?.currentPaymentReceipt?.totalDue}
              </td>
              <td className="p-1 border">
                {(
                  Number(receiptData?.previousPaymentReceipt?.totalDue) +
                  Number(receiptData?.currentPaymentReceipt?.totalDue)
                ).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="p-1 border text-right font-bold" colSpan={6}>
                {t("Demand")}
              </td>
              <td className="p-1 border">
                {(
                  Number(receiptData?.previousPaymentReceipt?.totalDue) +
                  Number(receiptData?.currentPaymentReceipt?.totalDue)
                ).toFixed(2)}
              </td>
            </tr>
            {receiptData?.additionalTax && receiptData?.additionalTax?.length > 0 && 
              receiptData?.additionalTax.map((item, index) => (
                <tr key={index}>
                  <td className="p-1 border text-right font-bold" colSpan={6}>
                    {t(item?.taxType)}
                  </td>
                  <td className="p-1 border">{item?.amount}</td>
                </tr>
              ))
            }
            <tr>
              <td className="p-1 border text-right font-bold" colSpan={6}>
                {t("Total Penalty")}
              </td>
              <td className="p-1 border">{receiptData?.tranDtl?.penaltyAmt}</td>
            </tr>
            <tr>
              <td className="p-1 border text-right font-bold" colSpan={6}>
                {t("Total Rebate")}
              </td>
              <td className="p-1 border">
                {receiptData?.tranDtl?.discountAmt}
              </td>
            </tr>
            <tr>
              <td className="p-1 border">2</td>
              <td className="p-1 border" colSpan={4}>
                {t("Solid Waste Charge")}
              </td>
              <td className="p-1 border">
                {formatReadableYearMonth(receiptData?.swmTranReceipt?.fromDate)}{" "}
                {receiptData?.swmTranReceipt?.uptoDate && <>To</>}{" "}
                {formatReadableYearMonth(
                  receiptData?.swmTranReceipt?.uptoDate,
                )}{" "}
              </td>
              <td className="p-1 border">
                {Number(receiptData?.swmTranReceipt?.totalAmount).toFixed(2)}
              </td>
            </tr>
            <tr className="font-bold">
              <td className="p-1 border text-right" colSpan={6}>
                {t("Total Demand")}
              </td>
              <td className="p-1 border">
                {Number(receiptData?.tranDtl?.payableAmt).toFixed(2)}
              </td>
            </tr>
            <tr className="font-bold">
              <td className="p-1 border text-right" colSpan={6}>
                {t("Total Received Amount")}
              </td>
              <td className="p-1 border">
                {Number(receiptData?.tranDtl?.payableAmt).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mb-4">
          <p>
            {t("Total Demand")}({t("In words")}):{" "}
            <strong className="inline-block border-b border-black border-dotted">
              {receiptData?.amountInWords} /-
            </strong>
          </p>
          <p>
            {t("Payment Mode")} : <strong>{receiptData?.paymentMode}</strong>
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

        <div className="mb-4">
          <p>
            {t(
              "Net Banking/Online Payment/Cheque/Draw/Banker's Check are subject to collection.",
            )}
          </p>
          <br />
          <p>
            <strong>{t("Note")} -:</strong>
            <ul className="list-disc list-inside">
              <li>
                {t(
                  "This is a computer-generated receipt and does not require signature.",
                )}
              </li>
              <li>
                {t(
                  "This payment receipt does not serve as proof of ownership of the property.",
                )}
              </li>
              <li>
                {t("For details please see")} : <strong>{hostInfo()}</strong>
              </li>
              <li>
                {t(
                  "You will receive SMS on your registered mobile number. For the amount paid.If SMS is not received then call to verify your payment amount",
                )}{" "}
                : <strong>{receiptData?.ulbDtl?.tollFreeNo}</strong>{" "}
                {t("Or go")} : <strong>{hostInfo()}</strong>
              </li>
              <li>
                {t("Payment by Cheque/DD")}{" "}
                <strong>
                  "{toTitleCase(receiptData?.ulbDtl?.ulbName || "")} TAX ESCROW
                  A/C"
                </strong>{" "}
                {t("favored Will go.")}
              </li>
              <li>
                {t(
                  "To make online transfer (RTGS/NEFT etc.) in following account details",
                )}{" "}
                :-
              </li>
              <li>
                Account Name : "
                <strong>
                  {toTitleCase(receiptData?.ulbDtl?.ulbName || "")} TAX ESCROW
                  A/C
                </strong>
                " . Account No.:{" "}
                <strong>{receiptData?.ulbDtl?.accountNo || "-----"}</strong> .
                IFC CODE.:{" "}
                <strong>{receiptData?.ulbDtl?.ifcCode || "----"}</strong>{" "}
              </li>
              <li>
                Printing Date :{" "}
                <strong>
                  {formatLocalDate(receiptData?.printingDate, "-")}{" "}
                  {formatTimeAMPM(receiptData?.printingDate)}
                </strong>
              </li>
            </ul>
          </p>
        </div>
        <div className="flex justify-between gap-6 mt-6">
          <div></div>
          <div className="text-gray-700 text-sm">
            <p>
              {t("Thank You")}: <br />
              <strong>{receiptData?.ulbDtl?.ulbName}</strong>
            </p>
            <p className="mt-2">
              {t("In collaboration with")} <br />
              {receiptData?.ulbDtl?.collaboration}
            </p>
            <p>
              {/* PAYMENT RECEIVE NAME */}
              {receiptData?.userDtl?.name != "" && (
                <tr>
                  <td>{t("Payment Collected By")}</td>
                  <td>: {receiptData?.userDtl?.name}</td>
                  <td></td>
                  <td></td>
                </tr>
              )}
            </p>
          </div>
        </div>

        <p className="mt-4 text-gray-500 text-xs text-center italic">
          ** This is a computer-generated receipt and does not require
          signature. **
        </p>
      </div>
    </div>
  );
}

export default PaymentReceiptDtl;
