import { format } from "date-fns";
import { useEffect, useState, useRef } from "react";

const Header = ({ ulbData }) => {
  const [currentDateTime, setCurrentDateTime] = useState(
    format(new Date(), "eeee, yyyy-MM-dd HH:mm:ss")
  );
  
  // Initialize as false to prevent hydration mismatch, or true if you want it visible initially
  const [showTopBar, setShowTopBar] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Use a ref to track the last scroll position without triggering re-renders
  const lastScrollY = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(format(new Date(), "eeee, yyyy-MM-dd HH:mm:ss"));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      
      // 1. Handle Transparency (Sub Header)
      // We add a small buffer (10px) to prevent flickering at the very top
      if (currentScroll > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // 2. Handle Top Bar Hiding (Smart Hysteresis)
      // Only toggle if the difference is significant (>10px) to stop jitter
      const diff = Math.abs(currentScroll - lastScrollY.current);
      
      if (diff > 10) { 
        if (currentScroll > lastScrollY.current && currentScroll > 60) {
          // Scrolling DOWN -> Hide Top Bar
          setShowTopBar(false);
        } else if (currentScroll < lastScrollY.current) {
          // Scrolling UP -> Show Top Bar
          setShowTopBar(true);
        }
      }

      lastScrollY.current = currentScroll;
    };

    // Optimization: Use requestAnimationFrame for smoother performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ✅ TOP HEADER 
          Fix: Removed 'h-0'. Instead, we use negative margin ('-mt-10') or just translate.
          Using 'absolute' or 'fixed' here prevents the SubHeader from jumping when this hides.
      */}
      <div
        className={`w-full z-50 transition-all duration-500 ease-in-out bg-header text-main border-b border-border-color-light relative
        ${showTopBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 absolute top-0 left-0 w-full pointer-events-none"}`}
      >
        <div className="flex justify-between items-center px-4 md:px-6 py-2 text-sm">
          <div className="flex items-center space-x-3">
            <a href="/citizen/auth" className="hover:text-accent">Citizen Login</a>
            <span>|</span>
            <a href="/login" className="hover:text-accent">Official Login</a>
          </div>
          <span className="bg-white/10 shadow-md backdrop-blur-sm px-4 py-1 border border-white/20 rounded-xl font-medium text-white text-sm">
            {currentDateTime}
          </span>
        </div>
      </div>

      {/* ✅ SUB HEADER 
          Fix: Added 'bg-white/0' to ensure smooth transition from transparent to color.
      */}
      <div
        className={`z-40 border-b sticky top-0 transition-colors duration-500 ease-in-out
          ${isScrolled 
            ? "bg-sub-header-blur border-transparent backdrop-blur-none" // Transparent
            : "bg-sub-header border-border-color-light shadow-md" // Solid
          }
        `}
      >
        <div className="flex items-center space-x-5 px-4 md:px-6 py-2">
          <div className="flex items-center space-x-5">
            <a href="/">
              <img src={ulbData?.logoImg} alt={ulbData?.shortName} width={60} height={60} className="shadow rounded-full" />
            </a>
            <div>
              <h1 className="font-bold text-xl md:text-3xl">{ulbData?.ulbName}</h1>
              <p className="text-sm md:text-lg">{ulbData?.hindiUlbName}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;