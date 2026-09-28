import React, { useEffect, useState } from "react";
import { formatLocalDate, hostInfo } from "../../../utils/common";
import axios from "axios";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import { propDueApi, UlbApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { useTranslation } from "react-i18next";
import "../../../i18n";

function DemandPrintModalDtl({ data = null, id, setIsFrozen = () => {} }) {
  const token = getToken();
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
      const response = await axios.post(
        propDueApi,
        { id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
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

  const NA = "NA";
  const val = (v) => (v === null || v === undefined || v === "" ? NA : v);
  const fmtAmt = (v) =>
    v === null || v === undefined || v === "" ? NA : Number(v).toFixed(2);

  const previousReceipt = receiptData?.previousDemandReceipt;
  const currentReceipt = receiptData?.currentDemandReceipt;

  const periodLabel = (r) => {
    if (!r?.fromYear && !r?.uptoYear) return null;
    if (!r?.uptoYear || r.fromYear === r.uptoYear) return r.fromYear;
    return `${r.fromYear} to ${r.uptoYear}`;
  };
  const arrearPeriod = periodLabel(previousReceipt);
  const currentPeriod = periodLabel(currentReceipt);

  // Property Tax = holdingTax, Composite Tax = compositeTax, Education Cess = educationCessTax
  const taxRows = [
    {
      taxType: "Property Tax",
      arrearAmt: previousReceipt?.holdingTax,
      currentAmt: currentReceipt?.holdingTax,
    },
    {
      taxType: "Composite Tax",
      arrearAmt: previousReceipt?.compositeTax,
      currentAmt: currentReceipt?.compositeTax,
    },
    {
      taxType: "Education Cess",
      arrearAmt: previousReceipt?.educationCessTax,
      currentAmt: currentReceipt?.educationCessTax,
    },
  ];

  const floorRows =
    Array.isArray(receiptData?.floorDtl) && receiptData.floorDtl.length > 0
      ? receiptData.floorDtl
      : [{ floorName: null, builtupArea: null, usageType: null }];

  const ulbName =
    i18n.language === "hi"
      ? ulbDetails?.hindiUlbName || ulbDetails?.ulbName
      : ulbDetails?.ulbName;

  return (
    <div className="print-container relative bg-white p-4 print:p-6 border-2 border-black border-dotted font-sans text-xs print:text-[11px] overflow-hidden">
      {receiptData?.watermark && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 print:flex">
          <img
            src={receiptData.watermark}
            alt="Watermark"
            className="w-[440px] opacity-[0.55] select-none"
          />
        </div>
      )}
      <div className="relative z-10">
        {/* ===================== HEADER ===================== */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
          <div></div>
          <div className="flex justify-center items-center gap-3">
            {ulbDetails?.logoImg && (
              <img
                src={ulbDetails.logoImg}
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            )}
            <h1 className="font-bold text-xl tracking-tight whitespace-nowrap">
              {val(ulbName)}
            </h1>
            {receiptData?.ulbDtl?.rightLogo && (
              <img
                src={receiptData.ulbDtl.rightLogo}
                alt="Right Logo"
                className="w-16 h-16 object-contain"
              />
            )}
          </div>
          <div className="justify-self-end text-center">
            {qurCode}
            <div className="mt-1 text-[10px]">{t("QR Code")}</div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 mt-2">
          <div></div>
          <span className="inline-block px-5 py-1.5 border-2 border-black font-bold text-sm text-center">
            {t(receiptData?.description)}
            <div className="font-semibold text-[10px]">
              ({t("THIS IS NOT PAYMENT RECEIPT")})
            </div>
          </span>
          <table className="justify-self-end border text-center border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-0.5 border text-[10px]">{t("Floor")}</th>
                <th className="px-2 py-0.5 border text-[10px]">{t("Buildup (Sqft)")}</th>
                <th className="px-2 py-0.5 border text-[10px]">{t("Usage")}</th>
              </tr>
            </thead>
            <tbody>
              {floorRows.map((f, i) => (
                <tr key={i}>
                  <td className="px-2 py-0.5 border">{val(f?.floorName)}</td>
                  <td className="px-2 py-0.5 border">{val(f?.builtupArea)}</td>
                  <td className="px-2 py-0.5 border">{val(f?.usageType)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <table className="mt-4 mb-2 w-full leading-relaxed [&_td]:py-0.5 [&_td:nth-child(odd)]:align-top [&_td:nth-child(odd)]:whitespace-nowrap [&_td:nth-child(odd)]:pr-2">
          <tbody>
            <tr>
              <td>{t("Department/Section")}</td>
              <td className="font-bold">: {t(receiptData?.department)}</td>
              <td>{t("Print Date")}</td>
              <td className="font-bold">: {formatLocalDate(receiptData?.printingDate, "-")}</td>
            </tr>
            <tr>
              <td>{t("Account Description")}</td>
              <td className="font-bold">: {t(receiptData?.accountDescription)}</td>
              <td>{t("Ward No")}</td>
              <td className="font-bold">: {val(receiptData?.wardNo)}</td>
            </tr>
            <tr>
              <td>{t("Area (sq.ft.)")}</td>
              <td className="font-bold">: {val(receiptData?.propertyDtl?.areaOfPlot)}</td>
              <td>{t("Property No.")}</td>
              <td className="font-bold">
                : {val(receiptData?.holdingNo || receiptData?.newHoldingNo)}
              </td>
            </tr>
            <tr>
              <td>{t("Application No.")}</td>
              <td className="font-bold">: {val(receiptData?.safNo)}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div className="pt-2 border-t leading-relaxed">
          <p>
            {t("Received From Shri / Smt.")} :{" "}
            <strong>
              {val(receiptData?.ownerName)}{" "}
              {t(receiptData?.relationType || "S/O")} {val(receiptData?.guardianName)}
            </strong>
          </p>
          <p>
            <span className="inline-block w-24">{t("Address")}</span> :{" "}
            <strong>{val(receiptData?.address || receiptData?.propertyDtl?.propAddress)}</strong>
          </p>
          <p>
            <span className="inline-block w-24">{t("MOB")}</span> :{" "}
            <strong>{val(receiptData?.mobileNo)}</strong>
          </p>
        </div>

        <table className="mt-3 mb-2 print:break-inside-avoid border w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 border font-bold">{t("Sl. No.")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Tax Type")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Arrear Period")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Arrear Dues")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Current Period")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Current Dues")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Total Dues")}</th>
            </tr>
          </thead>
          <tbody>
            {taxRows.map((row, i) => (
              <tr key={i}>
                <td className="px-2 py-1 border text-center">{i + 1}</td>
                <td className="px-2 py-1 border font-semibold">{t(row.taxType)}</td>
                <td className="px-2 py-1 border text-center">{val(arrearPeriod)}</td>
                <td className="px-2 py-1 border text-right">{fmtAmt(row?.arrearAmt)}</td>
                <td className="px-2 py-1 border text-center">{val(currentPeriod)}</td>
                <td className="px-2 py-1 border text-right">{fmtAmt(row?.currentAmt)}</td>
                <td className="px-2 py-1 border text-right">
                  {row?.arrearAmt == null && row?.currentAmt == null
                    ? NA
                    : (Number(row?.arrearAmt || 0) + Number(row?.currentAmt || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mb-2 print:break-inside-avoid border w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 border font-bold">{t("Holding Related User Charges")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Arrear Dues")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Current Dues")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Total")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Advance")}</th>
              <th className="px-2 py-1.5 border font-bold">{t("Total Dues")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 border font-semibold text-center">
                {t("Solid Waste User Charge")}
              </td>
              <td className="px-2 py-1 border text-right">
                {receiptData?.swmTranReceipt?.arrearFromDate ? (
                  <>
                    <div className="text-[10px]">
                      ({formatLocalDate(receiptData.swmTranReceipt.arrearFromDate, "-")})
                    </div>
                    {fmtAmt(receiptData?.swmTranReceipt?.arrearAmount)}
                  </>
                ) : (
                  NA
                )}
              </td>
              <td className="px-2 py-1 border text-right">
                {receiptData?.swmTranReceipt?.currentFromDate ? (
                  <>
                    <div className="text-[10px]">
                      ({formatLocalDate(receiptData.swmTranReceipt.currentFromDate, "-")})
                    </div>
                    {fmtAmt(receiptData?.swmTranReceipt?.currentAmount)}
                  </>
                ) : (
                  NA
                )}
              </td>
              <td className="px-2 py-1 border text-right">
                {fmtAmt(receiptData?.swmTranReceipt?.totalAmount)}
              </td>
              <td className="px-2 py-1 border text-right">
                {fmtAmt(receiptData?.swmTranReceipt?.advanceAmount)}
              </td>
              <td className="px-2 py-1 border text-right">
                {fmtAmt(receiptData?.swmTranReceipt?.totalDues)}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mb-2 w-full border-collapse text-[12px]">
          <tbody>
            <tr>
              <td className="px-2 py-1 border text-right" colSpan={5}>
                {t("Form Fee")}
              </td>
              <td className="px-2 py-1 border text-right w-32">{fmtAmt(receiptData?.formFee)}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 border text-right" colSpan={5}>
                {t("Demand")}
              </td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.grossDemand)}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 border text-right" colSpan={5}>
                {t("Discount")}
              </td>
              <td className="px-2 py-1 border text-right">{fmtAmt(receiptData?.totalDiscount)}</td>
            </tr>
            <tr className="font-bold">
              <td className="px-2 py-1 border text-right" colSpan={5}>
                {t("Total Demand")}
              </td>
              <td className="px-2 py-1 border text-right">
                {fmtAmt(receiptData?.totalPayableAmount)}
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 border font-semibold" colSpan={2}>
                {t("Total Demand (In Words)")}
              </td>
              <td className="px-2 py-1 border" colSpan={4}>
                : <strong>{val(receiptData?.totalPayableAmountInWord)}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="border w-full">
          <div className="grid grid-cols-[1fr_auto]">
            <div className="p-2">
              <p className="font-bold">{t("Note")}</p>
              <ul className="list-disc list-inside leading-relaxed">
                <li>
                  {t(
                    "This is a Computer genrated Receipt.This receipt does not require physical signature.",
                  )}
                </li>
                <li>{t("This is only demand and not payment Receipt.")}</li>
                <li>
                  {t(
                    "Rs. 1000 will be appreciable if citizen not fill the SAF Form (Penal Charge - 1000).",
                  )}
                </li>
                <li>
                  {t(
                    "Demand will be revised at the time of Payment(based on applicable discount & penalty).",
                  )}
                </li>
                <li>
                  {t(
                    "You will receive SMS on your registered mobile number. For the amount paid.If SMS is not received then call to verify your payment amount",
                  )}{" "}
                  : <strong>{val(ulbDetails?.tollFreeNo)}</strong>{" "}
                  {t("Or go")} : <strong>{ulbDetails?.ulbUrl || hostInfo()}</strong>
                </li>
              </ul>
            </div>
            <div className="p-2 border-l w-52 text-sm text-center">
              <p>
                {t("In collaboration with")}
                <br />
                {val(ulbDetails?.collaboration)}
                <br />
                <strong>{val(ulbName)}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemandPrintModalDtl;
