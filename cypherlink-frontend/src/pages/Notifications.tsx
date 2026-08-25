import { useNotifications, useMarkNotificationRead } from "../hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { FadeUp, StaggerChildren, fadeUpVariants } from "../components/ui/motion";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const TYPE_CONFIG: Record<string, { icon: string; tone: "cyan" | "orange" | "green" | "purple" | "muted" }> = {
  COLLAB_INVITE:       { icon: "group_add", tone: "cyan" },
  PROJECT_UPDATE:      { icon: "layers", tone: "purple" },
  CYPHER_REMINDER:     { icon: "mic_external_on", tone: "orange" },
  MENTION:             { icon: "alternate_email", tone: "cyan" },
  FOLLOW:              { icon: "person_add", tone: "green" },
  VERIFICATION_STATUS: { icon: "verified", tone: "cyan" },
  MESSAGE_REQUEST:     { icon: "forum", tone: "purple" },
  CHECKIN_CONFIRMED:   { icon: "check_circle", tone: "green" },
};

function timeAgo(dateStr: string): string {
  const secs = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 86400 * 7) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

const TONE_ICON_COLORS: Record<string, string> = {
  cyan: "text-tertiary bg-tertiary-container/10",
  purple: "text-primary bg-primary-container/10",
  orange: "text-tertiary bg-tertiary-container/10",
  green: "text-[#34D399] bg-[rgba(52,211,153,0.08)]",
  muted: "text-on-surface-variant/50 bg-white/[0.04]",
};

export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();

  const unreadCount = (notifications ?? []).filter((n: any) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <FadeUp>
        <div className="flex items-end justify-between gap-4">
          <div>
            <Badge tone="muted">Meaningful, not needy</Badge>
            <h1 className="mt-4 font-headline-xl text-headline-xl md:text-[clamp(2.5rem,5vw,3.5rem)] text-on-surface tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant/50">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                (notifications ?? [])
                  .filter((n: any) => !n.read)
                  .forEach((n: any) => markRead.mutate(n.id));
              }}
            >
              Mark all read
            </Button>
          )}
        </div>
      </FadeUp>

      <div className="mt-8 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl glass-card" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="rounded-2xl border border-white/[0.06] glass-panel p-10 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/15 text-[40px] block mb-4">notifications_off</span>
            <p className="font-body-md text-on-surface-variant/40">Nothing yet.</p>
            <p className="mt-2 font-label-sm text-sm text-on-surface-variant/28">
              When people respond to your work or something moves in your scene, it'll show up here.
            </p>
            <Link to="/discover">
              <Button variant="secondary" size="sm" className="mt-6">
                Find your scene
              </Button>
            </Link>
          </div>
        ) : (
          <StaggerChildren className="space-y-2">
            {notifications.map((n: any) => {
              const cfg = TYPE_CONFIG[n.type] ?? { icon: "circle", tone: "muted" as const };
              const iconColors = TONE_ICON_COLORS[cfg.tone] ?? TONE_ICON_COLORS.muted;
              return (
                <motion.div
                  key={n.id}
                  variants={fadeUpVariants}
                  onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                  className={`group flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200 ${
                    n.read
                      ? "border-white/[0.04] bg-white/[0.01] opacity-55"
                      : "border-l-[3px] border-l-primary-container/50 border-white/[0.07] glass-card hover:border-primary-container/20"
                  }`}
                >
                  {/* Type icon */}
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      n.read ? "bg-white/[0.02] text-on-surface-variant/30" : iconColors
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {cfg.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {n.title && (
                      <p className={`font-semibold leading-tight ${n.read ? "text-on-surface-variant/50" : "text-on-surface"}`}>
                        {n.title}
                      </p>
                    )}
                    <p className={`mt-0.5 font-body-md text-sm ${n.read ? "text-on-surface-variant/35" : "text-on-surface-variant/60"}`}>
                      {n.message}
                    </p>
                    <p className="mt-1.5 font-label-sm text-xs text-on-surface-variant/25">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </motion.div>
              );
            })}
          </StaggerChildren>
        )}
      </div>
    </div>
  );
}
