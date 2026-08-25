import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";

interface ActivityItem {
  type: "checkin";
  displayName?: string;
  timestamp: string;
}

export interface CypherLiveState {
  pullingUp: number | null;
  spotsLeft: number | null;
  state: string | null;
  activity: ActivityItem[];
}

export function useCypherSocket(cypherId: string | undefined): CypherLiveState {
  const [live, setLive] = useState<CypherLiveState>({
    pullingUp: null,
    spotsLeft: null,
    state: null,
    activity: [],
  });

  useEffect(() => {
    if (!cypherId) return;
    const socket = getSocket();

    const join = () => {
      socket.emit("join:cypher", { cypherId });
    };

    const onRsvpUpdated = (data: { cypherId: string; pullingUp: number; spotsLeft: number }) => {
      if (data.cypherId !== cypherId) return;
      setLive((prev) => ({ ...prev, pullingUp: data.pullingUp, spotsLeft: data.spotsLeft }));
    };

    const onStateChanged = (data: { cypherId: string; state: string }) => {
      if (data.cypherId !== cypherId) return;
      setLive((prev) => ({ ...prev, state: data.state }));
    };

    const onCheckinConfirmed = (data: { cypherId: string; displayName: string }) => {
      if (data.cypherId !== cypherId) return;
      setLive((prev) => ({
        ...prev,
        activity: [
          { type: "checkin", displayName: data.displayName, timestamp: new Date().toISOString() },
          ...prev.activity.slice(0, 19),
        ],
      }));
    };

    // Remove first to be safe across reconnects.
    socket.off("cypher:rsvp_updated", onRsvpUpdated);
    socket.off("cypher:state_changed", onStateChanged);
    socket.off("cypher:checkin_confirmed", onCheckinConfirmed);
    socket.on("cypher:rsvp_updated", onRsvpUpdated);
    socket.on("cypher:state_changed", onStateChanged);
    socket.on("cypher:checkin_confirmed", onCheckinConfirmed);

    // Join now if possible; otherwise wait for connect (and rejoin on every
    // reconnect — socket.io leaves rooms on disconnect).
    if (socket.connected) join();
    socket.on("connect", join);

    return () => {
      try {
        if (socket.connected) socket.emit("leave:cypher", { cypherId });
      } catch {}
      socket.off("cypher:rsvp_updated", onRsvpUpdated);
      socket.off("cypher:state_changed", onStateChanged);
      socket.off("cypher:checkin_confirmed", onCheckinConfirmed);
      socket.off("connect", join);
    };
  }, [cypherId]);

  return live;
}
