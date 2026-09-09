import { useEffect, useState } from "react";
import * as FaIcons from "react-icons/fa";
import * as Fa6Icons from "react-icons/fa6";
import * as GiCash from "react-icons/gi";
import { hostInfo } from "../utils/common";
import RecursiveMenu from "../components/specific/RecursiveMenu";

const iconLibraries = {
  Fa: FaIcons,
  Fa6: Fa6Icons,
  Gi: GiCash,
};

const getAnyIcon = (iconName) => {
  if (!iconName) return <FaIcons.FaCogs />;
  const prefix = iconName.slice(0, 2);
  const lib = iconLibraries[prefix];
  const IconComponent = lib?.[iconName] || FaIcons.FaCogs;
  return <IconComponent />;
};

const AdminSidebar = ({
  sidebarRef,
  isCollapsed,
  setIsCollapsed,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const [menuItems, setMenuItems] = useState([]);
  const host = hostInfo();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userDetails"));
    if (user?.menuTree) {
      const mappedMenu = mapMenuTreeToMenuItems(user.menuTree);
      setMenuItems(mappedMenu);
    }
  }, []);

  const mapMenuTreeToMenuItems = (menuTree) =>
    menuTree.map((menu) => ({
      title: menu.name,
      icon: getAnyIcon(menu.icon),
      link:
        menu.url && menu.url !== "#"
          ? `${host}/${menu.url.trim().replace(/^\/+/, "")}`
          : undefined,
      subItems: menu.children?.length
        ? mapMenuTreeToMenuItems(menu.children)
        : undefined,
    }));

  return (
    <aside
      ref={sidebarRef}
      className={`
        fixed top-20 left-0 
        h-[calc(100vh-80px)]        /* full height below header */
        overflow-y-scroll scrollbar-hide
        bg-gray-900 text-white z-30
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0 w-96" : "-translate-x-full w-96"}
        md:static md:translate-x-0
        ${isCollapsed ? "md:w-16" : "md:w-64"}
      `}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <span className="text-lg font-semibold tracking-wide"></span>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block text-gray-400 hover:text-white"
        >
          {isCollapsed ? (
            <FaIcons.FaChevronRight />
          ) : (
            <FaIcons.FaChevronDown />
          )}
        </button>
      </div>

      {/* Menu */}
      <div className="p-2">
        <RecursiveMenu items={menuItems} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};

export default AdminSidebar;
