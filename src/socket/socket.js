import {io} from "socket.io-client";

// Socket.IO configuration for production
const SOCKET_URL=import.meta.env.VITE_SOCKET_URL||"http://localhost:3000";

export const socket=io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ["websocket", "polling"],
});

// Connection event handlers
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

socket.on("reconnect", (attemptNumber) =>
{
    console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_attempt", (attemptNumber) =>
{
    console.log("🔄 Socket reconnection attempt:", attemptNumber);
});

socket.on("reconnect_error", (error) =>
{
    console.error("❌ Socket reconnection error:", error.message);
});

socket.on("reconnect_failed", () =>
{
    console.error("❌ Socket reconnection failed after all attempts");
});
