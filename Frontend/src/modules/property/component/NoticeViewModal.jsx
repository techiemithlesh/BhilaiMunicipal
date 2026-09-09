import { useRef, useState } from 'react'
import { FaTimes } from 'react-icons/fa';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import NoticeDtl from './NoticeDtl';
import { handleGeneratePdf, usePrint } from '../../../utils/common';

function NoticeViewModal({ id, onClose }) {
    const [isFrozen, setIsFrozen] = useState(false);
    const printRef = useRef();

    // const handlePrint = async () => {
    //     setIsFrozen(true);
    //     await handleGeneratePdf(printRef);
    //     setIsFrozen(false);
    // };

    const handlePrint = usePrint(printRef,`${"Notice" || ""}`);
    return (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
            <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={modalVariants}
                transition={{ duration: 0.5 }}
                className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
            >
                {/* Header */}
                <div className="print:hidden flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-blue-900 text-xl">Notice</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-green-600 px-3 py-1 rounded text-white"
                        >
                            Print / Download PDF
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

                {/* Table Content */}
                <div className="relative flex-grow print:overflow-visible overflow-y-auto">
                    <div
                        className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""
                            }`}
                    >
                        <div className="overflow-x-auto" ref={printRef}>
                            <NoticeDtl id={id} setIsFrozen={setIsFrozen} />
                        </div>
                    </div>
                    {/* Frozen Overlay */}
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
    )
}

export default NoticeViewModal
