import Cookies from "js-cookie";

export const isAuthenticated = () => {
  const token = Cookies.get("token");
  const userDetails = getUserDetails();
  // Add your token expiry/validity check here
  if(!token || !userDetails || !userDetails?.ulbId){
    return false;
  }
  return true;
};

export const isCitizenAuthenticated = () => {
  const token = Cookies.get("token");
  const userDetails = getUserDetails();
  // Add your token expiry/validity check here
  if (!token || !userDetails){
    return false;
  }
  return true;
};

// export function clearAuth() {
//   localStorage.removeItem("token");
//   localStorage.removeItem("userDetails");
//   // Remove cookies if you use them
// }

export function clearAuth() {
  Cookies.remove("token");
  localStorage.removeItem("userDetails");
  // Remove cookies if you use them
}

export const setAuthToken = (token, userDetails) => {
  Cookies.set("token", token, { expires: 1 });
  localStorage.setItem("userDetails", JSON.stringify(userDetails));
};

export const removeAuthToken = () => {
  Cookies.remove("token");
};

export const getToken = () => {
  return Cookies.get("token");
};

export const getLoginType = () => {
  return getUserDetails()?.loginType;
};

export const getUserDetails = () => {
  return JSON.parse(localStorage.getItem("userDetails"));
};

export const setWithExpiry = (key, value, ttlMinutes) => {
  const now = new Date();
  const ttlMilliseconds = ttlMinutes * 60 * 1000;

  // 'item' is an object which stores the value and the expiry time.
  const item = {
    value: value,
    expiry: now.getTime() + ttlMilliseconds,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);

  // If the item doesn't exist, return null
  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();

  // Compare the expiry time with the current time
  if (now.getTime() > item.expiry) {
    // If the item is expired, remove it from localStorage and return null
    removeStoreData(key);
    return null;
  }
  return item.value;
};

export const removeStoreData = (key) => {
  localStorage.removeItem(key);
};
