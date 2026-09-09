import { IoIosNotificationsOutline } from "react-icons/io";
import { getToken, removeAuthToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useState } from "react";
import useUserProfileAndWardMapped from "../hooks/UseUserProfile";
import axios from "axios";
import { logoutApi } from "../api/endpoints";
import { FaBars } from "react-icons/fa";
import ProfileViewCard from "../components/specific/ProfileViewCard";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import ChangePassword from "../components/specific/ChangePassword";
import LoginUserList from "../components/specific/LoginUserList";

const defaultAvatar = "https://via.placeholder.com/100";

const AdminHeader = ({ setIsSidebarOpen, isSidebarOpen, ulbData }) => {

  const token = getToken();
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isChangePassModelOpen, setIsChangePassModelOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 👈 new state
  const [isLoginDeviceModelOpen, setIsLoginDeviceModelOpen] = useState(false);
  const closeModal = () => setIsModelOpen(false);
  const openModal = () => setIsModelOpen(true);
  const navigate = useNavigate();
  const userDetails = JSON.parse(localStorage.getItem("userDetails"));
  const { profile } = useUserProfileAndWardMapped();

  const handleLogout = async () => {
    setIsLoggingOut(true); // 👈 show overlay
    try {
      const response = await axios.post(
        logoutApi,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response?.data?.status) {
        removeAuthToken();
        navigate("/");
        toast.success("User Logout Successfully!", {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out", {
        position: "top-right",
      });
    }finally {
      setIsLoggingOut(false); // 👈 hide overlay
    }
  };

  const handleViewDetails = () => {
    navigate("/user/profile");
  };

  const items = [
    {
      key: "View Profile",
      label: "View Profile",
      action: openModal,
    },
    {
      key: "Edit Profile",
      label: "Edit Profile",
      action: handleViewDetails,
    },
    {
      key: "Login Device",
      label: "Login Device",
      className:"text-yellow-300",
      action: ()=>setIsLoginDeviceModelOpen(true),
    },
    {
      key: "Change Password",
      label: "Change Password",
      action: ()=>setIsChangePassModelOpen(true),
    },
    {
      key: "Logout",
      label: "Logout",
      action: handleLogout,
    },
  ];

  if (!userDetails) return null;

  return (
    <header className="flex justify-between items-center bg-gray-900 text-white px-4 py-3 z-50">
      <div className="flex items-center gap-3">
        {/* Mobile toggle button */}
        <button
          className="md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaBars className="text-xl" />
        </button>
        <a href="/">
          <img
            src={ulbData?.logoImg}
            alt={ulbData?.shortName}
            width={60}
            height={60}
            className="shadow rounded-full"
          />
        </a>
        <div className="hidden md:block">
          <h1 className="font-bold text-xl md:text-3xl">{ulbData?.ulbName}</h1>
          <p className="text-sm md:text-lg">{ulbData?.hindiUlbName}</p>
        </div>
      </div>

      <div className="flex items-center">
        <span className="mr-4">
          <IoIosNotificationsOutline size="30px" className="cursor-pointer" />
        </span>
        <span className="mr-4 cursor-pointer">
          <Dropdown>
            <DropdownTrigger>
              {userDetails && (
                <div className="relative shadow rounded-full w-14 h-14 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src={userDetails?.userImg || defaultAvatar}
                    alt={userDetails?.name}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-50 font-semibold text-white text-xs text-center">
                    {userDetails?.name?.toUpperCase()}
                  </div>
                </div>
              )}
            </DropdownTrigger>
            <DropdownMenu aria-label="Dynamic Actions">
              {items.map((item) => (
                <DropdownItem
                  key={item.key}
                  color={item.key === "Logout" ? "danger" : "default"}
                  className={item.className ? item.className  :(item.key === "Logout" ? "text-danger" : (item.key=="Change Password" ? "text-blue-300" : ""))}
                  onClick={item.action}
                >
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </span>
      </div>

      {/* Modal View */}
      {isModelOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white shadow-md p-4 sm:p-6 border border-gray-200 rounded-lg max-w-full sm:max-w-sm h-fit text-black">
            <ProfileViewCard
              isOpen={isModelOpen}
              onClose={closeModal}
              user={profile}
            />
          </div>
        </div>
      )}
      {isChangePassModelOpen &&(
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white shadow-md p-4 sm:p-6 border border-gray-200 rounded-lg max-w-full sm:max-w-sm h-fit text-black">
            <ChangePassword
              onClose={()=>setIsChangePassModelOpen(false)}
            />
          </div>
        </div>
      )}
      {isLoginDeviceModelOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white shadow-md p-4 sm:p-6 border border-gray-200 rounded-lg max-w-full sm:max-w-sm h-fit text-black">
            <LoginUserList
              onClose={()=>setIsLoginDeviceModelOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 🔒 Fullscreen Blocking Loader Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-semibold">Logging out...</p>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;