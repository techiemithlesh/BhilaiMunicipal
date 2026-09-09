import axios from "axios";
import { getToken } from "./auth";

export const fetcher = async (url) => {
  const token = getToken();

  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.error("Response data: ", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};
