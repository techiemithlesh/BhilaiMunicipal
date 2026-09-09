// import Bowser from 'bowser';
// import axios from 'axios';

// export const getBrowserInfo = async () => {

//   const machine = navigator.userAgent;
//   const browser = Bowser.getParser(window.navigator.userAgent).getBrowserName();

//   const handleGeolocationSuccess = async (position) => {
//     const latitude = position.coords.latitude;
//     const longitude = position.coords.longitude;

//     const ipResponse = await axios.get('https://api.ipify.org?format=json');
//     const ip = ipResponse.data.ip;

//     const newBrowserInfo = {
//       latitude,
//       longitude,
//       machine,
//       browserName: browser,
//       ip
//     };

//     return newBrowserInfo;
//   };

//   const handleGeolocationError = async () => {
//     const ipResponse = await axios.get('https://api.ipify.org?format=json');
//     const ip = ipResponse.data.ip;

//     const newBrowserInfo = {
//       latitude: null,
//       longitude: null,
//       machine,
//       browserName: browser,
//       ip
//     };

//     return newBrowserInfo;
//   };

//   if ('geolocation' in navigator) {
//     return new Promise((resolve) => {
//       navigator.geolocation.getCurrentPosition(async (position) => {
//         resolve(await handleGeolocationSuccess(position));
//       }, async () => {
//         resolve(await handleGeolocationError());
//       });
//     });
//   } else {
//     return await handleGeolocationError();
//   }
// };

import Bowser from "bowser";
import axios from "axios";

export const getBrowserInfo = async () => {
  const userAgent = navigator.userAgent;
  const browserName = Bowser.getParser(userAgent).getBrowserName();

  const getLocation = () =>
    new Promise((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => {
            resolve({ latitude: null, longitude: null });
          }
        );
      } else {
        resolve({ latitude: null, longitude: null });
      }
    });

  const getIP = async () => {
    try {
      const response = await axios.get("https://ipapi.co/json/");
      return response.data.ip;
    } catch (err) {
      console.warn("IP fetch failed:", err.message);
      return "Unavailable";
    }
  };

  const location = await getLocation();
  const ip = await getIP();

  const browserInfo = {
    machine: userAgent,
    browserName,
    latitude: location.latitude,
    longitude: location.longitude,
    ip,
  };

  // Store in localStorage
  localStorage.setItem("browserInfo", JSON.stringify(browserInfo));

  return browserInfo;
};
