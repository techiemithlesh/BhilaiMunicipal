import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { getToken } from "../../../utils/auth";
import { modalVariants } from "../../../utils/motionVariable";

const control = "w-full max-w-[17rem] rounded border border-gray-300 bg-white px-3 py-2 text-gray-800";
const cell = "flex min-h-11 items-center gap-3 border-b border-gray-200 px-3 py-2 sm:grid sm:grid-cols-[minmax(7rem,1fr)_2fr]";
const money = (value) => Number(value ?? 0).toFixed(2);
const bankFields = [
  ["chequeNo", "Cheque/DD/Reference No.", "text"],
  ["chequeDate", "Cheque/DD/Reference Date", "date"],
  ["bankName", "Bank Name", "text"],
  ["branchName", "Branch Name", "text"],
];

function PaymentField({ label, name, required, children, highlight }) {
  return (
    <div className={cell}>
      <label htmlFor={name} className={highlight ? "font-semibold text-teal-800" : "font-semibold"}>
        {label}{required && <span className="text-red-600">*</span>}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function YesNo({ name, label, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-x-4">
      <label className="inline-flex items-center gap-1">
        <input type="radio" name={name} checked={value} onChange={() => onChange(true)} /> Yes
      </label>
      <label className="inline-flex items-center gap-1">
        <input type="radio" name={name} checked={!value} onChange={() => onChange(false)} /> No
      </label>
    </div>
  );
}

function PaymentModal({ apiUrl, id, demandData, onSubmit, onCancel }) {
  const years = (demandData.demandUptoList || []).map(({ fyear }) => fyear).filter(Boolean).sort();
  const [fyear, setFyear] = useState(demandData.demandUptoFyear || years.at(-1) || "");
  const [isGSTWeaveOff, setWaiver] = useState(false);
  const [payKshatiPurti, setKshatiPurti] = useState(false);
  const [quote, setQuote] = useState(null);
  const [retry, setRetry] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [prevGstAmt, setPrevGstAmt] = useState("");
  const token = getToken();

  const quoteKey = JSON.stringify([fyear, isGSTWeaveOff, payKshatiPurti, retry]);
  const refreshQuote = () => setRetry((attempt) => attempt + 1);
  const due = quote?.key === quoteKey ? quote.data : null;
  const error = quote?.key === quoteKey ? quote.error : null;
  const payable = Math.round(Number(due?.payableAmount) * 100) + Math.round(Number(prevGstAmt) * 100);
  const needsBankDetails = paymentMode && !["ONLINE", "CASH"].includes(paymentMode);

  useEffect(() => {
    if (!fyear) return;
    const controller = new AbortController();
    async function loadDue() {
      try {
        const { data } = await axios.post(apiUrl, { id, fyear, isGSTWeaveOff, payKshatiPurti }, {
          headers: { Authorization: "Bearer " + token },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setQuote(data.status
            ? { key: quoteKey, data: data.data }
            : { key: quoteKey, error: data.message || "Unable to calculate the outstanding dues." });
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setQuote({ key: quoteKey, error: requestError.response?.data?.message || "Unable to calculate the outstanding dues." });
        }
      }
    }

    loadDue();
    return () => controller.abort();
  }, [apiUrl, id, fyear, isGSTWeaveOff, payKshatiPurti, token, quoteKey]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const remarks = form.elements.remarks;
    if (!remarks.value.trim()) {
      remarks.setCustomValidity("Enter remarks for this payment.");
      remarks.reportValidity();
      return;
    }
    if (Number(due?.payableAmount) <= 0 || !due || isSubmitting || !window.confirm("Proceed with this lease rent payment?")) return;

    const payload = new FormData(form);
    payload.set("id", id);
    payload.set("fyear", fyear);
    payload.set("paymentType", "FULL");
    payload.set("isGSTWeaveOff", isGSTWeaveOff ? "1" : "0");
    payload.set("prevGstAmt", prevGstAmt || "0");
    payload.set("remarks", remarks.value.trim());
    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-5 shadow-lg sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-semibold text-blue-900">Payment</h2>
          <button type="button" onClick={onCancel} disabled={isSubmitting} aria-label="Close payment" className="text-gray-600 hover:text-red-600 disabled:opacity-50">
            <FaTimes size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="text-sm text-blue-950">
          <fieldset disabled={isSubmitting} className="space-y-5">
            <div className="grid border-x border-t border-gray-200 sm:grid-cols-2 sm:[&>div:nth-child(even)]:border-l">
              <PaymentField label="Dues From">{due?.demandFromFyear || "-"}</PaymentField>
              <PaymentField label="Dues Upto" name="lease-payment-year" required>
                <select id="lease-payment-year" className={control} value={fyear} onChange={(e) => { setFyear(e.target.value); refreshQuote(); }} required>
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </PaymentField>
              <PaymentField label="Demand">{due ? money(due.demandAmount) : "-"}</PaymentField>
              <PaymentField label="Penalty">{due ? money(due.latePenalty) : "-"}</PaymentField>
              <PaymentField label="GST">{due ? money(Number(due.cgst ?? 0) + Number(due.sgst ?? 0) - Number(due.cgstWeaveOff ?? 0) - Number(due.sgstWeaveOff ?? 0)) : "-"}</PaymentField>
              <PaymentField label="Prev GST Amount" name="lease-prev-gst">
                <input id="lease-prev-gst" className={control} type="number" min="0" step="0.01" value={prevGstAmt} onChange={(e) => setPrevGstAmt(e.target.value)} />
              </PaymentField>
              <PaymentField label="Additional Charges">{due ? money(due.additionalTax) : "-"}</PaymentField>
              <PaymentField label="Advance">{due ? money(due.advanceAmount) : "-"}</PaymentField>
              <PaymentField label="Payable Amount" highlight>
                <output className="font-semibold text-teal-800" aria-live="polite">{due ? money(Math.max(0, payable) / 100) : "-"}</output>
              </PaymentField>
            </div>

            <div className="border-x border-t border-gray-200">
              <PaymentField label="GST Waive Off">
                <YesNo name="lease-gst-waiver" label="GST Waive Off" value={isGSTWeaveOff} onChange={(value) => { setWaiver(value); refreshQuote(); }} />
              </PaymentField>
              {isGSTWeaveOff && (
                <PaymentField label="GST Waiver Document" name="lease-gst-document" required>
                  <input id="lease-gst-document" name="GSTWeaveOffDoc" type="file" accept=".pdf,.png,.jpg,.jpeg" className={control} required />
                </PaymentField>
              )}
              <PaymentField label="GST No." name="lease-gst-no">
                <input id="lease-gst-no" name="gstNo" className={control} defaultValue="N/A" maxLength={255} />
              </PaymentField>
              <PaymentField label="Transaction Mode" name="lease-payment-mode" required>
                <select id="lease-payment-mode" name="paymentMode" className={control} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required>
                  <option value="">Select transaction mode</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="DD">DD</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                </select>
              </PaymentField>
              {needsBankDetails && bankFields.map(([name, label, type]) => (
                <PaymentField key={name} name={"lease-" + name} label={label} required>
                  <input id={"lease-" + name} name={name} type={type} className={control} maxLength={255} required />
                </PaymentField>
              ))}
              <PaymentField label="Remarks" name="lease-remarks" required>
                <textarea id="lease-remarks" name="remarks" rows={3} maxLength={255} className={control} onChange={(e) => e.target.setCustomValidity("")} required />
              </PaymentField>
            </div>

            {error && (
              <p role="alert" className="text-center text-red-700">
                {error} <button type="button" onClick={refreshQuote} className="underline">Retry</button>
              </p>
            )}
            {!due && !error && <p role="status" className="text-center">Calculating dues…</p>}
            {due && Number(due.payableAmount) <= 0 && <p role="status" className="text-center">No lease dues are payable for this selection.</p>}
            <div className="flex justify-center">
              <button type="submit" disabled={!due || Number(due.payableAmount) <= 0 || isSubmitting} className="min-w-48 rounded bg-amber-500 px-6 py-2 font-semibold text-gray-950 hover:bg-amber-400 disabled:opacity-50">
                {isSubmitting ? "Recording payment…" : "Proceed To Pay"}
              </button>
            </div>
          </fieldset>
        </form>
      </motion.div>
    </div>
  );
}

export default PaymentModal;
