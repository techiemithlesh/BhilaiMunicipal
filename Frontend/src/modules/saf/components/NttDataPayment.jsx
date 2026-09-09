import React, { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import { initOnlinePropPaymentApi } from '../../../api/endpoints';

function NttDataPayment({ id,demandData, onSubmit, onCancel }) {
    const token = getToken();
    const [loading, setLoading] = useState(false);
    const [isFrozen, setIsFrozen] = useState(false);
    const [form, setForm] = useState({ paymentType: "FULL" });

    // Load the Atom SDK Script dynamically
    useEffect(() => {
        const script = document.createElement('script');
        // Use 'https://psweb.atomtech.in/staticdata/ots/js/atomcheckout.js' for Production
        script.src = "https://pgtest.atomtech.in/staticdata/ots/js/atomcheckout.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleOpenPay = async () => {
        setLoading(true);
        try {
            // 1. Call your Laravel API to get the token and merchant data
            const response = await axios.post(initOnlinePropPaymentApi, 
                { 
                    "paymentType": "FULL",
                    "id": id,
                    "successUrl":window.location.href ,
                    "failUrl":window.location.href, 
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if(response?.data?.status){
                const data = response?.data?.data;
    
                // 2. Configure the options for the SDK
                const options = {
                    "atomTokenId": data?.atomTokenId,
                    "merchId": data?.merchId,
                    "custEmail": data?.custEmail,
                    "custMobile": data?.custMobile,
                    "returnUrl": data?.returnUrl
                };
    
                // 3. Initialize and Open the payment overlay
                // 'uat' for testing, 'prod' for live
                if (window.AtomPaynetz) {
                    new window.AtomPaynetz(options, 'uat');
                } else {
                    alert("Payment SDK not loaded yet.");
                }

            }
        } catch (error) {
            console.error("Payment Error:", error);
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 p-4">
            <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={modalVariants}
                transition={{ duration: 0.4 }}
                className="relative bg-white shadow-lg p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                <h2 className="font-semibold text-blue-900 text-xl">Make Payment</h2>
                <button
                    onClick={onCancel}
                    className="text-gray-600 hover:text-red-600"
                >
                    <FaTimes size={20} />
                </button>
                </div>
                {/* body */}
                 <div className="card p-4 shadow-sm">
                    <h3>Merchant Shop</h3>
                    <p>Payable Amount: ₹{demandData?.totalPayableAmount}</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleOpenPay} 
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : 'Pay Now'}
                    </button>
                </div>
                {/* Loading Overlay */}
                {loading && (
                <div className="z-20 absolute inset-0 flex justify-center items-center bg-white/70">
                    <span className="font-medium text-gray-800 text-lg">
                    Processing...
                    </span>
                </div>
                )}

            </motion.div>
        </div>
        
    );
}

export default NttDataPayment
