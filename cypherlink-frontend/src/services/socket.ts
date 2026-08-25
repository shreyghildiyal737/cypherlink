import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socket: Socket | null = null;

export function getSocket(token?: string) {
  if (!socket) {
    socket = io(import.meta.env.VITE_WS_URL ?? "http://localhost:3001", {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token: token ?? getAccessToken() ?? undefined },
      // Reconnect quietly but persistently. The default socket.io behavior is
      // already exponential with a cap; we tighten the bounds here so phones on
      // flaky networks don't sit idle for 5+ seconds between retries.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 6000,
      // Slight randomization so reconnect storms after server restart don't all
      // arrive at the same instant.
      randomizationFactor: 0.4,
      timeout: 12000,
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

// Called by the Axios interceptor after a silent token refresh. Updates
// socket.auth so the next reconnect uses the fresh token. If the socket is
// currently offline (disconnected while token was expiring), we cycle it
// immediately so it doesn't sit waiting with a stale credential.
export function updateSocketToken(token: string) {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
}
