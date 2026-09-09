import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../utils/auth";

const useSearch = (url, method = "GET", requestBody = null, id = null) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    const token = getToken();

    const fetchSearchResult = async () => {
      setIsLoading(true);
      setErrors(null);

      try {
        let response;
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        if (method === "GET") {
          const getUrl = id ? `${url}/${id}` : url;
          response = await axios.get(getUrl, config);
        } else if (method === "POST") {
          response = await axios.post(url, requestBody, config);
        } else {
          throw new Error("Unsupported HTTP method");
        }

        setData(response.data);
      } catch (error) {
        setErrors(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResult();
  }, [url, method, requestBody, id]);

  return { data, isLoading, errors };
};

export default useSearch;
