import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { waterConsumerDemandReceiptApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { formatLocalDate, hostInfo } from "../../../utils/common";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import "../../../i18n";

function DemandPrintModalDtl({ data = null, id, setIsFrozen = () => {} }) {
  const isTest = JSON.parse(import.meta.env.VITE_REACT_APP_TEST || "false");
  const token = getToken();
  const { t, i18n } = useTranslation();
  const [receiptData, setReceiptData] = useState({});

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
    };
    // eslint-disable-next-line
  }, [id]);

  const fetchData = async () => {
    setIsFrozen(true);
    const host = hostInfo();
    try {
      if (data) {
        setReceiptData(data || {});
        
        return;
      }
      const response = await axios.post(
        waterConsumerDemandReceiptApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const fetched = response.data.data || {};
        setReceiptData(fetched);
        
      }
    } catch (error) {
      console.error("Error fetching demand receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const NA = "NA";
  const val = (v) => (v === null || v === undefined || v === "" ? NA : v);

  const money = (v) =>
    v === null || v === undefined || v === ""
      ? ""
      : `₹ ${Number(v).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const ulbDtl = receiptData?.ulbDtl;
  const ulbName =
    i18n.language === "hi"
      ? ulbDtl?.hindiUlbName || ulbDtl?.ulbName
      : ulbDtl?.ulbName;

  // Shared cell styles matching PaymentReceiptDtl
  const td = "border border-black px-2 py-[3px]";
  const th = "border border-black px-2 py-[4px] font-bold";

  return (
    <div className="print-container relative bg-white text-black font-[Arial,Helvetica,sans-serif] text-[13px] leading-snug border-2 border-dashed border-black px-5 pt-3 pb-8 overflow-hidden">
      {/* Watermark Support */}
      {receiptData?.watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <img
            src={receiptData.watermark}
            alt=""
            className="w-[440px] opacity-[0.55] select-none"
          />
        </div>
      )}

      {/* Test Environment Overlay */}
      {isTest && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 overflow-hidden">
          <div className="whitespace-nowrap text-red-800 opacity-10 text-[10rem] font-bold -rotate-[35deg] uppercase select-none">
            TEST TEST TEST TEST TEST
          </div>
        </div>
      )}

      <div className="relative z-10 p-2">
        {/* ===================== HEADER ===================== */}
        <div className="grid grid-cols-[110px_1fr_110px] items-start gap-2">
          <div></div>

          <div className="min-w-0">
            <div className="flex items-center justify-center gap-3 pt-2">
              {ulbDtl?.logoImg && (
                <img
                  src={ulbDtl.logoImg}
                  alt="Logo"
                  className="w-[50px] h-[50px] object-contain shrink-0"
                />
              )}
              <h1 className="font-bold text-[16px] uppercase whitespace-nowrap text-center">
                {val(ulbName)}
              </h1>
              {ulbDtl?.rightLogo && (
                <img
                  src={ulbDtl.rightLogo}
                  alt="Right Logo"
                  className="w-[90px] h-[35px] object-contain shrink-0"
                />
              )}
            </div>
            <div className="flex justify-center mt-3">
              <span className="inline-block px-4 py-1 border-2 border-black font-bold text-[13px] uppercase text-center">
                <div>{t("WATER USER CHARGE DEMAND")}</div>
                <div className="text-[10px] font-normal tracking-wide">
                  {t("(THIS IS NOT PAYMENT RECEIPT)")}
                </div>
              </span>
            </div>
          </div>
        </div>

        {/* ===================== CONSUMER & DEMAND INFO ===================== */}
        <div className="gap-x-8 gap-y-1.5 grid grid-cols-2 mt-4 text-[12px] leading-normal">
          <div className="space-y-1">
            <p>
              {t("Department / Section")} :{" "}
              <strong>{t(val(receiptData?.department))}</strong>
            </p>
            <p>
              {t("Account Description")} :{" "}
              <strong>{t(val(receiptData?.accountDescription))}</strong>
            </p>
            <p>
              {t("Connection Type")} :{" "}
              <strong>{val(receiptData?.connectionType)}</strong>
            </p>
            <p>
              {t("Property Type")} :{" "}
              <strong>{val(receiptData?.propertyType)}</strong>
            </p>
          </div>

          <div className="space-y-1">
            <p>
              {t("Print Date")} :{" "}
              <strong>{val(receiptData?.printDate)}</strong>
            </p>
            <p>
              {t("Ward No")} : <strong>{val(receiptData?.wardNo)}</strong>
            </p>
            <p>
              {t("Property Id")} :{" "}
              <strong>{val(receiptData?.propertyId)}</strong>
            </p>
            <p>
              {t("Holding No")} :{" "}
              <strong>{val(receiptData?.holdingNo)}</strong>
            </p>
            <p>
              {t("Consumer No")} :{" "}
              <strong>{val(receiptData?.consumerNo)}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-1 mt-3 text-[12px] leading-normal">
          <p>
            {t("Received By")} : <strong>{val(receiptData?.ownerName)}</strong>
          </p>
          <p>
            {t("Address")} : <strong>{val(receiptData?.address)}</strong>
          </p>
          <p>
            {t("Mobile No")} : <strong>{val(receiptData?.mobileNo)}</strong>
          </p>
        </div>

        {/* ===================== DEMAND TABLE ===================== */}
        <table className="mt-4 w-full border-collapse border-2 border-black print:break-inside-avoid text-[12px]">
          <thead>
            <tr>
              <th className={`${th} text-left`}>{t("Tax Description")}</th>
              {receiptData?.isMetered ? (
                <>
                  <th className={`${th} text-center`}>{t("Meter Reading")}</th>
                  <th className={`${th} text-center`}>{t("Units")}</th>
                </>
              ) : (
                <>
                  <th className={`${th} text-center`}>{t("Period")}</th>
                  <th className={`${th} text-center`}>{t("Payable Period")}</th>
                </>
              )}
              <th className={`${th} text-right w-[120px]`}>{t("Amount")}</th>
            </tr>
          </thead>
          <tbody>
            {receiptData?.isMetered ? (
              <tr>
                <td className={td}>{t("Water Tax (User Charge)")}</td>
                <td className={`${td} text-center`}>
                  {receiptData?.fromReading} (P) {t("To")} {receiptData?.currentReading} (C)
                </td>
                <td className={`${td} text-center`}>{receiptData?.units}</td>
                <td className={`${td} text-right`}>
                  {money(receiptData?.demandAmount)}
                </td>
              </tr>
            ) : (
              <tr>
                <td className={td}>{t("Water Tax (User Charge)")}</td>
                <td className={`${td} text-center`}>
                  {receiptData?.demandFrom} {t("To")} {receiptData?.demandUpto}
                </td>
                <td className={`${td} text-center`}>
                  {receiptData?.periodMonths} {t("Months")}
                </td>
                <td className={`${td} text-right`}>
                  {money(receiptData?.demandAmount)}
                </td>
              </tr>
            )}

            <tr>
              <td className={`${td} text-right`} colSpan={3}>
                {t("Penalty")}
              </td>
              <td className={`${td} text-right`}>
                {money(receiptData?.penalty)}
              </td>
            </tr>

            <tr className="font-bold">
              <td className={`${td} text-right`} colSpan={3}>
                {t("TOTAL PAYABLE")}
              </td>
              <td className={`${td} text-right`}>
                {money(receiptData?.payableAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-6 font-semibold text-[12px] text-right">
          {t("Authorised Signature")}
        </p>

        {/* ===================== NOTES & COLLABORATION FOOTER ===================== */}
        <div className="flex justify-between items-start gap-6 mt-3 border-2 border-black p-3 text-[12px] leading-snug">
          <div className="max-w-[65%] border-r-2 border-black">
            <p className="font-bold mb-1">{t("Note")}:-</p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              {receiptData?.isMetered && receiptData?.lastMeterReadingDate && (
                <li>
                  {t("Last Meter Reading Date")} :{" "}
                  <strong>
                    {formatLocalDate(receiptData?.lastMeterReadingDate, "-")}
                  </strong>
                </li>
              )}
              <li>
                {t(
                  "This is a Computer genrated Receipt.This receipt does not require physical signature."
                )}
              </li>
              <li>{t("This is only demand and not payment Receipt.")}</li>
              <li>
                {t(
                  "You will Receive SMS in your Registered Mobile no for amount paid. If SMS is not received verify your paid amount by calling Toll Free no."
                )}{" "}
                <strong>{val(ulbDtl?.tollFreeNo)}</strong>
              </li>
            </ul>
          </div>

          <div className="text-center pt-2 pr-2 whitespace-nowrap min-w-[150px]">
            <p className="text-[11px]">{t("In Collaboration With")}</p>
            <p className="font-semibold text-[12px]">{val(ulbDtl?.collaboration)}</p>
            <p className="mt-2 font-bold uppercase text-[12px]">
              {val(ulbName)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemandPrintModalDtl;