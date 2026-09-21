import React, { createContext, useContext, useEffect, useState } from "react";
import { createEchoInstance } from "../utils/echo";
import { getUserDetails, getToken } from "../utils/auth";

const EchoContext = createContext(null);

export const EchoProvider = ({ children }) => {
  const [echo, setEcho] = useState(null);

  useEffect(() => {
    // Read directly inside useEffect to capture late/updated storage reads
    const profile = getUserDetails();
    const token = getToken() || localStorage.getItem("token");

    console.log("[EchoContext Init Check]", { userId: profile?.id, tokenExists: !!token });

    if (!profile?.id || !token) {
      console.warn("[EchoContext] Connection skipped: User ID or Token missing.");
      if (echo) {
        echo.disconnect();
        setEcho(null);
      }
      return;
    }

    console.log("[EchoContext] Creating global Echo WebSocket Connection...");
    const instance = createEchoInstance();
    setEcho(instance);

    return () => {
      console.log("[EchoContext] Disconnecting Echo...");
      instance.disconnect();
      setEcho(null);
    };
  }, []); // Run on mount (or add auth state dependency if using an AuthContext)

  return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>;
};

export const useEcho = () => useContext(EchoContext);