import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/authStore";

type IncomingNotification = {
  id?: string;
  type?: string;
  title?: string;
  body?: string;
  message?: string;
  referenceId?: string | null;
};

const TYPE_HREF: Record<string, (refId?: string | null) => string | null> = {
  CHECKIN_CONFIRMED: (id) => (id ? `/cyphers/${id}` : null),
  CYPHER_REMINDER: (id) => (id ? `/cyphers/${id}` : null),
  MESSAGE_REQUEST: () => "/messages",
  FOLLOW: () => null,
  MENTION: () => null,
  PROJECT_UPDATE: (id) => (id ? `/projects/${id}` : null),
  COLLAB_INVITE: (id) => (id ? `/projects/${id}` : null),
  VERIFICATION_STATUS: () => "/notifications",
};

export function NotificationToast() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [active, setActive] = useState<IncomingNotification | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    const socket = getSocket();

    const onNotificationNew = (n: IncomingNotification) => {
      setActive(n);
    };

    socket.off("notification:new", onNotificationNew);
    socket.on("notification:new", onNotificationNew);

    return () => {
      socket.off("notification:new", onNotificationNew);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(null), 5000);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!active) return null;

  const href = active.type
    ? (TYPE_HREF[active.type]?.(active.referenceId) ?? null)
    : null;
  const body = active.body ?? active.message ?? "";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2 px-4"
      style={{
        bottom: "calc(6rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="glass-panel pointer-events-auto max-w-sm rounded-2xl border border-white/[0.12] px-4 py-3 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            {active.title && (
              <p className="truncate font-body-md text-sm font-semibold text-on-surface">
                {active.title}
              </p>
            )}
            {body && (
              <p className="mt-0.5 line-clamp-2 font-body-md text-xs text-on-surface-variant/65">{body}</p>
            )}
            {href && (
              <Link
                to={href}
                onClick={() => setActive(null)}
                className="mt-1 inline-block font-label-sm text-xs font-semibold text-on-surface-variant/70 transition hover:text-on-surface hover:underline"
              >
                Open →
              </Link>
            )}
          </div>
          <button
            onClick={() => setActive(null)}
            className="text-on-surface-variant/40 transition hover:text-on-surface-variant/80"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
