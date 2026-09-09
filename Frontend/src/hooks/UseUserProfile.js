import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";
import { usrProfileApi } from "../api/endpoints";

const useUserProfileAndWardMapped = () => {
  const [profile, setProfile] = useState(null);
  const [wardMapped, setWardMapped] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfileAndWardMapped = async () => {
      const token = getToken();

      try {
        const response = await axios.post(usrProfileApi, {}, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });
        const data = response.data.data;
        setProfile(data);
        setWardMapped(data.wardPermission);
        setIsLoading(false);
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    };

    fetchUserProfileAndWardMapped();
  }, []);

  return { profile, wardMapped, isLoading, error };
};

export default useUserProfileAndWardMapped;
