import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, Fragment } from "react";
import {
  FiHome,
  FiFileText,
  FiDroplet,
  FiBriefcase,
  FiTrash,
  FiSearch,
  FiPlusCircle,
  FiEdit,
  FiXCircle,
  FiLayout,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

const iconMap = {
  Dashboard: <FiLayout className="w-4 h-4" />,
  "My Application": <FiFileText className="w-4 h-4" />,
  Property: <FiHome className="w-4 h-4" />,
  Saf: <FiHome className="w-4 h-4" />,
  "Apply Saf": <FiPlusCircle className="w-4 h-4" />,
  Search: <FiSearch className="w-4 h-4" />,
  Water: <FiDroplet className="w-4 h-4" />,
  "Pay Water Tax": <FiFileText className="w-4 h-4" />,
  "Apply Water Connection": <FiPlusCircle className="w-4 h-4" />,
  Trade: <FiBriefcase className="w-4 h-4" />,
  "Apply License": <FiPlusCircle className="w-4 h-4" />,
  "Renew License": <FiEdit className="w-4 h-4" />,
  "Surrender License": <FiXCircle className="w-4 h-4" />,
  "Solid Waste": <FiTrash className="w-4 h-4" />,
  "Apply Waste": <FiPlusCircle className="w-4 h-4" />,
  "Pay Tax": <FiFileText className="w-4 h-4" />,
};

const CitizenSidebar = ({ menuItems, onItemClick }) => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // Automatically open parent menus based on current path
  useEffect(() => {
    const openState = {};

    const checkAndExpand = (items, parentLabels = []) => {
      items.forEach((item) => {
        if (item.children) {
          checkAndExpand(item.children, [...parentLabels, item.label]);

          // Only expand if current path starts with a child path
          const isActive = item.children.some(
            (child) => child.path && location.pathname.startsWith(child.path)
          );
          if (isActive) {
            parentLabels.forEach((lbl) => (openState[lbl] = true));
            openState[item.label] = true;
          }
        } else if (location.pathname === item.path) {
          // Only expand parents for this exact leaf
          parentLabels.forEach((lbl) => (openState[lbl] = true));
        }
      });
    };

    checkAndExpand(menuItems);
    setOpenMenus(openState);
  }, [location.pathname, menuItems]);

  const toggleMenu = (label, children = [], siblings = []) => {
    setOpenMenus((prev) => {
      let newState = { ...prev };
      const isCurrentlyOpen = !!prev[label];

      // If opening: close all siblings first (mutual exclusivity)
      if (!isCurrentlyOpen && siblings.length > 0) {
        siblings.forEach((sibling) => {
          if (sibling.label !== label) {
            newState[sibling.label] = false;
            if (sibling.children) {
              const closeNested = (items) => {
                items.forEach((child) => {
                  newState[child.label] = false;
                  if (child.children) closeNested(child.children);
                });
              };
              closeNested(sibling.children);
            }
          }
        });
      }

      // Toggle this menu
      newState[label] = !isCurrentlyOpen;

      // If closing parent -> close ALL its children
      if (isCurrentlyOpen && children.length > 0) {
        const closeNested = (items) => {
          items.forEach((child) => {
            newState[child.label] = false;
            if (child.children) closeNested(child.children);
          });
        };
        closeNested(children);
      }

      return newState;
    });
  };

  // Recursive renderer
  const renderMenu = (items, level = 0) => {
    return (
      <ul className={`space-y-1 ${level > 0 ? "mt-1 pl-6" : ""}`}>
        {items.map((item, idx) => {
          const isActive = location.pathname === item.path;
          const isOpen = openMenus[item.label];

          return (
            <li key={`${item.label}-${idx}`}>
              {item.children ? (
                <Fragment>
                  <button
                    onClick={() => toggleMenu(item.label, item.children, items)}
                    className={`flex justify-between items-center px-4 py-2 rounded-lg w-full text-left transition-all duration-200 ${
                      isOpen
                        ? "font-bold bg-gray-100 dark:bg-gray-700"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {iconMap[item.label] || (
                        <FiFileText className="w-4 h-4" />
                      )}
                      {item.label}
                    </span>
                    {isOpen ? (
                      <FiChevronDown className="w-4 h-4" />
                    ) : (
                      <FiChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {renderMenu(item.children, level + 1)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Fragment>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => {
                    if (onItemClick) onItemClick(); // CLOSE SIDEBAR ON MOBILE
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "font-bold text-blue-600 bg-blue-100 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {iconMap[item.label] || <FiFileText className="w-4 h-4" />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-blue-100 dark:bg-gray-700 ml-auto px-2 py-0.5 rounded-full font-medium text-blue-800 dark:text-gray-300 text-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <nav className="space-y-1 font-medium text-gray-700 dark:text-gray-200 text-sm">
      {renderMenu(menuItems)}
    </nav>
  );
};

export default CitizenSidebar;
