import React, { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { getLoginUsersApi } from "../../api/endpoints";
import { toastMsg } from "../../utils/utils";
import { motion, AnimatePresence } from "framer-motion";
import { modalVariants } from "../../utils/motionVariable";
import { 
  FaTimes, FaUsers, FaCircle, FaSearch, 
  FaDesktop, FaMobileAlt, FaGlobe, FaMapMarkerAlt, FaBuilding 
} from "react-icons/fa";
import { Spinner } from "@nextui-org/react";

/* ================= HELPER: GET SESSION ICON ================= */
const getSessionIcon = (machine = "") => {
  const name = machine.toLowerCase();
  if (name.includes("android") || name.includes("iphone") || name.includes("mobile")) {
    return <FaMobileAlt className="text-gray-500" />;
  }
  if (name.includes("windows") || name.includes("mac") || name.includes("linux")) {
    return <FaDesktop className="text-gray-500" />;
  }
  return <FaGlobe className="text-gray-500" />;
};

function LoginUserList({ onClose, id }) {
  const token = getToken();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const res = await axios.post(
          getLoginUsersApi,
          { id: id || "" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res?.data?.status) {
          setUsers(res.data.data || []);
        } else {
          toastMsg(res.data.message || "Failed to fetch sessions", "error");
        }
      } catch (error) {
        toastMsg("Server error while fetching users", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [token, id]);

  const filteredUsers = users.filter((user) =>
    user.machine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.ip_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial="hidden" animate="visible" exit="hidden" variants={modalVariants}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[85vh]"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg"><FaUsers className="text-blue-600 text-lg" /></div>
            <h2 className="text-lg font-semibold">Active Sessions</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors"><FaTimes /></button>
        </div>

        {/* SEARCH */}
        <div className="px-6 py-3 border-b bg-gray-50/50">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text" placeholder="Search by IP or Device..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LIST BODY */}
        <div className="relative flex-1 overflow-y-auto px-4 py-3 min-h-[350px]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
              <Spinner size="md" color="primary" />
              <p className="text-sm text-gray-400 font-medium">Fetching active devices...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400 text-sm">No sessions found</div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t px-6 py-4 flex justify-end bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="rounded-xl border bg-white px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ================= USER ROW ITEM WITH IP LOOKUP ================= */
const UserRow = ({ user }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [ipData, setIpData] = useState(null);
  const [loadingIp, setLoadingIp] = useState(false);

  const fetchIpDetails = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }
    
    setShowDetails(true);
    if (ipData) return; // Don't refetch if we already have it

    try {
      setLoadingIp(true);
      // Using ip-api.com (Free for non-commercial, no API key needed for basic usage)
      const res = await axios.get(`http://ip-api.com/json/${user.ip_address}`);
      if (res.data.status === "success") {
        setIpData(res.data);
      }
    } catch (err) {
      console.error("IP lookup failed", err);
    } finally {
      setLoadingIp(false);
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border transition-all ${user.is_current ? 'border-blue-200 bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}`}>
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={fetchIpDetails}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-white border shadow-sm text-gray-600">
            {getSessionIcon(user.machine)}
            <FaCircle className="absolute -top-1 -right-1 text-green-500 border-2 border-white text-[10px]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-800 leading-tight">{user.machine || user.name}</p>
              {user.is_current && <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">You</span>}
            </div>
            <p className="text-xs font-mono text-blue-500 mt-0.5 hover:underline decoration-dotted cursor-help">
              {user.ip_address || "0.0.0.0"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>Active
          </span>
          <p className="text-[10px] text-gray-400 mt-1 font-medium italic">{user.lastLogin || "Active Now"}</p>
        </div>
      </div>

      {/* IP DETAILS PANEL */}
      <AnimatePresence>
        {showDetails && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gray-100/50 rounded-b-xl border-t"
          >
            <div className="p-3 text-[11px] space-y-2">
              {loadingIp ? (
                <div className="flex items-center gap-2 text-gray-500"><Spinner size="sm" /> <span>Fetching location...</span></div>
              ) : ipData ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaMapMarkerAlt className="text-red-400" />
                    <span>{ipData.city}, {ipData.regionName}, {ipData.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaBuilding className="text-blue-400" />
                    <span className="truncate">{ipData.isp}</span>
                  </div>
                  <div className="col-span-2 text-[9px] text-gray-400 font-mono">
                    Lat: {ipData.lat} | Lon: {ipData.lon} | TZ: {ipData.timezone}
                  </div>
                </div>
              ) : (
                <p className="text-red-400">Could not retrieve IP location details.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginUserList;