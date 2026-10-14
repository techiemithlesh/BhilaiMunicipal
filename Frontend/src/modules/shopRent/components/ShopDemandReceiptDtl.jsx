import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { shopRentDueApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import "../../../i18n";

const NA = "NA";
const val = (v) => (v === null || v === undefined || v === "" ? NA : v);

const fmtAmt = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// "2024-05-01" -> "May-2024"
const fmtMonth = (dateStr) => {
  if (!dateStr) return NA;
  const [year, month] = String(dateStr).split("-");
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
  return `${name}-${year}`;
};

// "2026-10-14 16:21:04" -> "14-10-2026 16:21"
const fmtPrintDate = (value) => {
  if (!value) return NA;
  const [date, time = ""] = String(value).split(" ");
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year} ${time.slice(0, 5)}`.trim();
};

function ShopDemandReceiptDtl({ id, setIsFrozen = () => {} }) {
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
    try {
      const response = await axios.post(
        shopRentDueApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setReceiptData(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching shop demand receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const ulb = receiptData?.ulbDtl || {};
  const ulbName =
    i18n.language === "hi" ? ulb.hindiUlbName || ulb.ulbName : ulb.ulbName;
  const shop = receiptData?.shopDtl || {};

  const owner = [
    val(receiptData?.ownerName),
    t(receiptData?.relationType || "S/O"),
    val(receiptData?.guardianName),
    receiptData?.mobileNo ? `${receiptData.mobileNo},` : "",
  ].join(" ");

  const extraRows = [
    { label: "Penalty Charge", amount: receiptData?.latePenalty, always: true },
    { label: "Service Tax", amount: receiptData?.serviceTax, always: true },
    { label: "CGST", amount: receiptData?.cgst, always: true },
    { label: "SGST", amount: receiptData?.sgst, always: true },
    { label: "Additional Tax", amount: receiptData?.additionalTax },
    { label: "Advance", amount: receiptData?.advanceAmount, negative: true },
  ].filter((row) => row.always || Number(row.amount) > 0);

  return (
    <div className="print-container relative bg-white p-4 print:p-6 border-2 border-black border-dotted font-sans text-xs print:text-[11px] overflow-hidden">
      {ulb.waterMarkImg && (
        <div className="print:flex z-0 absolute inset-0 flex justify-center items-center pointer-events-none">
          <img
            src={ulb.waterMarkImg}
            alt="Watermark"
            className="opacity-[0.55] w-[440px] select-none"
          />
        </div>
      )}
      <div className="relative z-10">
        {/* ===================== HEADER ===================== */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="justify-self-end">
            {ulb.logoImg && (
              <img src={ulb.logoImg} alt="Logo" className="w-16 h-16 object-contain" />
            )}
          </div>
          <h1 className="font-bold text-xl tracking-tight text-center">{val(ulbName)}</h1>
          <div className="justify-self-start">
            {ulb.rightLogo && (
              <img src={ulb.rightLogo} alt="Right Logo" className="w-20 h-16 object-contain" />
            )}
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <span className="inline-block px-6 py-1.5 border-2 border-black font-bold text-sm text-center">
            {t(receiptData?.description)}
            <div className="font-semibold text-[10px]">({t("THIS IS NOT PAYMENT RECEIPT")})</div>
          </span>
        </div>

        {/* ===================== SHOP INFO ===================== */}
        <table className="mt-4 mb-2 w-full leading-relaxed [&_td]:py-0.5 [&_td:nth-child(odd)]:align-top [&_td:nth-child(odd)]:whitespace-nowrap [&_td:nth-child(odd)]:pr-2">
          <tbody>
            <tr>
              <td>{t("Department / Section")}</td>
              <td className="font-bold">: {t(receiptData?.department)}</td>
              <td>{t("Ward No")}</td>
              <td className="font-bold">: {val(receiptData?.wardNo)}</td>
            </tr>
            <tr>
              <td>{t("Account Description")}</td>
              <td className="font-bold">: {t(receiptData?.accountDescription)}</td>
              <td>{t("Consumer No.")}</td>
              <td className="font-bold">: {val(shop?.consumerNo)}</td>
            </tr>
            <tr>
              <td>{t("Area Name")}</td>
              <td className="font-bold">: {val(receiptData?.areaName)}</td>
              <td>{t("Shop No.")}</td>
              <td className="font-bold">: {val(receiptData?.shopNo)}</td>
            </tr>
          </tbody>
        </table>

        <div className="pt-2 border-t leading-relaxed">
          <p>
            {t("Shop Received From")} : <strong>{owner}</strong>
          </p>
          <p>
            <span className="inline-block w-24">{t("Address")}</span> :{" "}
            <strong>{val(receiptData?.address)}</strong>
          </p>
        </div>

        {/* ===================== DEMAND TABLE ===================== */}
        <table className="mt-3 mb-2 print:break-inside-avoid border w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 border font-bold">{t("Tax Type")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("From Month")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Upto Month")}</th>
              <th className="px-2 py-1.5 border font-bold text-right">{t("Shop Total Demand")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 border text-center">{t("Shop Rent Charge")}</td>
              <td className="px-2 py-1 border text-center">{fmtMonth(receiptData?.demandFrom)}</td>
              <td className="px-2 py-1 border text-center">{fmtMonth(receiptData?.demandUpto)}</td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.demandAmount)}</td>
            </tr>
            {extraRows.map((row) => (
              <tr key={row.label}>
                <td className="px-2 py-1 border text-right font-semibold" colSpan={3}>
                  {t(row.label)}
                </td>
                <td className="px-2 py-1 border text-right w-40">
                  {row.negative ? "- " : ""}
                  {fmtAmt(row.amount)}
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="px-2 py-1 border text-right" colSpan={3}>
                {t("Total Due")}
              </td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.payableAmount)}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 border" colSpan={4}>
                <span className="font-semibold">{t("Shop Total Demand (In Words)")}</span> :{" "}
                <strong>{val(receiptData?.payableAmountInWord)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ===================== NOTE ===================== */}
        <div className="border w-full">
          <div className="grid grid-cols-[1fr_auto]">
            <div className="p-2">
              <p className="font-bold">Note</p>
              <ul className="list-disc list-inside leading-relaxed">
                <li>
                  {t(
                    "This is a Computer genrated Receipt.This receipt does not require physical signature."
                  )}
                </li>
                <li>
                  {t("This is only demand and not payment Receipt.")}
                  {i18n.language !== "hi" && " (यह भुगतान नहीं, मांग रसीद है)"}
                </li>
                <li>
                  {t(
                    "Demand will be revised at the time of Payment(based on applicable discount/penalty/GST)."
                  )}
                </li>
                <li>
                  {t(
                    "You will receive SMS in your registered mobile. If SMS is not received verify your paid amount by calling Toll Free no."
                  )}{" "}
                  <strong>{val(ulb.tollFreeNo)}</strong> {t("or visit")}{" "}
                  <strong>{ulb.ulbUrl || "www.chhattishgarhmunicipal.com"}</strong>{" "}
                  {t("can also verify at")}
                </li>
                <li>
                  {t("Print Date")} : {fmtPrintDate(receiptData?.printingDate)}
                </li>
              </ul>
            </div>
            <div className="p-2 border-l w-56 text-sm text-center">
              <p>
                {t("In Collaboration With")}
                <br />
                {val(ulb.collaboration)}
                <br />
                {ulb.ulbName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopDemandReceiptDtl;
