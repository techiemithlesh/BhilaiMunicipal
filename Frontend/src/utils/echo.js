import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getToken } from "./auth";
import { QueryBroadcastAuthApi } from "../api/endpoints";

window.Pusher = Pusher;

export const createEchoInstance = () => {
  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const token = getToken() || localStorage.getItem("token");

        fetch(QueryBroadcastAuthApi, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`Auth status ${res.status}`);
            return res.json();
          })
          .then((data) => callback(false, data))
          .catch((err) => callback(true, err));
      },
    }),
  });
};