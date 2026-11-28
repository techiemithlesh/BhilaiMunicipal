import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { getToken } from "../../../utils/auth";
import "../../../i18n";
import { leasePaymentReceiptApi } from "../../../api/endpoints";
import { toTitleCase } from "../../../utils/common";

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
        leasePaymentReceiptApi,
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
  const ulbName = i18n.language === "hi" ? ulb.hindiUlbName || ulb.ulbName : ulb.ulbName;

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
              <td>{t("Account Description")}</td>
              <td className="font-bold">: {val(receiptData?.accountDescription)}</td>
              <td>{t("Consumer No.")}</td>
              <td className="font-bold">: {val(receiptData?.consumerNo)}</td>
            </tr>
            <tr>
              <td></td>
              <td className="font-bold"></td>
              <td>{t("Lease No.")}</td>
              <td className="font-bold">: {val(receiptData?.leaseRegNo)}</td>
            </tr>
          </tbody>
        </table>

        <div className="pt-2 border-t leading-relaxed">
          <p>
            {t("Name")} : 
            <strong>
              {receiptData?.ownerName} 
              <br/>
              {receiptData?.relationType||"S/O"} {receiptData?.guardianName}
            </strong>
          </p>
          <p>
            <span className="inline-block">{t("Address")}</span> :{" "}
            <strong>{receiptData?.address}</strong>
          </p>
          <p>
            <span className="inline-block">{t("MOB")}</span> :{" "}
            <strong>{receiptData?.mobileNo}</strong>
          </p>
          <p>{t(`A Sum of Rs.`)} : 
            <strong>{receiptData?.amount}</strong>           
            &nbsp;&nbsp;&nbsp;({t(`In words`)}) : 
            <strong className="inline-block border-b border-black border-dotted">{receiptData?.amountInWords}</strong>
          </p>
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
        <p> 
          <strong>
            {t(`LEASE RENT CHARGE DETAILS`)}
          </strong> 
        </p>
        <table className="mt-3 mb-2 print:break-inside-avoid border w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 border font-bold">{t("Account Description")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Due Period")}</th>
              <th className="px-2 py-1.5 border font-bold text-right">{t("Amount")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 border text-center">{t("Lease Rent Charge")}</td>
              <td className="px-2 py-1 border text-center">{receiptData?.fromYear} {t(`To`)} {receiptData?.uptoYear}</td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.monthlyDemandAmount)}</td>
            </tr>
            {receiptData?.fineRebate?.map((item, index) => (
                <tr key={`tr_${index}`}>
                    <td className="p-1 border" colSpan={2}>{item?.headName}</td>
                    <td className="p-1 border">{item?.amount}</td>
                </tr>
            ))}
            <tr>
                <td className="p-1 border" colSpan={2}>{"Prev GST"}</td>
                <td className="p-1 border">{receiptData?.tranDtl?.prevGst}</td>
            </tr>
            <tr className="font-bold">
              <td className="px-2 py-1 border text-right" colSpan={2}>
                {t("Total Amount")}
              </td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end pr-[16%] mt-5 text-[12px]">
            {t("Signature of Tax Collector")}
        </div>

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
