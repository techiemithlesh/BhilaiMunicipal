import { useState, useRef, useEffect } from "react";
import {
  FaBars,
  FaSearch,
  FaUser,
  FaKey,
  FaSignOutAlt,
  FaHome,
} from "react-icons/fa";
import { removeAuthToken } from "../utils/auth";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function MobileHeader({ ulbData }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logoutHandler = () => {
    removeAuthToken();
    navigate("/login/mobile");
    toast.success("User logged out successfully!", { position: "top-right" });
  };

  return (
    <header className="z-50 relative bg-blue-700 shadow-md px-4 py-3 w-full text-white">
      <div className="flex justify-between items-center">
        {/* Left: Hamburger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="hover:bg-blue-600 p-2 rounded focus:outline-none transition"
            aria-label="Menu"
          >
            <FaBars size={20} />
          </button>

          {dropdownOpen && (
            <div className="top-full left-0 absolute bg-white shadow-lg mt-2 rounded-md w-48 overflow-hidden text-black animate-fadeIn">
              <ul className="text-sm">
                <li className="hover:bg-gray-100 cursor-pointer">
                  <Link
                    to="/mobile/dashboard"
                    className="flex items-center gap-2 px-4 py-3"
                  >
                    <FaHome size={14} />
                    Home
                  </Link>
                </li>
                <li className="flex items-center gap-2 hover:bg-gray-100 px-4 py-3 cursor-pointer">
                  <FaUser size={14} />
                  Profile
                </li>
                <li className="flex items-center gap-2 hover:bg-gray-100 px-4 py-3 cursor-pointer">
                  <FaKey size={14} />
                  Change Password
                </li>
                <li
                  className="flex items-center gap-2 hover:bg-gray-100 px-4 py-3 cursor-pointer"
                  onClick={logoutHandler}
                >
                  <FaSignOutAlt size={14} />
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Center: ULB Name */}
        <div className="flex-1 ml-2 font-semibold text-base text-center truncate">
          {ulbData?.ulbName || "Loading..."}
        </div>

        {/* Right: Search */}
        <div>
          <button
            className="hover:bg-blue-600 p-2 rounded focus:outline-none transition"
            aria-label="Search"
          >
            <FaSearch size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
