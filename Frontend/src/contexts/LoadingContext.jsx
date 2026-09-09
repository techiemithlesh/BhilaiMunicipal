import { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [isLoadingGable, setIsLoadingGable] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoadingGable, setIsLoadingGable }}>
      {children}
    </LoadingContext.Provider>
  );
};
