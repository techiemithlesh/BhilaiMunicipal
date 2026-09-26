import React, { useEffect, useState } from "react";
import { safPaymentReceiptApi, UlbApi } from "../../../api/endpoints";
import axios from "axios";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import {
  formatLocalDate,
  formatReadableYearMonth,
  formatTimeAMPM,
  hostInfo,
} from "../../../utils/common";
import { useTranslation } from "react-i18next";
import "../../../i18n";

function PaymentReceiptDtl({ data = null, id, setIsFrozen = () => {} }) {
  const isTest = JSON.parse(import.meta.env.VITE_REACT_APP_TEST || "false");
  const { t, i18n } = useTranslation();
  const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;
  const [receiptData, setReceiptData] = useState({});
  const [qurCode, setQurCode] = useState(null);
  const [ulbDetails, setUlbDetails] = useState(null);

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
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    const fetchUlbDtl = async () => {
      if (!ulbId) return;
      try {
        const res = await axios.post(UlbApi.replace("{id}", ulbId), {});
        if (res?.data?.data) setUlbDetails(res.data.data);
      } catch (err) {
        console.error("Error loading ULB details:", err);
      }
    };
    fetchUlbDtl();
  }, [ulbId]);

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
          size={100}
        />,
      );
    } catch (error) {
      console.error("Error fetching receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const NA = "NA";
  const val = (v) => (v === null || v === undefined || v === "" ? NA : v);

  // Indian-style amount: 11,328.00
  const money = (v) =>
    Number(v || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  // Blank cell (like the PDF) when there is nothing to show
  const hasAmt = (v) => v !== null && v !== undefined && v !== "" && Number(v) !== 0;

  const previousReceipt = receiptData?.previousPaymentReceipt;
  const currentReceipt = receiptData?.currentPaymentReceipt;

  const periodLabel = (r) => {
    if (!r?.fromYear && !r?.uptoYear) return "";
    if (!r?.uptoYear || r.fromYear === r.uptoYear) return r.fromYear;
    return `${r.fromYear} to ${r.uptoYear}`;
  };
  const arrearPeriod = periodLabel(previousReceipt);
  const currentPeriod = periodLabel(currentReceipt);

  const taxBreakupRows = [
    { taxType: "Property Tax", arrearAmt: previousReceipt?.holdingTax, currentAmt: currentReceipt?.holdingTax },
    { taxType: "Samekit Kar", arrearAmt: previousReceipt?.compositeTax, currentAmt: currentReceipt?.compositeTax },
    { taxType: "Education Cess", arrearAmt: previousReceipt?.educationCessTax, currentAmt: currentReceipt?.educationCessTax },
  ];

  const floorRows =
    Array.isArray(receiptData?.floorDtl) && receiptData.floorDtl.length > 0
      ? receiptData.floorDtl
      : [{ floorName: null, builtupArea: null, usageType: null }];

  const grandTotalNum =
    Number(receiptData?.amount || 0) +
    Number(receiptData?.swmTranReceipt?.totalAmount || 0);

  const ulbName =
    i18n.language === "hi"
      ? ulbDetails?.hindiUlbName || ulbDetails?.ulbName
      : ulbDetails?.ulbName;

  const swm = receiptData?.swmTranReceipt;
  const swmPeriod = swm?.fromDate
    ? `${formatReadableYearMonth(swm.fromDate)}${
        swm?.uptoDate ? ` To ${formatReadableYearMonth(swm.uptoDate)}` : ""
      }`
    : "";

  // shared cell styles
  const td = "border border-black px-1 py-[2px]";
  const th = "border border-black px-1 py-[3px] font-bold";
  const dotted = "border-b border-dotted border-black";

  return (
    <div className="print-container relative bg-white text-black font-[Arial,Helvetica,sans-serif] text-[13px] leading-snug border-2 border-dashed border-black px-5 pt-3 pb-10 overflow-hidden">
      {/* Watermark */}
      {receiptData?.watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <img
            src={receiptData.watermark}
            alt=""
            className="w-[440px] opacity-[0.55] select-none"
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

      <div className="relative z-10 p-4">
        {/* ===================== HEADER ===================== */}
        {/* Left spacer = QR column width, so the heading is centred on the full receipt */}
        <div className="grid grid-cols-[110px_1fr_110px] items-start gap-2">
          <div></div>

          <div className="min-w-0">
            <div className="flex items-center justify-center gap-3 pt-3">
              {ulbDetails?.logoImg && (
                <img src={ulbDetails.logoImg} alt="Logo" className="w-[50px] h-[50px] object-contain shrink-0" />
              )}
              <h1 className="font-bold text-[16px] uppercase whitespace-nowrap text-center">{val(ulbName)}</h1>
              {receiptData?.ulbDtl?.rightLogo && (
                <img src={receiptData.ulbDtl.rightLogo} alt="" className="w-[90px] h-[35px] object-contain shrink-0" />
              )}
            </div>
            <div className="flex justify-center mt-3">
              <span className="inline-block px-3 py-1 border-2 border-black font-bold text-[14px] uppercase">
                {t(receiptData?.description)}
              </span>
            </div>
          </div>

          <div className="justify-self-end" style={{ padding: '0' }}>
            {qurCode}
            <div className="mt-1 text-[11px]">{t("QR Code")}</div>
          </div>
        </div>

        {/* ===================== INFO + FLOOR TABLE ===================== */}
        <div className="grid grid-cols-[41%_1fr_auto] gap-3 mt-3">
          {/* Left column */}
          <div className="space-y-5 pt-1">
            <p>
              {t("Receipt No.")}{" "}
              <strong className="text-[15px]">{val(receiptData?.tranNo)}</strong>
            </p>
            <p>
              {t("Department/Section")} : {t(receiptData?.department)}
            </p>
            <p>
              {t("Account Description")} : {t(receiptData?.accountDescription)}
            </p>
          </div>

          {/* Middle column */}
          <div className="space-y-3 text-[12px]">
            <p>
              {t("Date")} : <strong>{formatLocalDate(receiptData?.tranDate, "-")}</strong>
            </p>
            <p>
              {t("Ward No")} : <strong>{val(receiptData?.wardNo)}</strong>
              <span className="ml-4">
                {t("Plot Area")} : <strong>{val(receiptData?.propertyDtl?.areaOfPlot)}</strong>
              </span>
            </p>
            <p>
              {t("Property No.")} :{" "}
              <strong>{val(receiptData?.holdingNo || receiptData?.newHoldingNo)}</strong>
            </p>
            <p>
              {t("Usage Type")} :<strong>{val(receiptData?.usageType)}</strong>
            </p>
            <p>
              {t("Application No.")} :<strong>{val(receiptData?.safNo)}</strong>
            </p>
          </div>

          {/* Floor table */}
          <div>
            <table className="border-collapse text-center text-[9px]">
              <thead>
                <tr>
                  <th className="border border-black px-1 font-bold">{t("Floor")}</th>
                  <th className="border border-black px-1 font-bold">{t("Buildup (Sqft)")}</th>
                  <th className="border border-black px-1 font-bold">{t("Usage")}</th>
                </tr>
              </thead>
              <tbody>
                {floorRows.map((f, i) => (
                  <tr key={i}>
                    <td className="border border-black px-1">{val(f?.floorName)}</td>
                    <td className="border border-black px-1">{val(f?.builtupArea)}</td>
                    <td className="border border-black px-1 text-right">{val(f?.usageType)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== OWNER ===================== */}
        <div className="mt-3 ml-1 text-[12px] leading-tight">
          <p>
            {t("Owner Name")} :{" "}
            <strong className="ml-4">{val(receiptData?.ownerName)}</strong>
          </p>
          <p>
            {t(receiptData?.relationType || "S/O")}-{val(receiptData?.guardianName)}
          </p>
          <p>
            {t("Mobile No")} : <strong>{val(receiptData?.mobileNo)}</strong>
          </p>
          <p className="mt-2">
            {t("Address")} :{" "}
            <strong className="ml-2 text-[11px]">
              {val(receiptData?.address || receiptData?.propertyDtl?.propAddress)}
            </strong>
          </p>
        </div>

        {/* ===================== AMOUNT LINES ===================== */}
        <div className="mt-1 ml-1 text-[12px] space-y-2">
          <div className="flex items-end gap-2">
            <span className="whitespace-nowrap">
              {t("A Sum of Rs.")} <strong className="text-[11px]">{money(grandTotalNum)}</strong>
            </span>
            <span className="whitespace-nowrap ml-8">({t("In words")})</span>
            <strong className={`flex-1 ${dotted} text-[11px]`}>{val(receiptData?.amountInWords)}</strong>
          </div>
          <div className="flex items-end gap-1">
            <span className="whitespace-nowrap">
              {t("towards")} <strong>{t(receiptData?.accountDescription)}</strong> {t("vide")}{" "}
              <strong>{val(receiptData?.paymentMode)}</strong>
            </span>
            <span className={`w-[340px] ${dotted}`}>&nbsp;</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="whitespace-nowrap">{t("Drawn on")}</span>
            <span className={`flex-1 ml-8 ${dotted}`}>
              {receiptData?.chequeDtl ? `${val(receiptData?.bankName)} / ${val(receiptData?.branchName)}` : "\u00a0"}
            </span>
          </div>
          <div className="flex items-end">
            <span className={`min-w-[110px] ${dotted}`}>
              {receiptData?.chequeDtl ? `${val(receiptData?.chequeNo)} - ${val(receiptData?.chequeDate)}` : "\u00a0"}
            </span>
            <span>{t("Place Of The Bank.")}</span>
          </div>
        </div>

        <p className="mt-2 font-bold">
          {t("N.B.")} {t("Cheque / Draft / Banker Cheque / Online payment are subject to realization")}
        </p>

        {/* ===================== TAX TABLE ===================== */}
        <table className="mt-2 w-full border-collapse border-2 border-black print:break-inside-avoid">
          <thead>
            <tr>
              <th className={`${th} text-left w-[35%]`}>{t("Account Description")}</th>
              <th className={`${th} text-center`}>{t("Period")}</th>
              <th className={`${th} text-center w-[17%]`}>
                {t("Amount")} ({t("in Rs")})
              </th>
            </tr>
          </thead>
          <tbody>
            {taxBreakupRows.map((row, i) => (
              <React.Fragment key={i}>
                <tr>
                  <td className={td}>{t(`${row.taxType} Arrear`)}</td>
                  <td className={`${td} text-center`}>{hasAmt(row.arrearAmt) ? arrearPeriod : ""}</td>
                  <td className={`${td} text-right`}>{hasAmt(row.arrearAmt) ? money(row.arrearAmt) : ""}</td>
                </tr>
                <tr>
                  <td className={td}>{t(`${row.taxType} Current`)}</td>
                  <td className={`${td} text-center`}>{hasAmt(row.currentAmt) ? currentPeriod : ""}</td>
                  <td className={`${td} text-right`}>{hasAmt(row.currentAmt) ? money(row.currentAmt) : ""}</td>
                </tr>
              </React.Fragment>
            ))}
            <tr>
              <td className={td}>{t("Solid Waste User Charge")}</td>
              <td className={`${td} text-center`}>{swmPeriod}</td>
              <td className={`${td} text-right`}>{hasAmt(swm?.totalAmount) ? money(swm.totalAmount) : ""}</td>
            </tr>
            {Array.isArray(receiptData?.additionalTax) &&
              receiptData.additionalTax.map((item, index) => (
                <tr key={`add-${index}`}>
                  <td className={td}>{t(item?.taxType)}</td>
                  <td className={td}></td>
                  <td className={`${td} text-right`}>{hasAmt(item?.amount) ? money(item.amount) : ""}</td>
                </tr>
              ))}
            <tr>
              <td className={`${td} text-right`} colSpan={2}>{t("Form Fee")}</td>
              <td className={`${td} text-right`}>{money(receiptData?.formFee)}</td>
            </tr>
            <tr>
              <td className={`${td} text-right`} colSpan={2}>
                {t("Total Penalty")}
              </td>
              <td className={`${td} text-right`} colSpan={2}>{receiptData?.tranDtl?.penaltyAmt}</td>
            </tr>
            <tr>
              <td className={`${td} text-right`} colSpan={2}>
                {t("Total Rebate")}
              </td>
              <td className={`${td} text-right`} colSpan={2}>
                {receiptData?.tranDtl?.discountAmt}
              </td>
            </tr>
            <tr className="font-bold">
              <td className={`${td} text-right`} colSpan={2}>{t("Total")}</td>
              <td className={`${td} text-right`}>{money(grandTotalNum)}</td>
            </tr>
            <tr className="font-bold">
              <td className={`${td} text-right`} colSpan={2}>{t("Amount Received")}</td>
              <td className={`${td} text-right`}>{money(grandTotalNum)}</td>
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
              <li>{t("This payment receipt does not serve as proof of ownership of the property.")}</li>
              <li>{t("Net Banking/Online Payment/Cheque/Draw/Banker's Check are subject to collection.")}</li>
              <li>
                {t(
                  "You will receive SMS on your registered mobile number. For the amount paid.If SMS is not received then call to verify your payment amount",
                )}{" "}
                <strong>{val(ulbDetails?.tollFreeNo)}</strong> {t("Or go")}{" "}
                <strong className="block">{ulbDetails?.ulbUrl || hostInfo()}</strong>
              </li>
              <li>
                {t("Print Date")} : {formatLocalDate(receiptData?.printingDate, "-")}{" "}
                {formatTimeAMPM(receiptData?.printingDate)}
              </li>
            </ul>
          </div>

          <div className="text-center pt-8 pr-2">
            <p className="font-bold uppercase">{val(ulbName)}</p>
            <p>{t("In collaboration with")}</p>
            <p>{val(ulbDetails?.collaboration)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentReceiptDtl;