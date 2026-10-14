import React, { useRef, useState, useEffect } from 'react'
import { useLoading } from "../../../contexts/LoadingContext";
import { handleGeneratePdf } from '../../../utils/common';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import DemandReceiptDtl from './DemandReceiptDtl';

function DemandReceiptModal({ id, onClose }) {
    const [isFrozen, setIsFrozen] = useState(false);
    const { setIsLoadingGable } = useLoading();
    useEffect(() => {
      if (!isFrozen) return;
      setIsLoadingGable(true);
      return () => setIsLoadingGable(false);
    }, [isFrozen]);
    const printRef = useRef();

    // Print in same tab (no new window)
    const handlePrint = async () => {
        setIsFrozen(true);
        await handleGeneratePdf(printRef,"Demand-Receipt");
        setIsFrozen(false);
    };
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
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm"
            >
              Print
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
              isFrozen ? "pointer-events-none" : ""
            }`}
          >
            <div className="overflow-x-auto" ref={printRef}>
              <DemandReceiptDtl id={id} setIsFrozen={setIsFrozen} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DemandReceiptModal
