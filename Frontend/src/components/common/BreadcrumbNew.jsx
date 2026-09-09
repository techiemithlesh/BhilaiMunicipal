import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { getUserDetails } from "../../utils/auth";
import { useMenu } from "./MenuContext";

const BREADCRUMB_KEY = "lastBreadcrumbPath";

const BreadcrumbNew = () => {
  const location = useLocation();
  const { currentMenu } = useMenu();
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    const userData = getUserDetails();
    if (!userData || !userData.permittedMenu) {
      setBreadcrumbs([]);
      return;
    }

    const menuData = userData.permittedMenu;
    const currentPath = location.pathname;

    let currentPageMenu = menuData.find((item) => item.url === currentPath);
    let breadcrumbPath = [];

    if (currentPageMenu) {
      breadcrumbPath.unshift(
        currentMenu?.url === currentPageMenu.url ? currentMenu : currentPageMenu
      );
      while (currentPageMenu && currentPageMenu.parentId > 0) {
        const parent = menuData.find(
          (item) => item.id === currentPageMenu.parentId
        );
        if (parent) {
          breadcrumbPath.unshift(parent);
          currentPageMenu = parent;
        } else break;
      }
    } else {
      const saved = localStorage.getItem(BREADCRUMB_KEY);
      if (saved) {
        breadcrumbPath = JSON.parse(saved);
      }
    }

    if (breadcrumbPath.length > 0) {
      setBreadcrumbs(breadcrumbPath);
      localStorage.setItem(BREADCRUMB_KEY, JSON.stringify(breadcrumbPath));
    }
  }, [location.pathname, currentMenu]);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 bg-white shadow-sm px-6 py-2 border border-gray-200 rounded-lg font-medium text-[15px] text-gray-700">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.id || index} className="flex items-center gap-2">
          <Link
            to={crumb.url}
            className={`hover:text-blue-700 transition-colors duration-150 ${
              index === breadcrumbs.length - 1
                ? "text-blue-700 font-semibold"
                : "text-blue-500"
            }`}
            target={crumb.openInNewTab ? "_blank" : "_self"}
            rel={crumb.openInNewTab ? "noopener noreferrer" : undefined}
          >
            {crumb.menuName}
          </Link>
          {index < breadcrumbs.length - 1 && (
            <svg
              className="w-4 h-4 text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </span>
      ))}
    </nav>
  );
};

export default BreadcrumbNew;
