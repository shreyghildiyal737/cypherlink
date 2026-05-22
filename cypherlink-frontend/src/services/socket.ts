import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";
let socket: Socket | null = null;
export function getSocket(token?: string) {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3001", {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token: token ?? getAccessToken() ?? undefined },
    });
  }
  return socket;
}
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
