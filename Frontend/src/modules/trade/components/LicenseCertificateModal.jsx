import { useState, useRef } from "react";
import { handleGeneratePdf, usePrint } from "../../../utils/common";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import LicenseCertificateDtl from "./LicenseCertificateDtl";

function LicenseCertificateModal({ id, onClose }) {
  const [isFrozen, setIsFrozen] = useState(false);
  const printRef = useRef();

  // const handlePrint = async () => {
  //   setIsFrozen(true);
  //   await handleGeneratePdf(printRef);
  //   setIsFrozen(false);
  // };

  const handlePrint = usePrint(printRef,`${"Payment Receipt" || ""}`);

  return (
    <div
      className="z-[9999] fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 print:static print:bg-transparent"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={modalVariants}
        className="bg-white rounded-lg p-6 shadow-lg w-full max-w-6xl max-h-[92vh] overflow-y-auto print:max-w-full print:shadow-none print:p-0"
      >
        {/* HEADER */}
        <div className="print:hidden flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <h2 className="font-semibold text-blue-900 text-xl">
            Trade License Certificate
          </h2>

          <div className="flex gap-3 items-center">
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              Print
            </button>

            <button
              className="text-gray-600 hover:text-red-600"
              onClick={() => {
                setIsFrozen(false);
                onClose();
              }}
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="relative flex-grow print:overflow-visible">
          <div className={`${isFrozen ? "pointer-events-none blur-sm" : ""}`}>
            <div ref={printRef}>
              <LicenseCertificateDtl
                id={id}
                setIsFrozen={setIsFrozen}
              />
            </div>
          </div>

          {/* Freeze Overlay */}
          {isFrozen && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
              <p className="text-gray-700 text-lg font-semibold">
                Processing…
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default LicenseCertificateModal;
