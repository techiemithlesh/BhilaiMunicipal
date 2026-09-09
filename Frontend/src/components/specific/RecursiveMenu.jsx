import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

const findActivePaths = (items, pathname, parents = []) => {
  for (let item of items) {
    if (
      item.link &&
      new URL(item.link, window.location.origin).pathname === pathname
    ) {
      return [...parents, item.title];
    }
    if (item.subItems) {
      const found = findActivePaths(item.subItems, pathname, [
        ...parents,
        item.title,
      ]);
      if (found.length) return found;
    }
  }
  return [];
};

const RecursiveMenu = ({ items, isCollapsed, level = 0 }) => {
  const [openItems, setOpenItems] = useState({});
  const [hovered, setHovered] = useState(null);
  const location = useLocation();

  // open active menu path when sidebar expanded
  useEffect(() => {
    if (!isCollapsed) {
      const activePaths = findActivePaths(items, location.pathname);
      const openState = {};
      activePaths.forEach((title) => (openState[title] = true));
      setOpenItems(openState);
    }
  }, [location.pathname, items, isCollapsed]);

  // collapse all when sidebar collapsed
  useEffect(() => {
    if (isCollapsed) setOpenItems({});
  }, [isCollapsed]);

  const toggleItem = (title) => {
    setOpenItems((prev) => {
      const isAlreadyOpen = !!prev[title];

      const newState = {};
      if (!isAlreadyOpen) {
        newState[title] = true;
      }

      return newState;
    });
  };

  const isActive = (link) =>
    link &&
    new URL(link, window.location.origin).pathname === location.pathname;

  return (
    <ul
      className={`flex flex-col w-full text-sm font-medium text-gray-200 ${
        isCollapsed ? "items-center" : "items-start"
      }`}
    >
      {items.map((item) => (
        <li
          key={item.title}
          className="relative w-full"
          onMouseEnter={() => isCollapsed && setHovered(item.title)}
          onMouseLeave={() => isCollapsed && setHovered(null)}
        >
          {/* === MENU ITEM === */}
          <div
            className={`flex items-center w-full gap-2 p-2 rounded-md transition-all duration-200 cursor-pointer 
              hover:bg-gray-700
              ${
                openItems[item.title]
                  ? "bg-gray-800 text-white font-semibold"
                  : "text-gray-300"
              }
              ${isCollapsed ? "justify-center" : "justify-between"}
            `}
          >
            {/* Left side (icon + text) */}
            {item.link ? (
              <Link
                to={item.link}
                className="flex items-center gap-3 flex-1"
                onClick={(e) => {
                  // prevent collapsing toggle from triggering navigation
                  e.stopPropagation();
                }}
              >
                {item.icon && <span className="text-lg">{item.icon}</span>}
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            ) : (
              <div
                className="flex items-center gap-3 flex-1"
                onClick={() =>
                  !isCollapsed && item.subItems && toggleItem(item.title)
                }
              >
                {item.icon && <span className="text-lg">{item.icon}</span>}
                {!isCollapsed && <span>{item.title}</span>}
              </div>
            )}

            {/* Right side: toggle arrow only if subItems exist */}
            {item.subItems && !isCollapsed && (
              <motion.span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.title);
                }}
                animate={{
                  rotate: openItems[item.title] ? 180 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="cursor-pointer"
              >
                <FaChevronDown className="text-xs" />
              </motion.span>
            )}
          </div>

          {/* --- Expanded submenu (when expanded) --- */}
          {!isCollapsed && item.subItems && openItems[item.title] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-5 overflow-hidden"
            >
              <RecursiveMenu
                items={item.subItems}
                isCollapsed={isCollapsed}
                level={level + 1}
              />
            </motion.div>
          )}

          {/* --- Flyout submenu (when collapsed) --- */}
          {isCollapsed && hovered === item.title && item.subItems && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full top-0 ml-1 bg-gray-800 rounded-md shadow-lg w-48 py-2 z-[9999]"
            >
              <RecursiveMenu
                items={item.subItems}
                isCollapsed={false}
                level={level + 1}
              />
            </motion.div>
          )}

          {/* --- Tooltip for items without children (when collapsed) --- */}
          {isCollapsed && hovered === item.title && !item.subItems && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-md shadow-lg whitespace-nowrap z-50"
            >
              {item.title}
            </motion.div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default RecursiveMenu;
