import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

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

const RecursiveMenu_old = ({ items, isCollapsed }) => {
  const [openItems, setOpenItems] = useState({});
  const location = useLocation();

  // Watch for pathname or menu update
  useEffect(() => {
    if (!isCollapsed) {
      const activePaths = findActivePaths(items, location.pathname);
      const openState = {};
      activePaths.forEach((title) => {
        openState[title] = true;
      });
      setOpenItems(openState);
    }
  }, [location.pathname, items, isCollapsed]);

  // Collapse all when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setOpenItems({});
    }
  }, [isCollapsed]);

  const toggleItem = (title) => {
    setOpenItems((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (link) => {
    return (
      link &&
      new URL(link, window.location.origin).pathname === location.pathname
    );
  };

  return (
    <ul
      className={`${
        !isCollapsed ? "items-start" : "items-center"
      } flex flex-col justify-center gap-2 w-full font-medium text-gray-700 dark:text-gray-200 text-sm`}
    >
      {items.map((item) => (
        <li className="flex flex-col gap-y-1 w-full" key={item.title}>
          <div
            onClick={() => item.subItems && toggleItem(item.title)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              !isCollapsed ? "justify-between" : "justify-center"
            } ${
              openItems[item.title]
                ? "bg-gray-100 dark:bg-gray-700 font-bold"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="text-base">{item.icon}</span>}
              {!isCollapsed &&
                (item.link ? (
                  <Link
                    to={item.link}
                    className={`${
                      isActive(item.link)
                        ? "text-blue-600 font-bold dark:text-blue-300"
                        : "hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span>{item.title}</span>
                ))}
            </div>
            {item.subItems && !isCollapsed && (
              <motion.span
                className={`transition-transform duration-200 ${
                  openItems[item.title] ? "rotate-180" : ""
                }`}
              >
                {openItems[item.title] ? <FaChevronDown /> : <FaChevronRight />}
              </motion.span>
            )}
          </div>

          {item.subItems && openItems[item.title] && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-6 overflow-hidden"
            >
              <RecursiveMenu_old items={item.subItems} isCollapsed={isCollapsed} />
            </motion.div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default RecursiveMenu_old;
