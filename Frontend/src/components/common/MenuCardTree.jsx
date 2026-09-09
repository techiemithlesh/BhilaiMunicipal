import { useState } from "react";
import * as Icons from "react-icons/fa";
import { Link } from "react-router-dom";

const MenuCardTree = ({ menuItems }) => {
  const [activeMenuItems, setActiveMenuItems] = useState(menuItems);
  const [menuStack, setMenuStack] = useState([]);

  const handleItemClick = (item) => {
    if (item.children && item.children.length) {
      setMenuStack((prev) => [...prev, activeMenuItems]);
      setActiveMenuItems(item.children);
    }
  };

  const handleBack = () => {
    if (menuStack.length) {
      const previous = [...menuStack];
      const last = previous.pop();
      setMenuStack(previous);
      setActiveMenuItems(last);
    }
  };

  return (
    <div className="relative p-3">
      {menuStack.length > 0 && (
        <button
          onClick={handleBack}
          className="top-2 right-2 absolute flex items-center text-blue-600 hover:text-blue-800 text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            width="20"
            height="20"
            className="mr-1"
          >
            <path
              fill="currentColor"
              d="M9.4 231.4L161.4 79.4c15.1-15.1 41-4.4 41 17v66.9c144.7 0 233 35.4 281.6 112.4 13.8 21.9-12.7 45.4-33.1 30.5C389.9 264 320.2 239.4 202.4 239.4v66.9c0 21.4-25.9 32.1-41 17L9.4 231.4z"
            />
          </svg>
          Back
        </button>
      )}

      <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mt-8">
        {activeMenuItems.map((item) => {
          const Icon =
            item.icon && Icons[item.icon]
              ? Icons[item.icon]
              : Icons.FaRegSquare;

          const cleanedUrl = item.url?.trim().replace(/^\/+/, "") ?? "#";

          return (
            <div
              key={item.menuId}
              className="group relative flex flex-col justify-center items-center bg-white shadow hover:shadow-md p-4 rounded-xl h-32 text-center transition duration-300 cursor-pointer"
              onClick={() => {
                if (item.children && item.children.length) {
                  handleItemClick(item);
                }
              }}
            >
              {item.children && item.children.length > 0 && (
                <>
                  <div className="top-2 right-2 absolute text-gray-500">
                    <Icons.FaEllipsisV />
                  </div>
                  <div className="hidden group-hover:block top-10 right-2 z-50 absolute bg-white shadow p-2 border rounded w-40 text-left">
                    {item.children.map((child) => (
                      <Link
                        key={child.menuId}
                        to={`/${child.url?.trim().replace(/^\/+/, "")}`}
                        className="block hover:bg-gray-100 px-2 py-1 rounded text-gray-700 text-sm"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {!item.children || !item.children.length ? (
                <Link
                  to={`/${cleanedUrl}`}
                  className="flex flex-col justify-center items-center text-center"
                >
                  <Icon className="mb-2 text-blue-600 text-3xl" />
                  <span className="font-semibold text-gray-800 text-base">
                    {item.name}
                  </span>
                </Link>
              ) : (
                <>
                  <Icon className="mb-2 text-blue-600 text-3xl" />
                  <span className="font-semibold text-gray-800 text-base">
                    {item.name}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuCardTree;
