import {io} from "socket.io-client";

const SOCKET_URL=import.meta.env.VITE_SOCKET_URL;

if (!SOCKET_URL)
{
    throw new Error("❌ VITE_SOCKET_URL is not defined");
}

export const socket=io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false, // 🔑 IMPORTANT
    transports: ["polling", "websocket"], // 🔑 IMPORTANT
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
});

/* ---------- Events ---------- */

socket.on("connect", () =>
{
    console.log("🟢 Socket connected:", socket.id);
});

socket.on("disconnect", (reason) =>
{
    console.log("🔴 Socket disconnected:", reason);
});

socket.on("connect_error", (error) =>
{
    console.error("❌ Socket connection error:", error.message);
});
