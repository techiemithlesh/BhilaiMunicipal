import { useEffect, useRef, useState } from "react";
import AdminFooter from "./AdminFooter";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { getToken, clearAuth } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { heartBeatApi, UlbApi } from "../api/endpoints";

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem("userDetails"));
  const [ulbData, setUlbData] = useState(null);
  const navigate = useNavigate();

  const sidebarRef = useRef(null);
  const intervalRef = useRef(null);

  const token = getToken();
  const ulbId = userInfo?.ulbId;

  // === Auth heartbeat check ===
  useEffect(() => {
    if (!token || !userInfo) {
      navigate("/login", { replace: true });
    }

    const testHeartBeat = async () => {
      try {
        const { data } = await axios.post(
          heartBeatApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!data?.status || !data?.authenticated) {
          clearAuth();
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Error during heartbeat:", err);
      }
    };

    testHeartBeat();
    intervalRef.current = setInterval(testHeartBeat, 300000); // 5 min
    return () => clearInterval(intervalRef.current);
  }, [token, navigate, userInfo]);

  // === Fetch ULB Info ===
  useEffect(() => {
    const fetchUlbDtl = async () => {
      if (!ulbId) return;
      try {
        const res = await axios.post(UlbApi.replace("{id}", ulbId), {});
        setUlbData(res?.data?.data);
      } catch {
        setUlbData({ ulb_name: "ULB Info" });
      }
    };
    fetchUlbDtl();
  }, [ulbId]);

  // === Close sidebar on outside click ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };
    // document.addEventListener("mousedown", handleClickOutside);

    // return () =>
    //   document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // === Disable body scroll when mobile sidebar open ===
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
  }, [isSidebarOpen]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <AdminHeader
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        ulbData={ulbData}
      />

      {/* Main Body */}
      <div className="flex flex-1 relative overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar
          sidebarRef={sidebarRef}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <main
          className={`flex-1 p-4 overflow-y-auto transition-all duration-300 
            ${isCollapsed ? "md:ml-30" : "md:ml-75"} 
            ${isSidebarOpen ? "blur-sm md:blur-0" : ""}
          `}
        >
          {children}
        </main>
      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminLayout;
