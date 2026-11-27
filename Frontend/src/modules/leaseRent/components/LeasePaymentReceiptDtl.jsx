import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { leaseRentPaymentReceiptApi } from "../leaseEndpoints";
import { getToken } from "../../../utils/auth";
import "../../../i18n";

const NA = "NA";
const val = (v) => (v === null || v === undefined || v === "" ? NA : String(v));

const fmtAmt = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (value) => {
  if (!value) return NA;
  const [year, month, day] = String(value).split(" ")[0].split("-");
  return `${day}-${month}-${year}`;
};

const fmtPrintDate = (value) => {
  if (!value) return NA;
  const [date, time = ""] = String(value).split(" ");
  return `${fmtDate(date)} ${time.slice(0, 5)}`.trim();
};

const fmtMonth = (dateStr) => {
  if (!dateStr) return NA;
  const [year, month] = String(dateStr).split("-");
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  return `${name}-${year}`;
};

function LeasePaymentReceiptDtl({ id, setIsFrozen = () => {} }) {
  const token = getToken();
  const { t, i18n } = useTranslation();
  const [receiptData, setReceiptData] = useState({});

  useEffect(() => {
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
        leaseRentPaymentReceiptApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setReceiptData(response.data.data || {});
      }
    } catch (error) {
      console.error("Error fetching lease payment receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const ulb = receiptData?.ulbDtl || {};
  const ulbName =
    i18n.language === "hi" ? ulb.hindiUlbName || ulb.ulbName : ulb.ulbName;

  const owner = [
    val(receiptData?.ownerName),
    t(receiptData?.relationType || "S/O"),
    val(receiptData?.guardianName),
    receiptData?.mobileNo ? `${receiptData.mobileNo},` : "",
  ].join(" ");

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
            {t(receiptData?.description || "LEASE RENT PAYMENT RECEIPT")}
          </span>
        </div>

        <table className="mt-4 mb-2 w-full leading-relaxed [&_td]:py-0.5 [&_td:nth-child(odd)]:align-top [&_td:nth-child(odd)]:whitespace-nowrap [&_td:nth-child(odd)]:pr-2">
          <tbody>
            <tr>
              <td>{t("Receipt No.")}</td>
              <td className="font-bold">: {val(receiptData?.tranNo)}</td>
              <td>{t("Date")}</td>
              <td className="font-bold">: {fmtDate(receiptData?.tranDate)}</td>
            </tr>
            <tr>
              <td>{t("Department / Section")}</td>
              <td className="font-bold">: {t(receiptData?.department || "Lease Rent")}</td>
              <td>{t("Ward No")}</td>
              <td className="font-bold">: {val(receiptData?.wardNo)}</td>
            </tr>
            <tr>
              <td>{t("Consumer No.")}</td>
              <td className="font-bold">: {val(receiptData?.consumerNo)}</td>
              <td>{t("Nigam Lease No.")}</td>
              <td className="font-bold">: {val(receiptData?.nigamLeaseNo)}</td>
            </tr>
            <tr>
              <td>{t("Lease Area")}</td>
              <td className="font-bold">: {val(receiptData?.leaseArea || receiptData?.areaName)}</td>
              <td>{t("Payment Mode")}</td>
              <td className="font-bold">: {val(receiptData?.paymentMode)}</td>
            </tr>
          </tbody>
        </table>

        <div className="pt-2 border-t leading-relaxed">
          <p>
            {t("Received From")} : <strong>{owner}</strong>
          </p>
          <p>
            <span className="inline-block w-24">{t("Plot Address")}</span> :{" "}
            <strong>{val(receiptData?.plotAddress || receiptData?.address)}</strong>
          </p>
        </div>

        <table className="mt-3 mb-2 print:break-inside-avoid border w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 border font-bold">{t("Tax Type")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("From Month")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Upto Month")}</th>
              <th className="px-2 py-1.5 border font-bold text-right">{t("Amount")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 border text-center">{t("Lease Rent Charge")}</td>
              <td className="px-2 py-1 border text-center">{fmtMonth(receiptData?.fromDate)}</td>
              <td className="px-2 py-1 border text-center">{fmtMonth(receiptData?.uptoDate)}</td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.demandAmt)}</td>
            </tr>
            {Number(receiptData?.penaltyAmt) > 0 && (
              <tr>
                <td className="px-2 py-1 border text-right font-semibold" colSpan={3}>
                  {t("Penalty")}
                </td>
                <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.penaltyAmt)}</td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="px-2 py-1 border text-right" colSpan={3}>
                {t("Total Paid Amount")}
              </td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.payableAmt)}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 border" colSpan={4}>
                <span className="font-semibold">{t("Amount (In Words)")}</span> :{" "}
                <strong>{val(receiptData?.amountInWords)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

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

export default LeasePaymentReceiptDtl;
