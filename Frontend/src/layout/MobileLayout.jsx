import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getToken, getUserDetails } from "../utils/auth";
import axios from "axios";
import { heartBeatApi, UlbApi } from "../api/endpoints";
import { useNavigate } from "react-router-dom";
import MobileHeader from "./MobileHeader";
import MobileFooter from "./MobileFooter";

const footerVariants = {
  hidden: { y: 100 },
  visible: { y: 0 },
};

const MobileLayout = ({ children, onUlbReady }) => {
  const token = getToken();
  const navigate = useNavigate();
  const userDtl = getUserDetails();
  const ulbId = userDtl?.ulbId;

  const [ulbData, setUlbData] = useState(null);
  const intervalRef = useRef(null);

  // Heartbeat auth check
  useEffect(() => {
    const testHeartBeat = async () => {
      try {
        const { data } = await axios.post(
          heartBeatApi,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!data?.status || !data?.authenticated) {
          navigate("/login/mobile", { replace: true });
        }
      } catch (error) {
        navigate("/login", { replace: true });
      }
    };

    testHeartBeat();
    intervalRef.current = setInterval(testHeartBeat, 300000); // every 5 min
    return () => clearInterval(intervalRef.current);
  }, [token, navigate]);

  // Fetch ULB data
  useEffect(() => {
    const fetchUlbDtl = async () => {
      if (!ulbId) return;
      try {
        const res = await axios.post(
          UlbApi.replace("{id}", ulbId),
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const ulb = res?.data?.data;
        if (ulb) {
          setUlbData(ulb);
          onUlbReady?.(); // ✅ Notify parent layout is ready
        }
      } catch (err) {
        setUlbData({ ulb_name: "ULB Info" });
        onUlbReady?.();
      }
    };

    fetchUlbDtl();
  }, [ulbId, token]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <MobileHeader ulbData={ulbData} />
      <main className="flex-1 overflow-y-auto px-4 py-2">{children}</main>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={footerVariants}
        transition={{ duration: 0.5 }}
      >
        <MobileFooter ulbData={ulbData} className="bg-gray-800 text-white" />
      </motion.div>
    </div>
  );
};

export default MobileLayout;
