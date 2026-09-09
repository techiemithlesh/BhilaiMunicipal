// ForceSingleTab.js
import { useEffect } from "react";

const ForceSingleTab = () => {
  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest("a");
      if (target && target.getAttribute("target") === "_blank") {
        e.preventDefault(); // Stop new tab
        window.location.href = target.href; // Open in same tab
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
};

export default ForceSingleTab;
