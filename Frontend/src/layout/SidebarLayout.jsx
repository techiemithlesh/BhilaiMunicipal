import React, { useState, useEffect, useRef } from "react";
import {
  FaBars,
  FaChevronRight,
  FaChevronDown,
  FaTachometerAlt,
  FaBuilding,
  FaFileAlt,
} from "react-icons/fa";

export default function SidebarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const sidebarRef = useRef(null);

  const menuItems = [
    {
      label: "Dashboard",
      icon: <FaTachometerAlt />,
      href: "#",
    },
    {
      label: "Property",
      icon: <FaBuilding />,
      children: [
        { label: "Adjust Amount", href: "#" },
        { label: "SAF", href: "#" },
        { label: "GBSAF", href: "#" },
      ],
    },
    {
      label: "Reports",
      icon: <FaFileAlt />,
      href: "#",
    },
  ];

  // close sidebar when clicked outside (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex justify-between items-center bg-green-800 text-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FaBars className="text-xl" />
          </button>
          <h1 className="font-semibold text-lg">
            Ranchi Municipal Corporation
          </h1>
        </div>
        <div className="text-sm">Welcome, User</div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed md:static top-0 left-0 h-full bg-gray-900 text-white z-30 transition-all duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            ${collapsed ? "md:w-16" : "md:w-64"}
          `}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {!collapsed && <span className="text-lg font-semibold">Menu</span>}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block text-gray-400 hover:text-white"
            >
              {collapsed ? <FaChevronRight /> : <FaChevronDown />}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-2 space-y-1">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => setHoveredMenu(index)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                {/* Parent Menu */}
                <div
                  className={`flex justify-between items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-700 ${
                    hoveredMenu === index ? "bg-gray-800" : ""
                  }`}
                  onClick={() => {
                    // On mobile toggle submenu
                    if (window.innerWidth < 768 && item.children) {
                      setActiveMenu(activeMenu === index ? null : index);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.children && (
                    <FaChevronDown
                      className={`text-xs transition-transform duration-200 ${
                        activeMenu === index ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>

                {/* Desktop hover submenu (visible on hover) */}
                {!collapsed &&
                  item.children &&
                  hoveredMenu === index &&
                  window.innerWidth >= 768 && (
                    <div className="ml-10 mt-1 space-y-1 animate-fadeIn">
                      {item.children.map((child, subIndex) => (
                        <a
                          key={subIndex}
                          href={child.href}
                          className="block py-1 px-3 text-sm rounded hover:bg-gray-700"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}

                {/* Mobile submenu (visible on click) */}
                {activeMenu === index &&
                  item.children &&
                  window.innerWidth < 768 && (
                    <div className="ml-10 mt-1 space-y-1">
                      {item.children.map((child, subIndex) => (
                        <a
                          key={subIndex}
                          href={child.href}
                          className="block py-1 px-3 text-sm rounded hover:bg-gray-700"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}

                {/* Collapsed hover popup (desktop) */}
                {collapsed &&
                  hoveredMenu === index &&
                  item.children &&
                  window.innerWidth >= 768 && (
                    <div className="absolute left-full top-0 ml-1 bg-gray-800 rounded-md shadow-lg w-44 py-2 animate-fadeIn">
                      {item.children.map((child, subIndex) => (
                        <a
                          key={subIndex}
                          href={child.href}
                          className="block px-3 py-2 text-sm hover:bg-gray-700 whitespace-nowrap"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-40 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-4 overflow-y-auto">
          {children || (
            <>
              <h2 className="text-xl font-semibold mb-2">Dashboard Content</h2>
              <p className="text-gray-600">
                Sidebar opens submenus on <b>mouse hover</b> — and collapses like Jharkhand e-Municipality.
              </p>
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t text-center text-gray-600 text-sm py-2">
        © {new Date().getFullYear()} My Company. All rights reserved.
      </footer>
    </div>
  );
}