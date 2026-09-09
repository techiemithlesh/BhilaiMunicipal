import { useEffect, useRef, useState } from "react";
import { citizenProfileApi, heartBeatApi, UlbApi } from "../api/endpoints";
import axios from "axios";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CircularProgressAvatar from "../assets/images/CircularProgressAvatar";
import CitizenSidebar from "./CitizenSidebar";
import { logoutThunk, setCitizenUser } from "../store/slices/citizenAuthSlice";
import { useDispatch, useSelector } from "react-redux";
import defaultAvatar from "../assets/images/default-avatar.jpg";
import { clearAuth } from "../utils/auth";
import toast from "react-hot-toast";
import EditProfileModal from "../components/citizen/settings/EditProfileModal";

export default function CitizenLayout({ children }) {
  const [ulbData, setUlbData] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.citizenAuth.token);

  const openModal = () => setIsModelOpen(true);
  const closeModal = () => setIsModelOpen(false);

  const intervalRef = useRef(null);

  // ===== Heartbeat Auth Check =====
  useEffect(() => {
    if (!token) navigate("/citizen/auth", { replace: true });

    const testHeartBeat = async () => {
      try {
        const { data } = await axios.post(
          heartBeatApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!data?.authenticated) {
          clearAuth();
          navigate("/citizen/auth", { replace: true });
        }
      } catch {
        navigate("/citizen/auth", { replace: true });
      }
    };

    testHeartBeat();
    intervalRef.current = setInterval(testHeartBeat, 300000);
    return () => clearInterval(intervalRef.current);
  }, [token]);

  // ===== Fetch User Info =====
  useEffect(() => {
    if (token) fetchUserInfo();
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const res = await axios.post(
        citizenProfileApi,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.data) setUserInfo(res.data.data);
    } catch {}
  };

  // ===== Fetch ULB Info =====
  useEffect(() => {
    const fetchUlbDtl = async () => {
      try {
        const res = await axios.post(UlbApi.replace("{id}", userInfo?.UlbId || 1), {});
        setUlbData(res.data?.data);
      } catch {
        setUlbData({ ulb_name: "ULB Info" });
      }
    };
    fetchUlbDtl();
  }, [userInfo]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await dispatch(
        logoutThunk({ token, navigateUrl: "/citizen/auth" })
      );
      if (logoutThunk.fulfilled.match(result)) {
        toast.success("Logged out successfully");
        navigate("/citizen/auth");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const items = [
    { key: "Edit Profile", label: "Edit Profile", action: openModal },
    { key: "Logout", label: "Logout", action: handleLogout },
  ];

  const menuItems = [
    { label: "Dashboard", path: "/citizen" },
    { label: "My Application", path: "/citizen/application" },
    {
      label: "Property",
      children: [
        {
          label: "Saf",
          children: [{ label: "Apply Saf", path: "/citizen/saf/apply-saf" }],
        },
        {
          label: "Holding",
          children: [{ label: "Search", path: "/citizen/holding/search" }],
        },
      ],
    },
    {
      label: "Water",
      children: [
        { label: "Pay Water Tax", path: "/citizen/water/search" },
        { label: "Apply Water Connection", path: "/citizen/water/apply-connection" },
      ],
    },
    {
      label: "Trade",
      children: [
        { label: "Apply License", path: "/citizen/trade/apply-license" },
        { label: "Search", path: "/citizen/trade/search" },
      ],
    },
    {
      label: "Solid Waste",
      children: [
        { label: "Apply Waste", path: "/citizen/holding/apply-saf3" },
        { label: "Pay Tax", path: "/citizen/holding/assessment3" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-screen">

      {/* ===== TOP NAVBAR ===== */}
      <nav className="z-50 bg-white dark:bg-gray-800 border-b px-4 py-3 flex justify-between items-center">

        {/* Hamburger - only mobile */}
        <button
          className="lg:hidden text-2xl"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FiMenu />
        </button>

        {/* Logo + Text */}
        <div className="flex items-center">
          <img src={ulbData?.logoImg} className="h-14 mr-3" />
          <div className="hidden md:block">
            <h1 className="font-bold text-xl md:text-3xl">{ulbData?.ulbName}</h1>
            <p className="text-sm md:text-lg">{ulbData?.hindiUlbName}</p>
          </div>
        </div>

        {/* Profile Menu */}
        <Dropdown>
          <DropdownTrigger>
            <div className="w-14 h-14 rounded-full overflow-hidden cursor-pointer">
              <CircularProgressAvatar
                progress={userInfo?.profileCompletion}
                imageUrl={userInfo?.userImg || defaultAvatar}
              />
            </div>
          </DropdownTrigger>
          <DropdownMenu>
            {items.map((item) => (
              <DropdownItem key={item.key} onClick={item.action}>
                {item.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </nav>

      {/* ===== PAGE LAYOUT ===== */}
      <div className="flex flex-grow overflow-hidden">

        {/* === MOBILE OVERLAY === */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* ===== SIDEBAR ===== */}
        <aside
          className={`
            bg-white dark:bg-gray-800 border-r px-3 py-4 w-64 h-full 
            overflow-y-auto scrollbar-hide
            fixed lg:static top-0 left-0 z-50
            transform transition-transform duration-300
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <CitizenSidebar menuItems={menuItems} onItemClick={() => setIsSidebarOpen(false)}/>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isModelOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow">
            <EditProfileModal onSuccess={fetchUserInfo} onClose={closeModal} user={userInfo} />
          </div>
        </div>
      )}

      {/* LOGOUT LOADER */}
      {isLoggingOut && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 z-[9999]">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
