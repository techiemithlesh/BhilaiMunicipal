import { useEffect, useState, useRef } from "react";
import { safPaymentReceiptApi } from "../../../api/endpoints";
import axios from "axios";
import {
  hostInfo,
  formatLocalDate,
  toTitleCase,
  handleGeneratePdf,
  usePrint,
} from "../../../utils/common";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import PaymentReceiptDtl from "./PaymentReceiptDtl";
import "../../../i18n"; 
import { useTranslation } from "react-i18next";

function PaymentReceiptModal({ id, onClose }) {
  const { t, i18n } = useTranslation();
  const [isFrozen, setIsFrozen] = useState(false);
  const printRef = useRef();



  const handlePrint = usePrint(printRef,`${"Payment Receipt" || ""}`);

  return (
    <div className="z-50 print:static fixed inset-0 flex justify-center items-center bg-black print:bg-transparent bg-opacity-50 p-4 print:p-0">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg print:shadow-none p-6 print:p-0 rounded-lg w-full print:max-w-full max-w-6xl max-h-[90vh]"
      >
        <div className="print:hidden flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">View Receipt</h2>
          <div className="flex gap-2">
            <button 
              className="text-red-500 hover:text-red-400"
              onClick={() => {
                i18n.changeLanguage("en");
                localStorage.setItem("lang", "en");
              }}
            >
              {t("English")}
            </button>
            <button 
              className="text-gray-500 hover:text-gray-400"
              onClick={() => {
                i18n.changeLanguage("hi");
                localStorage.setItem("lang", "hi");
              }}
            >
              {t("Hindi")}
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
            >
              {t("Print")} 
            </button>
            {onClose && (
              <button
                className="text-gray-600 hover:text-red-600"
                onClick={() => {
                  setIsFrozen(false);
                  if (onClose) onClose();
                }}
              >
                <FaTimes size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex-grow print:overflow-visible overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <div className="overflow-x-auto" ref={printRef}>            
              <PaymentReceiptDtl id={id} setIsFrozen={setIsFrozen} />
            </div>
          </div>
          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default PaymentReceiptModal;
