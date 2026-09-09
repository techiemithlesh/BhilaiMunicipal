
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

const SuccessModal = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  onConfirm,
  showSecondaryButton = false,
  secondaryButtonText = "Cancel",
  onSecondaryAction,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md mx-4 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              &times;
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-3">
              <FaCheckCircle className="text-green-500 w-14 h-14" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-center mb-2 text-gray-800">
              {title}
            </h2>

            {/* Message */}
            <div className="text-center text-gray-600 mb-6">{message}</div>

            {/* Buttons */}
            <div className="flex justify-center gap-3">
              {showSecondaryButton && (
                <button
                  onClick={onSecondaryAction}
                  className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition text-gray-700"
                >
                  {secondaryButtonText}
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="px-5 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
              >
                {buttonText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessModal;
