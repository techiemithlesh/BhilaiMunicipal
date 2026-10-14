import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useLoading } from "../../../contexts/LoadingContext";
import { modalVariants } from "../../../utils/motionVariable";
import { usePrint } from "../../../utils/common";
import ShopDemandReceiptDtl from "./ShopDemandReceiptDtl";
import "../../../i18n";

function ShopDemandReceiptModal({ id, onClose }) {
  const { t, i18n } = useTranslation();
  const { setIsLoadingGable } = useLoading();
  const [isFrozen, setIsFrozen] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (!isFrozen) return;
    setIsLoadingGable(true);
    return () => setIsLoadingGable(false);
  }, [isFrozen]);

  const handlePrint = usePrint(printRef, "Shop Rent Demand Receipt");

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
          <h2 className="font-semibold text-blue-900 text-xl">Demand Receipt</h2>
          <div className="flex items-center gap-3">
            <button
              className={isHindi ? "text-gray-500 hover:text-gray-400" : "font-semibold text-red-500"}
              onClick={() => switchLanguage("en")}
            >
              {t("English")}
            </button>
            <button
              className={isHindi ? "font-semibold text-red-500" : "text-gray-500 hover:text-gray-400"}
              onClick={() => switchLanguage("hi")}
            >
              {t("Hindi")}
            </button>
            <button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
            >
              {t("Print")}
            </button>
            <button className="text-gray-600 hover:text-red-600" onClick={onClose}>
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="relative flex-grow print:overflow-visible overflow-y-auto">
          <div className={isFrozen ? "pointer-events-none" : ""}>
            <div className="overflow-x-auto" ref={printRef}>
              <ShopDemandReceiptDtl id={id} setIsFrozen={setIsFrozen} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ShopDemandReceiptModal;
