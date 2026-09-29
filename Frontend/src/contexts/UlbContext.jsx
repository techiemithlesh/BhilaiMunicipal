import { createContext, useContext } from "react";

const UlbContext = createContext(null);

export const useUlb = () => useContext(UlbContext);

export const UlbProvider = ({ value, children }) => {
  return <UlbContext.Provider value={value}>{children}</UlbContext.Provider>;
};
