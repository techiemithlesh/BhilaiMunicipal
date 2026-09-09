import { Spinner } from "@nextui-org/react";
import { useLoading } from "../../contexts/LoadingContext";

const LoadingOverlay = () => {
  const { isLoadingGable } = useLoading();

  if (!isLoadingGable) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
      <Spinner size="lg" color="white" />
    </div>
  );
};

export default LoadingOverlay;
