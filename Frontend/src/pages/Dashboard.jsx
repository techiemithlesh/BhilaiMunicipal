import { Spinner } from "@nextui-org/react";
import ProfileCard from "../components/common/ProfileCard";
import WardList from "../components/common/WardList";
import useUserProfileAndWardMapped from "../hooks/UseUserProfile";
import AdminLayout from "../layout/AdminLayout";
import { useLoading } from "../contexts/LoadingContext";
import { useEffect } from "react";

const Dashboard = () => {
  const { profile, wardMapped, isLoading, error } =
    useUserProfileAndWardMapped();
  const { setIsLoadingGable } = useLoading();
  useEffect(() => {
    setIsLoadingGable(isLoading ? true : false);
  }, [isLoading]);

  if (isLoading)
    return (
      <div className="loading">
        <Spinner />
      </div>
    );

  if (error)
    return (
      <div className="error">
        <p>Error....</p>
      </div>
    );

  return (
    <AdminLayout>
      <div className="flex justify-evenly gap-10 bg-white shadow-md p-4 border rounded-lg">
        <ProfileCard user={profile} />
        <WardList wardMapped={wardMapped} />
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
