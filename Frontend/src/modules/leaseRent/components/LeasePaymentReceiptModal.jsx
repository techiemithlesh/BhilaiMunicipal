import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useLoading } from "../../../contexts/LoadingContext";
import { modalVariants } from "../../../utils/motionVariable";
import { usePrint } from "../../../utils/common";
import LeasePaymentReceiptDtl from "./LeasePaymentReceiptDtl";
import "../../../i18n";

function LeasePaymentReceiptModal({ id, onClose }) {
  const { t, i18n } = useTranslation();
  const { setIsLoadingGable } = useLoading();
  const [isFrozen, setIsFrozen] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (!isFrozen) return;
    setIsLoadingGable(true);
    return () => setIsLoadingGable(false);
  }, [isFrozen]);

  const handlePrint = usePrint(printRef, "Lease Rent Payment Receipt");

  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const isHindi = i18n.language === "hi";

  return (
    <div className="z-[60] print:static fixed inset-0 flex justify-center items-center bg-black print:bg-transparent bg-opacity-50 p-4 print:p-0">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg print:shadow-none p-6 print:p-0 rounded-lg w-full print:max-w-full max-w-4xl max-h-[90vh]"
      >
        <div className="print:hidden flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">Payment Receipt</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchLanguage(isHindi ? "en" : "hi")}
              className="px-3 py-1 border rounded text-gray-700 text-sm"
            >
              {isHindi ? "Switch to English" : "हिंदी में देखें"}
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
            >
              {t("print") || "Print"}
            </button>
            {onClose && (
              <button
                className="text-gray-600 hover:text-red-600"
                onClick={onClose}
                aria-label="Close"
              >
                <FaTimes size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="relative flex-grow overflow-y-auto print:overflow-visible">
          <div
            ref={printRef}
            className={isFrozen ? "pointer-events-none opacity-60" : ""}
          >
            <LeasePaymentReceiptDtl id={id} setIsFrozen={setIsFrozen} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LeasePaymentReceiptModal;
