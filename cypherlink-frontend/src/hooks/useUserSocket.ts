import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../services/socket";
import { useAuthStore } from "../store/authStore";

type IncomingMessage = {
  id: string;
  conversationId?: string;
  senderId?: string;
  body?: string;
  content?: string;
  createdAt?: string;
};

type ThreadCache = {
  items: Array<{
    id: string;
    senderId: string;
    sender?: unknown;
    content: string;
    createdAt: string;
    intent?: string | null;
    readAt?: string | null;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
};

// Singleton store for socket connection status so any component can read it
// without each one wiring its own listener.
let connectionStatus: "connecting" | "online" | "offline" = "connecting";
const statusListeners = new Set<(s: typeof connectionStatus) => void>();
function setStatus(next: typeof connectionStatus) {
  if (next === connectionStatus) return;
  connectionStatus = next;
  for (const l of statusListeners) l(next);
}

export function useSocketStatus() {
  const [status, setLocal] = useState(connectionStatus);
  useEffect(() => {
    statusListeners.add(setLocal);
    return () => {
      statusListeners.delete(setLocal);
    };
  }, []);
  return status;
}

export function useUserSocket() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setStatus("offline");
      return;
    }

    const socket = getSocket();

    const onConnect = () => setStatus("online");
    const onDisconnect = () => setStatus("offline");
    const onReconnectAttempt = () => setStatus("connecting");

    const onNotificationNew = () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };

    // Optimistic append: rather than refetching the whole thread on every
    // incoming message, splice the new one straight into the cache.
    const onMessageNew = (data: IncomingMessage) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (!data.conversationId) return;

      const key = ["messages", data.conversationId];
      const current = qc.getQueryData<ThreadCache>(key);

      if (!current) {
        // Thread not loaded yet — let the next visit fetch fresh.
        return;
      }

      // Dedup by id (handles double emissions on flaky networks).
      if (current.items.some((m) => m.id === data.id)) return;

      qc.setQueryData<ThreadCache>(key, {
        ...current,
        items: [
          ...current.items,
          {
            id: data.id,
            senderId: data.senderId ?? "",
            sender: {},
            content: data.content ?? data.body ?? "",
            createdAt: data.createdAt ?? new Date().toISOString(),
            intent: null,
            readAt: null,
          },
        ],
      });
    };

    const setup = () => {
      // Remove first to avoid duplicate listeners across reconnects.
      socket.off("notification:new", onNotificationNew);
      socket.off("message:new", onMessageNew);
      socket.on("notification:new", onNotificationNew);
      socket.on("message:new", onMessageNew);
      setStatus("online");
    };

    socket.off("connect", onConnect);
    socket.off("disconnect", onDisconnect);
    socket.io.off("reconnect_attempt", onReconnectAttempt);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    if (socket.connected) {
      setup();
    } else {
      setStatus("connecting");
      socket.once("connect", setup);
    }

    return () => {
      socket.off("notification:new", onNotificationNew);
      socket.off("message:new", onMessageNew);
      socket.off("connect", setup);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, [isLoggedIn, userId, qc]);
}
