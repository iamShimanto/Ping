import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string;

// Singleton — created once, connected/disconnected on demand
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,   // sends jwt_access cookie automatically
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});
