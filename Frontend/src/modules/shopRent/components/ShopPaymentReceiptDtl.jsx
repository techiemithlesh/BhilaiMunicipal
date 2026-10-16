import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { shopRentPaymentReceiptApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import "../../../i18n";

/*
 * Shop rent payment receipt.
 *
 * The receipt is drawn as one SVG on an A4-sized coordinate system (1 unit = 1 pt) so that every
 * line, box and text baseline sits exactly where it is in the printed reference PDFs. The numbers
 * in the two LAYOUT objects below were measured from those PDFs (English and Hindi).
 */

const FONT_A = 'Arial, "Liberation Sans", Helvetica, sans-serif';
const FONT_N = '"Nirmala UI", "Noto Sans Devanagari", Mangal, Arial, sans-serif';
const PAGE_WIDTH = 595;

// Registered GST number of the ULB, printed on every receipt. Used when the API sends none.
const ULB_GST_NO = "22AAALM0611M2ZE";

const NA = "NA";
const val = (v) => (v === null || v === undefined || v === "" ? NA : String(v));

const fmtAmt = (v) =>
  Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "2026-07-24" -> "24-07-2026"
const fmtDate = (value) => {
  if (!value) return NA;
  const [year, month, day] = String(value).split(" ")[0].split("-");
  return `${day}-${month}-${year}`;
};

// "2026-10-14 16:21:04" -> "14-10-2026 16:21"
const fmtPrintDate = (value) => {
  if (!value) return NA;
  const [date, time = ""] = String(value).split(" ");
  return `${fmtDate(date)} ${time.slice(0, 5)}`.trim();
};

// "2025-04-01" -> "April-2025"
const fmtMonth = (dateStr) => {
  if (!dateStr) return NA;
  const [year, month] = String(dateStr).split("-");
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  return `${name}-${year}`;
};

const PAYMENT_MODE_LABEL = { CASH: "Cash", CHEQUE: "Cheque", ONLINE: "Online" };
const hasHindi = (text) => /[ऀ-ॿ]/.test(text);

/* ------------------------------------------------------------------------------------------ */
/* Layout measured from the reference PDFs                                                    */
/* ------------------------------------------------------------------------------------------ */

const LAYOUT = {
  en: {
    frameBottom: 657.7, sideDotStart: 8.2,
    logo: { left: null, rightY: 11.2, nameBaseline: 30.7, nameSize: 17.2 },
    titleBox: { y: 51.7, h: 38.2, line1: 64.5, line2: 82.5, x1: 298.75, x2: 297.15 },
    // label / colon / value rows: x and baseline of each part
    rows: {
      receiptNo: { label: [15.3, 111.7, 11.2], value: [83.3, 111] },
      date: { label: [366.7, 111.7, 11.2], value: [398.3, 111.7] },
      dept: { label: [15.3, 129, 12], colon: [131.3, 129], value: [138.7, 129, 12, false] },
      ward: { label: [366.8, 132.7, 12], colon: [417, 132.7], value: [422.5, 133.5] },
      account: { label: [15.3, 142.5, 12], colon: [125.3, 142.5], value: [132.7, 142.5, 12, false] },
      consumer: { label: [366.8, 151.5, 12], colon: [447.5, 151.5], value: [453, 152.2] },
      area: { label: [15.3, 167.2, 12], colon: [82.6, 167.2], value: [88.1, 168] },
      shop: { label: [366.8, 168.7, 12], colon: [420.1, 168.7], value: [425.6, 169.5] },
      name: { label: [15.3, 187.5, 12], colon: [50.6, 187.5], value: [71.3, 187.5] },
      guardian: { label: [15.3, 208.5, 12], colon: [103.3, 208.5], value: [124, 208.5] },
      address: { label: [15.3, 229.5, 12], colon: [62.6, 229.5], value: [86, 229.5] },
      mob: { label: [15.3, 250.5, 9.7, true], colon: [40.7, 250.5, 9.7], value: [46.7, 250.5] },
    },
    sum: { y: 268.5, wordsDy: -0.8, amountX: 86.8, inWordsX: 161.8, wordsX: 221.4, rule: [216, 273.7] },
    towards: { y: 288, modeX: 182 },
    table: {
      titleY: 309.7, titleX: 21, thickLine: [21, 320.2, 555.7, 1.5],
      top: 323.2, cols: [24, 275.2, 397.5, 573], bottomExtra: 0.7, lineRight: 573.7, lineLeft: 24,
      rowHeight: () => 12, baselineFromBottom: 3, referenceBottom: 419.2, labelRight: 397.7, amountRight: 573,
      hdrCenters: [149.6, 336.9], hdrAmountRight: 572.9, row1LabelCenter: 149.8, row1PeriodCenter: 336.65,
      row1Size: 9.7,
    },
    signature: { x: 359, y: 465 },
    note: { title: [15.3, 492.7], bulletX: 36, textX: 45.3, size: 9, step: 10.5, first: 503.2 },
    collab: { cx: 464.95, y: 522.7, step: 10.5 },
  },
  hi: {
    frameBottom: 700.5, sideDotStart: 9,
    logo: { left: { y: 11.2, size: 52.5 }, rightY: 21, nameBaseline: 40.5, nameSize: 17.2 },
    titleBox: { y: 69.7, h: 40.5, line1: 84.7, line2: 102.7, x1: 298.75, x2: 297.2 },
    rows: {
      receiptNo: { label: [15.3, 132, 11.2], value: [83.3, 130.5] },
      date: { label: [366.7, 131.2, 11.2], colon: [399.3, 131.2, 11.2], value: [403.9, 131.2] },
      dept: { label: [15.3, 150.7, 12], colon: [94.3, 150.7], value: [101.7, 150.7, 12, false] },
      ward: { label: [366.8, 153, 12], colon: [399.5, 153], value: [405, 151.5] },
      account: { label: [15.3, 166.5, 12], colon: [91.4, 166.5], value: [98.7, 166.5, 12, false] },
      consumer: { label: [366.8, 172.5, 12], colon: [444.3, 172.5], value: [449.8, 171] },
      area: { label: [15.3, 207.7, 12], colon: [72.7, 207.7], value: [80.1, 207.7, 12, false] },
      shop: { label: [366.8, 189.7, 12], colon: [428.3, 189.7], value: [433.8, 188.2] },
      name: { label: [15.3, 225.7, 12], colon: [37.1, 225.7], value: [57.8, 225.7] },
      guardian: { label: [15.3, 246.7, 12], colon: [107.9, 246.7], value: [128.6, 246.7] },
      address: { label: [15.3, 267.7, 12], colon: [36.3, 267.7], value: [59.7, 267.7] },
      mob: { label: [15.3, 288.7, 9.7, true], colon: [48.1, 288.7, 9.7], value: [54.1, 288.7] },
    },
    sum: { y: 309, wordsDy: -3, amountX: 69.2, inWordsX: 144.2, wordsX: 195.2, colonX: 63.7, rule: [189.7, 312], amountDy: -2.3 },
    towards: { y: 326.2, modeX: 182.9 },
    table: {
      titleY: 348, titleX: 21, thickLine: [21, 358.5, 555.7, 1.5],
      top: 361.5, cols: [21, 274.5, 399, 576], bottomExtra: 0.8, lineRight: 576.7, lineLeft: 21,
      rowHeight: (hindi) => (hindi ? 13.5 : 12), baselineFromBottom: 3, referenceBottom: 465, labelRight: 398.7, amountRight: 575.8,
      hdrCenters: [147.75, 337], hdrAmountRight: 575.8, row1LabelX: 103.5, row1PeriodCenter: 337.05,
      row1Size: 9.7, latinRaise: 0.8,
    },
    signature: { x: 354.5, y: 512.2 },
    note: { title: [15.3, 538.5], bulletX: 36, textX: 45.3, size: 9.7, step: 12.75, first: 549.7 },
    collab: { cx: 481.45, y: 582, step: 10.5 },
  },
};

/* ------------------------------------------------------------------------------------------ */
/* Static text                                                                                */
/* ------------------------------------------------------------------------------------------ */

const TEXT = {
  en: {
    title1: "SHOP RENT",
    title2: "Payment Receipt",
    receiptNo: "Receipt No.",
    date: "Date :",
    dept: "Department / Section",
    deptValue: "Revenue Section",
    ward: "Ward No",
    account: "Account Description",
    accountValue: "Shop Rent Charge & Others",
    consumer: "Consumer No.",
    area: "Area Name.",
    shop: "Shop No.",
    name: "Name",
    guardian: "Guardian Name",
    address: "Address",
    mob: "MOB",
    sum: "A Sum of Rs.",
    inWords: "(in words)",
    towards: "towards",
    towardsValue: "Shop Rent & Others",
    vide: "vide",
    tableTitle: "SHOP RENT CHARGE DETAILS",
    hdr: ["Account Description", "Due Period", "Amount"],
    row1: "Shop Rent Charge",
    penalty: "Penalty",
    total: "Total Amount",
    received: "Amount Received",
    signature: "Signature of Tax Collector",
    note: "Note:-",
    printDate: "Print Date",
    collab: "In Collaboration WIth",
    heads: { CGST: "CGST", SGST: "SGST", "Service Tax": "Service Tax" },
  },
  hi: {
    title1: "दुकान का किराया",
    title2: "शुल्क रसीद",
    receiptNo: "रसीद संख्या",
    date: "दिनांक",
    dept: "विभाग / अनुभाग",
    deptValue: "राजस्व विभाग",
    ward: "वार्ड नं",
    account: "खाते का विवरण",
    accountValue: "दुकान किराए पर शुल्क एवं अन्य",
    consumer: "उपभोक्ता संख्या",
    area: "क्षेत्र का नाम",
    shop: "दुकान संख्या",
    name: "नाम",
    guardian: "अभिभावक का नाम",
    address: "पता",
    mob: "मोबाइल",
    sum: "कुल रुपये",
    inWords: "(शब्दों में)",
    towards: "दुकान किराए पर शुल्क एवं अन्य के मद मे",
    tableTitle: "दुकान किराया शुल्क का विवरण",
    hdr: ["खाते का विवरण", "देय अवधि", "रकम"],
    row1: "दुकान का किराया शुल्क",
    penalty: "अधिभार",
    total: "कुल रकम",
    received: "कुल प्राप्त राशि",
    signature: "टैक्स कलेक्टर का हस्ताक्षर",
    note: "Note :",
    printDate: "प्रिन्ट दिनांक",
    collab: "In Collaboration WIth",
    heads: { CGST: "CGST", SGST: "SGST", "Service Tax": "सेवा कर" },
    officePrefix: "कार्यालय",
  },
};

/* ------------------------------------------------------------------------------------------ */
/* Small SVG helpers                                                                          */
/* ------------------------------------------------------------------------------------------ */

function T({ x, y, size = 9.7, bold = false, anchor = "start", n = false, dy, children }) {
  return (
    <text
      x={x}
      y={y}
      dy={dy}
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      textAnchor={anchor}
      fontFamily={n ? FONT_N : FONT_A}
      style={{ whiteSpace: "pre" }}
    >
      {children}
    </text>
  );
}

// One piece of a text run: the gap before it, its own size, weight and font.
function S({ dx, dy, size = 9.7, bold = false, n = false, children }) {
  return (
    <tspan
      dx={dx}
      dy={dy}
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      fontFamily={n ? FONT_N : FONT_A}
    >
      {children}
    </tspan>
  );
}

// The frame is a ring of 1.5pt squares, 3pt apart, exactly as the reference prints it.
function frameDotsPath(bottom, sideStart) {
  const last = bottom - 1.5;
  const xs = [9.7];
  for (let x = 12; x <= 582; x += 3) xs.push(x);
  xs.push(584.2);
  const ys = [];
  for (let y = sideStart; y < last - 0.1; y += 3) ys.push(Math.round(y * 10) / 10);
  const sq = (x, y) => `M${x} ${y}h1.5v1.5h-1.5z`;
  return [
    ...xs.map((x) => sq(x, 6)),
    ...xs.map((x) => sq(x, last)),
    ...ys.map((y) => sq(9.7, y)),
    ...ys.map((y) => sq(584.2, y)),
  ].join("");
}

const Rect = ({ x, y, w, h }) => <rect x={x} y={y} width={w} height={h} fill="#000" />;

function ShopPaymentReceiptDtl({ id, data = null, setIsFrozen = () => {} }) {
  const token = getToken();
  const { i18n } = useTranslation();
  const lang = i18n.language === "hi" ? "hi" : "en";
  const isHi = lang === "hi";
  const L = LAYOUT[lang];
  const X = TEXT[lang];

  const [receiptData, setReceiptData] = useState(data || {});
  const nameRef = useRef(null);
  const [nameBox, setNameBox] = useState(null);

  useEffect(() => {
    // Receipts default to Hindi; the English/Hindi toggle can still switch it.
    if (!data) i18n.changeLanguage("hi");
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (data) {
      setReceiptData(data);
      return undefined;
    }
    if (id) fetchData();
    return () => {
      setIsFrozen(false);
      setReceiptData({});
    };
    // eslint-disable-next-line
  }, [id, data]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      // The receipt API is public, so the token is only sent when there is one.
      const response = await axios.post(
        shopRentPaymentReceiptApi,
        { id },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (response?.data?.status) setReceiptData(response.data.data || {});
    } catch (error) {
      console.error("Error fetching shop payment receipt:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  const ulb = receiptData?.ulbDtl || {};
  const tran = receiptData?.tranDtl || {};
  const user = receiptData?.userDtl || {};

  let ulbName = isHi ? ulb.hindiUlbName || ulb.ulbName : ulb.ulbName;
  if (isHi && ulbName && !ulbName.startsWith(X.officePrefix)) ulbName = `${X.officePrefix} ${ulbName}`;
  // The reference prints a space after the comma, whatever the stored name looks like.
  ulbName = val(ulbName).replace(/,\s*/g, ", ");

  // The logos hug the ULB name, so measure it once it is drawn.
  useLayoutEffect(() => {
    if (!nameRef.current) return;
    const box = nameRef.current.getBBox();
    setNameBox({ x: box.x, width: box.width });
  }, [ulbName, lang]);

  const mode = receiptData?.paymentMode;
  const modeLabel = PAYMENT_MODE_LABEL[mode] || mode;
  const referenceNo = mode && mode !== "CASH" ? receiptData?.chequeNo : "";

  /* ---- charge table rows (penalty and GST heads are dynamic) ---- */
  const labelOfHead = (name) => X.heads[name] || name;
  const chargeRows = [
    { label: X.penalty, amount: tran?.penaltyAmt },
    ...(receiptData?.fineRebate || []).map((row) => ({
      label: labelOfHead(row.headName),
      amount: row.amount,
      isRebate: row.isRebate,
    })),
  ];
  const tableRows = [
    { kind: "header", h: L.table.rowHeight(isHi) },
    { kind: "row1", h: L.table.rowHeight(isHi) },
    { kind: "blank", h: 12 },
    ...chargeRows.map((r) => ({ kind: "charge", ...r, h: L.table.rowHeight(isHi && hasHindi(r.label)) })),
    { kind: "total", h: L.table.rowHeight(isHi) },
    { kind: "received", h: L.table.rowHeight(isHi) },
  ];
  // The reference has three charge rows (penalty, CGST, SGST); more or fewer rows move everything below.
  let y = L.table.top;
  const positioned = tableRows.map((row) => {
    const top = y;
    y += row.h;
    return { ...row, top, bottom: y };
  });
  const tableBottom = y;
  const shift = tableBottom - L.table.referenceBottom;

  const t = L.table;
  const frameBottom = L.frameBottom + shift;
  const viewHeight = frameBottom + 6;

  const nB = isHi ? 0.8 : 0; // Latin text sits slightly higher on Hindi table rows
  const rowBaseline = (row, latin = false) =>
    row.bottom - t.baselineFromBottom - (isHi && latin && row.h > 12 ? nB : 0);

  const sumDy = L.sum.wordsDy;

  const notes = isHi
    ? [
        { bullet: true, parts: [<S key="a" size={9.7}>GST </S>, <S key="b" size={9.7} bold>-</S>, <S key="c" size={9.7}> {ulb.gstNo || ULB_GST_NO} , Consumer GST </S>, <S key="d" size={9.7} bold>-</S>, <S key="e" size={9.7}> {tran?.gstNo || "N/A"}</S>] },
        { bullet: true, parts: [<S key="a" n size={9.7}>यह कंप्यूटर जनित रसीद है इस रसीद मे हस्ताक्षर की आवश्यकता नहीं है </S>, <S key="b" size={9.7}>|</S>] },
        { bullet: true, parts: [<S key="a" n size={9.7}>ऑनलाइन पेमेंट / चेक / ड्राफ्ट / बैंकर चेक अदायगी के अधीन हैं</S>] },
        { bullet: true, parts: [<S key="a" n size={9.7}>भुगतान की गई राशि के लिए आपको अपने पंजीकृत मोबाइल नंबर में एसएमएस</S>] },
        { parts: [<S key="a" n size={9.7}>प्राप्त होगा। अगर एसएमएस प्राप्त नहीं हुआ है तो टोल फ्री नंबर </S>, <S key="b" size={9.7} bold>{val(ulb.tollFreeNo)}</S>, <S key="c" n size={9.7}> पर</S>] },
        { parts: [<S key="a" n size={9.7}>कॉल करके अपनी भुगतान की गई राशि को सत्यापित कर । या</S>] },
        { parts: [<S key="a" size={9.7} bold>{ulb.ulbUrl || "www.chhattishgarhmunicipal.com"}</S>, <S key="b" n size={9.7}> पर भी कर सकते है।</S>] },
        { bullet: true, parts: [<S key="a" n size={9.7}>प्रिन्ट दिनांक</S>, <S key="b" size={9.7}> : {fmtPrintDate(receiptData?.printingDate)}</S>] },
      ]
    : [
        { bullet: true, parts: [<S key="a" size={9}>ULB GST </S>, <S key="b" size={9} bold>-</S>, <S key="c" size={9}> {ulb.gstNo || ULB_GST_NO} , Consumer GST </S>, <S key="d" size={9} bold>-</S>, <S key="e" size={9}> {tran?.gstNo || "N/A"}</S>] },
        { bullet: true, parts: [<S key="a" size={9}>This is a Computer generated Receipt and does not require physical signature.</S>] },
        { bullet: true, parts: [<S key="a" size={9}>Cheque / Draft / Banker Cheque / Online payment are subject to realization</S>] },
        { bullet: true, parts: [<S key="a" size={9}>You will receive SMS in your registered mobile. If SMS is not received verify</S>] },
        { parts: [<S key="a" size={9}>your paid amount by calling Toll Free no. </S>, <S key="b" size={9} bold>{val(ulb.tollFreeNo)}</S>, <S key="c" size={9}> or visit</S>] },
        { parts: [<S key="a" size={9} bold>{ulb.ulbUrl || "www.chhattishgarhmunicipal.com"}</S>] },
        { bullet: true, parts: [<S key="a" size={9}>{X.printDate} : {fmtPrintDate(receiptData?.printingDate)}</S>] },
      ];

  const row = (key, label, value, opts = {}) => {
    const r = L.rows[key];
    const labelBold = r.label[3];
    return (
      <g key={key}>
        <T x={r.label[0]} y={r.label[1]} size={r.label[2]} bold={labelBold} n={isHi && hasHindi(label)}>
          {label}
        </T>
        {r.colon && (
          <T x={r.colon[0]} y={r.colon[1]} size={r.colon[2] || 12} bold={!(isHi && key === "date")}>
            :
          </T>
        )}
        <T
          x={r.value[0]}
          y={r.value[1]}
          size={r.value[2] || 9.7}
          bold={r.value[3] !== false}
          n={isHi && hasHindi(String(value))}
        >
          {value}
        </T>
      </g>
    );
  };

  const noteLine = (n) => L.note.first + n * L.note.step;
  const sigY = L.signature.y + shift;

  return (
    <svg
      className="print-container block w-full bg-white"
      viewBox={`0 0 ${PAGE_WIDTH} ${viewHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Shop rent payment receipt"
      style={{ aspectRatio: `${PAGE_WIDTH} / ${viewHeight}` }}
    >
      <rect x="0" y="0" width={PAGE_WIDTH} height={viewHeight} fill="#fff" />

      {/* dotted frame */}
      <path d={frameDotsPath(frameBottom, L.sideDotStart)} fill="#000" />

      {ulb.waterMarkImg && (
        <image href={ulb.waterMarkImg} x="127.5" y="153.7" width="321.7" height="316.5" opacity="1" />
      )}

      {/* header */}
      <T x={287.5} y={L.logo.nameBaseline} size={L.logo.nameSize} bold anchor="middle" n={isHi}>
        <tspan ref={nameRef}>
          {/* the reference sets the comma in Arial even in the Hindi name */}
          {ulbName.split(", ").map((part, i) => (
            <Fragment key={i}>
              {i > 0 && <tspan fontFamily={FONT_A}>, </tspan>}
              {part}
            </Fragment>
          ))}
        </tspan>
      </T>
      {nameBox && L.logo.left && (ulb.leftLogo || ulb.logoImg) && (
        <image
          href={ulb.leftLogo || ulb.logoImg}
          x={nameBox.x - 3.4 - L.logo.left.size}
          y={L.logo.left.y}
          width={L.logo.left.size}
          height={L.logo.left.size}
        />
      )}
      {nameBox && ulb.rightLogo && (
        <image href={ulb.rightLogo} x={nameBox.x + nameBox.width + 3} y={L.logo.rightY} width="75" height="33" />
      )}

      <rect x="186" y={L.titleBox.y} width="225" height={L.titleBox.h} fill="none" stroke="#000" strokeWidth="0.7" />
      <T x={L.titleBox.x1} y={L.titleBox.line1} size={13.5} bold anchor="middle" n={isHi}>{X.title1}</T>
      <T x={L.titleBox.x2} y={L.titleBox.line2} size={11.2} bold anchor="middle" n={isHi}>{X.title2}</T>

      {/* receipt and shop details */}
      {row("receiptNo", X.receiptNo, val(receiptData?.tranNo))}
      {row("date", X.date, fmtDate(receiptData?.tranDate))}
      {row("dept", X.dept, X.deptValue)}
      {row("ward", X.ward, val(receiptData?.wardNo))}
      {row("account", X.account, X.accountValue)}
      {row("consumer", X.consumer, val(receiptData?.consumerNo))}
      {row("area", X.area, val(receiptData?.areaName))}
      {row("shop", X.shop, val(receiptData?.shopNo))}
      {row("name", X.name, val(receiptData?.ownerName))}
      {row("guardian", X.guardian, val(receiptData?.guardianName))}
      {row("address", X.address, val(receiptData?.address))}
      {row("mob", X.mob, val(receiptData?.mobileNo))}

      {/* amount in words */}
      <T x={15.3} y={L.sum.y} size={12} n={isHi}>{X.sum}</T>
      {L.sum.colonX && <T x={L.sum.colonX} y={L.sum.y} size={12} bold>:</T>}
      <T x={L.sum.amountX} y={L.sum.y + (L.sum.amountDy || 0)} size={9.7} bold>{fmtAmt(receiptData?.amount)}</T>
      <T x={L.sum.inWordsX} y={L.sum.y} size={12} n={isHi}>{X.inWords}</T>
      <T x={L.sum.wordsX} y={L.sum.y + sumDy} size={9.7} bold>{val(receiptData?.amountInWords)}</T>
      {Array.from({ length: 113 }, (_, i) => (
        <rect key={i} x={L.sum.rule[0] + i * 3} y={L.sum.rule[1]} width="1.5" height="1.5" fill="#000" />
      ))}

      {isHi ? (
        <T x={15.3} y={L.towards.y} size={9.7} bold n>{X.towards}</T>
      ) : (
        <>
          <T x={15.3} y={L.towards.y} size={12}>{X.towards}</T>
          <T x={60.6} y={L.towards.y} size={9.7} bold>{X.towardsValue}</T>
          <T x={156.6} y={L.towards.y} size={12}>{X.vide}</T>
        </>
      )}
      <T x={L.towards.modeX} y={L.towards.y} size={12} bold>
        {val(modeLabel)}
        {referenceNo ? ` (${referenceNo})` : ""}
      </T>

      {/* charge table */}
      <T x={t.titleX} y={t.titleY} size={9} bold n={isHi}>{X.tableTitle}</T>
      <Rect x={t.thickLine[0]} y={t.thickLine[1]} w={t.thickLine[2]} h={t.thickLine[3]} />
      {positioned.map((r, i) => (
        <g key={`${r.kind}-${i}`}>
          {/* top line of the first row, bottom line of every row */}
          {i === 0 && <Rect x={t.lineLeft} y={r.top} w={t.lineRight - t.lineLeft} h="0.7" />}
          <Rect x={t.lineLeft} y={r.bottom - t.bottomExtra} w={t.lineRight - t.lineLeft} h="0.7" />
          <Rect x={t.cols[0]} y={r.top} w="0.7" h={r.h} />
          <Rect x={t.cols[3]} y={r.top} w="0.7" h={r.h} />
          {(r.kind === "header" || r.kind === "row1") && <Rect x={t.cols[1]} y={r.top} w="0.7" h={r.h} />}
          {r.kind !== "blank" && <Rect x={t.cols[2]} y={r.top} w="0.7" h={r.h} />}
        </g>
      ))}
      {positioned.map((r, i) => {
        const base = rowBaseline(r);
        const baseLatin = rowBaseline(r, true);
        if (r.kind === "header") {
          return (
            <g key={`h${i}`}>
              <T x={t.hdrCenters[0]} y={base} size={9} bold anchor="middle" n={isHi}>{X.hdr[0]}</T>
              <T x={t.hdrCenters[1]} y={base} size={9} bold anchor="middle" n={isHi}>{X.hdr[1]}</T>
              <T x={t.hdrAmountRight} y={base} size={9} bold anchor="end" n={isHi}>{X.hdr[2]}</T>
            </g>
          );
        }
        if (r.kind === "row1") {
          return (
            <g key={`r${i}`}>
              {isHi ? (
                <T x={t.row1LabelX} y={base} size={9.7} n>{X.row1}</T>
              ) : (
                <T x={t.row1LabelCenter} y={base} size={9.7} anchor="middle">{X.row1}</T>
              )}
              <T x={t.row1PeriodCenter} y={baseLatin} size={9.7} anchor="middle">
                {fmtMonth(receiptData?.fromDate)} to {fmtMonth(receiptData?.uptoDate)}
              </T>
              <T x={t.amountRight} y={baseLatin} size={9.7} anchor="end">{fmtAmt(tran?.demandAmt)}</T>
            </g>
          );
        }
        if (r.kind === "charge") {
          return (
            <g key={`c${i}`}>
              <T x={t.labelRight} y={base} size={9.7} bold anchor="end" n={isHi && hasHindi(r.label)}>{r.label}</T>
              <T x={t.amountRight} y={baseLatin} size={9.7} anchor="end">
                {r.isRebate ? "- " : ""}
                {fmtAmt(r.amount)}
              </T>
            </g>
          );
        }
        if (r.kind === "total" || r.kind === "received") {
          return (
            <g key={`t${i}`}>
              <T x={t.labelRight} y={base} size={9.7} bold anchor="end" n={isHi}>
                {r.kind === "total" ? X.total : X.received}
              </T>
              <T x={t.amountRight} y={baseLatin} size={9.7} bold anchor="end">
                {fmtAmt(r.kind === "total" ? tran?.payableAmt : receiptData?.amount)}
              </T>
            </g>
          );
        }
        return null;
      })}

      {/* signature */}
      {user.signatureImg && (
        <image href={user.signatureImg} x={L.signature.x + 28} y={sigY - 38} width="80" height="32" />
      )}
      <T x={L.signature.x} y={sigY} size={12} n={isHi}>{X.signature}</T>

      {/* notes */}
      <T x={L.note.title[0]} y={L.note.title[1] + shift} size={9} bold>{X.note}</T>
      {notes.map((note, i) => (
        <g key={i}>
          {note.bullet && <circle cx={L.note.bulletX} cy={noteLine(i) + shift - 2.2} r="1.5" fill="#000" />}
          <text x={L.note.textX} y={noteLine(i) + shift} style={{ whiteSpace: "pre" }}>
            {note.parts}
          </text>
        </g>
      ))}

      {/* collaboration block */}
      {[X.collab, val(ulb.collaboration), ulb.ulbName || NA].map((line, i) => (
        <T key={i} x={L.collab.cx} y={L.collab.y + shift + i * L.collab.step} size={9} anchor="middle">
          {line}
        </T>
      ))}
    </svg>
  );
}

export default ShopPaymentReceiptDtl;
