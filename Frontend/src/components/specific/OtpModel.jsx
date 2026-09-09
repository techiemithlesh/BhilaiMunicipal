import { useState } from 'react';
import { motion } from 'framer-motion';
import RequestOtpForm from './RequestOtpForm';
import ResetPasswordForm from './ResetPasswordForm';
import { modalVariants } from '../../utils/motionVariable';

const OtpModal = ({ onClose  }) => {
    const [email, setEmail] = useState('');
    const [otpRequested, setOtpRequested] = useState(false);
  
    const handleOtpRequested = (email) => {
      setEmail(email);
      setOtpRequested(true);
    };


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <motion.div
        className="relative  bg-white w-1/4 p-6 rounded shadow-lg"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
        {otpRequested ? (
          <ResetPasswordForm email={email} />
        ) : (
          <RequestOtpForm onOtpRequested={handleOtpRequested} />
        )}
      </motion.div>
    </div>
  );
};

export default OtpModal;
