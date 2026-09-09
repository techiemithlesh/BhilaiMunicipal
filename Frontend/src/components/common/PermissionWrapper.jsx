import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPermissionsByUrl } from "../../utils/common";

const PermissionWrapper = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  useEffect(() => {
    const { read, write, update, delete: canDelete } = getPermissionsByUrl(currentPath);

    const toggleButton = (selector, allowed) => {
      document.querySelectorAll(`button.${selector}, a.${selector}, input.${selector}`)
        .forEach(el => {
          if (!allowed) {
            el.disabled = true;
            el.classList.add("opacity-50", "cursor-not-allowed");
          } else {
            el.disabled = false;
            el.classList.remove("opacity-50", "cursor-not-allowed");
          }
        });
    };

    toggleButton("read", read);
    toggleButton("write", write);
    toggleButton("edit", update);
    toggleButton("delete", canDelete);

  }, [currentPath]);

  return <>{children}</>;
};

export default PermissionWrapper;
