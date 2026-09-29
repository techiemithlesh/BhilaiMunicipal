import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { waterAppPaymentReceiptApi } from "../../../api/endpoints";
import { formatLocalDate, hostInfo } from "../../../utils/common";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import "../../../i18n";

function PaymentReceiptDtl({ data = null, id, setIsFrozen = () => {} }) {
  const isTest = JSON.parse(import.meta.env.VITE_REACT_APP_TEST || "false");
  const { t, i18n } = useTranslation();
  const [receiptData, setReceiptData] = useState({});
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    i18n.changeLanguage("hi");
  }, []);

  useEffect(() => {
    if (id) fetchData();
    return () => {
      setIsFrozen(false);
      setReceiptData({});
    };
  }, [id]);

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
      setQrCode(
        <QRCodeComponent
          value={`${host}/water-consumer/payment-receipt/${id ?? data?.tranDtl?.id}`}
          size={80}
        />
      );
    } catch (error) {
      console.error("Error fetching receipt:", error);
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

  // Shared cell styles matching DemandPrintModalDtl
  const td = "border border-black px-2 py-[3px]";
  const th = "border border-black px-2 py-[4px] font-bold";

  return (
    <div className="print-container relative bg-white text-black font-[Arial,Helvetica,sans-serif] text-[13px] leading-snug border-2 border-dashed border-black px-5 pt-3 pb-8 overflow-hidden">
      {receiptData?.watermark && (
        <div className="z-0 absolute inset-0 flex justify-center items-center pointer-events-none">
          <img
            src={receiptData.watermark}
            alt=""
            className="w-[440px] opacity-[0.55] select-none"
          />
        </div>
      )}

      {isTest && (
        <div className="z-20 absolute inset-0 flex justify-center items-center overflow-hidden pointer-events-none">
          <div className="font-bold text-[10rem] text-red-800 uppercase whitespace-nowrap -rotate-[35deg] opacity-10 select-none">
            TEST TEST TEST TEST TEST
          </div>
        </div>
      )}

      <div className="z-10 relative p-2">
        {/* ===================== HEADER ===================== */}
        <div className="items-start gap-2 grid grid-cols-[110px_1fr_110px]">
          <div></div>
          <div className="min-w-0">
            <div className="flex justify-center items-center gap-3 pt-2">
              {ulbDtl?.logoImg && (
                <img
                  src={ulbDtl.logoImg}
                  alt="Logo"
                  className="w-[50px] h-[50px] object-contain shrink-0"
                />
              )}
              <h1 className="font-bold text-[16px] text-center uppercase whitespace-nowrap">
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
              <span className="inline-block border-2 border-black px-4 py-1 font-bold text-[13px] text-center uppercase">
                <div>{t("Water User")}</div>
                <div>{t("Charge Receipt")}</div>
              </span>
            </div>
          </div>
        </div>

        {/* ===================== RECEIPT & CONSUMER INFO ===================== */}
        <div className="gap-x-8 gap-y-1.5 grid grid-cols-2 mt-4 text-[12px] leading-normal">
          <div className="space-y-1">
            <p>
              {t("Receipt No.")} : <strong>{val(receiptData?.tranNo)}</strong>
            </p>
            <p>
              {t("Department / Section")} :{" "}
              <strong>{t(val(receiptData?.department))}</strong>
            </p>
            <p>
              {t("Account Description")} :{" "}
              <strong>{t(val(receiptData?.accountDescription))}</strong>
            </p>
          </div>
          <div className="space-y-1">
            <p>
              {t("Date")} :{" "}
              <strong>{formatLocalDate(receiptData?.tranDate, "-")}</strong>
            </p>
            <p>
              {t("Ward No")} : <strong>{val(receiptData?.wardNo)}</strong>
            </p>
            <p>
              {t("Property Id")} :{" "}
              <strong>{val(receiptData?.newHoldingNo)}</strong>
            </p>
            <p>
              {t("Consumer No")} :{" "}
              <strong>{val(receiptData?.consumerNo)}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-1 mt-3 text-[12px] leading-normal">
          <p>
            {t("Name")} : <strong>{val(receiptData?.ownerName)}</strong>
          </p>
          <p>
            C/O : <strong>{val(receiptData?.guardianName)}</strong>
          </p>
          <p>
            {t("Address")} : <strong>{val(receiptData?.address)}</strong>
          </p>
          <p>
            {t("Mobile No")} : <strong>{val(receiptData?.mobileNo)}</strong>
          </p>
        </div>

        <div className="flex items-baseline gap-2 mt-3 text-[12px] leading-normal">
          <span>
            {t("Total Rs.")} <strong>{money(receiptData?.amount)}</strong>
          </span>
          <span>({t("In words")})</span>
          <strong className="flex-1 border-black border-b border-dotted">
            {receiptData?.amountInWords}
          </strong>
        </div>

        <p className="mt-1 text-[12px] leading-normal">
          {i18n.language === "hi" ? (
            <>
              {t("Water User Charge & Others")} के मद मे{" "}
              <strong>{val(receiptData?.paymentMode)}</strong> प्राप्त किया गया
            </>
          ) : (
            <>
              Received <strong>{val(receiptData?.paymentMode)}</strong> towards{" "}
              {t(receiptData?.accountDescription)}
            </>
          )}
        </p>

        {/* ===================== CHARGE TABLE ===================== */}
        <p className="mt-4 font-bold text-[12px]">
          {t("Water Usage Charge Details")}
        </p>
        <table className="mt-1 w-full border-2 border-black border-collapse text-[12px]">
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
              (receiptData?.meterReading || []).map((range, index) => (
                <tr key={`reading_${index}`}>
                  <td className={td}>{t("Water Tax (User Charge)")}</td>
                  <td className={`${td} text-center`}>
                    {range?.fromReading} (Pre.) {t("To")} {range?.toReading} (Curr.)
                  </td>
                  <td className={`${td} text-center`}>{range?.units}</td>
                  <td className={`${td} text-right`}>{money(range?.amount)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={td}>{t("Water Tax (User Charge)")}</td>
                <td className={`${td} text-center`}>
                  {receiptData?.periodFrom} - {receiptData?.periodUpto}
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
                {t("Surcharge Amount")}
              </td>
              <td className={`${td} text-right`}>
                {money(receiptData?.penaltyAmt)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className={`${td} text-right`} colSpan={3}>
                {t("Total Billing Amount")}
              </td>
              <td className={`${td} text-right`}>
                {money(receiptData?.totalBillingAmount)}
              </td>
            </tr>
            <tr className="font-bold">
              <td className={`${td} text-right`} colSpan={3}>
                {t("Total Received Amount")}
              </td>
              <td className={`${td} text-right`}>
                {money(receiptData?.totalReceivedAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between items-end mt-6">
          <div>{qrCode}</div>
          <p className="font-semibold text-[12px]">
            {t("Tax Collector's Signature")}
          </p>
        </div>

        {/* ===================== NOTES & COLLABORATION FOOTER ===================== */}
        <div className="flex justify-between items-start gap-6 mt-3 border-2 border-black p-3 text-[12px] leading-snug">
          <div className="max-w-[65%] border-r-2 border-black">
            <p className="mb-1 font-bold">{t("Note")}:-</p>
            <ul className="pl-5 text-[11px] list-disc space-y-1">
              <li>
                {t("For details contact")} <strong>{val(ulbDtl?.tollFreeNo)}</strong>
              </li>
              <li>
                {t("Print Date")} : <strong>{receiptData?.printingDate}</strong>
              </li>
              <li>
                {t(
                  "This is a Computer genrated Receipt.This receipt does not require physical signature."
                )}
              </li>
            </ul>
          </div>
          <div className="text-center pt-2 pr-2 whitespace-nowrap min-w-[150px]">
            <p className="text-[11px]">{t("In Collaboration With")}</p>
            <p className="font-semibold text-[12px]">
              {val(ulbDtl?.collaboration)}
            </p>
            <p className="mt-2 font-bold text-[12px] uppercase">
              {val(ulbName)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentReceiptDtl;
