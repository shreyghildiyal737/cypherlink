import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useUnreadNotificationCount } from "../../hooks";
import { useSocketStatus } from "../../hooks/useUserSocket";

// ─── Presence dot ─────────────────────────────────────────────────────────────

function PresenceDot() {
  const status = useSocketStatus();
  if (status === "online") return null;
  const cls =
    status === "connecting"
      ? "bg-yellow-400/70 animate-pulse"
      : "bg-on-surface-variant/30";
  return (
    <span
      title={status === "connecting" ? "Reconnecting…" : "Offline"}
      className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`}
    />
  );
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────

type SideItem = {
  to: string;
  icon: string;
  iconFilled: string;
  label: string;
};

const sideItems: SideItem[] = [
  { to: "/home",      icon: "home",            iconFilled: "home",            label: "Home" },
  { to: "/discover",  icon: "explore",         iconFilled: "explore",         label: "Scenes" },
  { to: "/feed",      icon: "movie_filter",    iconFilled: "movie_filter",    label: "Clips" },
  { to: "/cyphers",   icon: "mic_external_on", iconFilled: "mic_external_on", label: "Cyphers" },
  { to: "/projects",  icon: "layers",          iconFilled: "layers",          label: "Projects" },
  { to: "/community", icon: "groups",          iconFilled: "groups",          label: "Community" },
  { to: "/messages",  icon: "forum",           iconFilled: "forum",           label: "Chat" },
  { to: "/map",       icon: "map",             iconFilled: "map",             label: "Map" },
];

const sideFooter: SideItem[] = [
  { to: "/search",        icon: "search",        iconFilled: "search",        label: "Search" },
  { to: "/notifications", icon: "notifications", iconFilled: "notifications", label: "Notifications" },
  { to: "/settings",      icon: "settings",      iconFilled: "settings",      label: "Settings" },
];

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function SideNav() {
  const { isLoggedIn, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const notifCount = useUnreadNotificationCount();

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-50 py-8 px-4 gap-3 bg-surface-container-lowest/90 backdrop-blur-2xl border-r border-white/5">
      {/* Wordmark */}
      <Link
        to="/"
        className="flex items-center gap-3 mb-8 px-4 py-2 rounded-xl hover:bg-white/[0.03] transition-colors"
      >
        <div className="w-10 h-10 rounded-2xl bg-primary-container flex items-center justify-center shadow-primary-glow shrink-0">
          <span className="material-symbols-outlined text-on-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            graphic_eq
          </span>
        </div>
        <div>
          <h2
            className="text-[18px] font-bold leading-none tracking-tight"
            style={{
              background: "linear-gradient(135deg, #d2bbff 0%, #c4c1fb 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CypherLink
          </h2>
          <p className="font-label-sm text-[10px] text-on-surface-variant/50 uppercase tracking-[0.12em] mt-0.5">
            {isLoggedIn ? "Studio Live" : "Underground"}
          </p>
        </div>
      </Link>

      {/* Start Cypher CTA */}
      {isLoggedIn && (
        <Link
          to="/create"
          className="btn-liquid w-full py-3 rounded-xl text-on-primary-container font-label-sm text-label-sm font-semibold mb-4 shadow-primary-glow flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
          Start Cypher
        </Link>
      )}

      {/* Main nav */}
      <nav className="flex-1 flex flex-col gap-1" aria-label="Main navigation">
        {sideItems.map(({ to, icon, iconFilled, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg font-body-md text-body-md transition-all duration-300 tube-cursor-target border-l-2 ${
                isActive
                  ? "text-primary bg-primary-container/10 border-primary-container"
                  : "text-on-surface-variant/70 hover:bg-surface-variant/30 hover:text-on-surface hover:translate-x-0.5 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[20px] transition-colors ${isActive ? "text-primary" : "group-hover:text-primary"}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {isActive ? iconFilled : icon}
                </span>
                <span>{label}</span>
                {label === "Notifications" && notifCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-primary-container flex items-center justify-center font-label-sm text-[10px] text-on-primary-container">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer nav */}
      <div className="flex flex-col gap-1 pt-4 border-t border-white/5">
        {sideFooter.map(({ to, icon, iconFilled, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-lg font-label-sm text-label-sm transition-all duration-300 tube-cursor-target border-l-2 ${
                isActive
                  ? "text-primary bg-primary-container/10 border-primary-container"
                  : "text-on-surface-variant/60 hover:bg-surface-variant/30 hover:text-on-surface border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {isActive ? iconFilled : icon}
                </span>
                <span>{label}</span>
                {label === "Notifications" && notifCount > 0 && (
                  <AnimatePresence>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="ml-auto min-w-[18px] h-[18px] rounded-full bg-primary-container flex items-center justify-center font-label-sm text-[10px] text-on-primary-container"
                    >
                      {notifCount > 9 ? "9+" : notifCount}
                    </motion.span>
                  </AnimatePresence>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Profile / auth */}
        <div className="mt-2 pt-2 border-t border-white/5">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 px-4 py-2">
              <Link
                to={`/profile/${user?.id ?? "me"}`}
                className="w-8 h-8 rounded-full bg-surface-variant border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:border-primary transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
              </Link>
              <div className="flex-1 min-w-0">
                <p className="font-label-sm text-label-sm text-on-surface truncate">
                  {user?.handle ?? user?.name ?? "Me"}
                </p>
                <PresenceDot />
              </div>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="text-on-surface-variant/50 hover:text-on-surface transition-colors"
                aria-label="Log out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-liquid mx-4 py-2.5 rounded-xl text-on-primary-container font-label-sm text-label-sm font-semibold flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

const bottomItems = [
  { to: "/home",      icon: "home",         iconFilled: "home",         label: "Home" },
  { to: "/cyphers",   icon: "mic_external_on", iconFilled: "mic_external_on", label: "Cyphers" },
  { to: "/messages",  icon: "forum",        iconFilled: "forum",        label: "Chat" },
  { to: "/discover",  icon: "explore",      iconFilled: "explore",      label: "Scenes" },
  { to: "/profile/me",icon: "person",       iconFilled: "person",       label: "Me" },
];

export function BottomNav() {
  const location = useLocation();
  const notifCount = useUnreadNotificationCount();

  function isActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + "/");
  }

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 bg-surface-container-high/95 backdrop-blur-3xl border-t border-primary-container/20 shadow-2xl"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))", paddingTop: "0.5rem" }}
    >
      {/* items 0-1 */}
      {bottomItems.slice(0, 2).map(({ to, icon, iconFilled, label }) => (
        <BottomNavItem key={to} to={to} icon={icon} iconFilled={iconFilled} label={label} active={isActive(to)} />
      ))}

      {/* Center create button */}
      <Link
        to="/create"
        aria-label="Create"
        className="flex flex-col items-center -mt-6 focus-visible:outline-none"
      >
        <motion.span
          whileTap={{ scale: 0.9 }}
          className="btn-liquid grid h-14 w-14 place-items-center rounded-2xl text-on-primary-container shadow-primary-glow focus-visible:ring-4 focus-visible:ring-primary-container/30"
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_circle
          </span>
        </motion.span>
        <span className="font-label-sm text-[10px] text-on-surface-variant/50 mt-1 uppercase tracking-widest">
          Create
        </span>
      </Link>

      {/* items 2-3 */}
      {bottomItems.slice(3).map(({ to, icon, iconFilled, label }) => {
        const hasNotif = label === "Notifications" && notifCount > 0;
        return (
          <BottomNavItem
            key={to}
            to={to}
            icon={icon}
            iconFilled={iconFilled}
            label={label}
            active={isActive(to)}
            badge={hasNotif ? notifCount : undefined}
          />
        );
      })}
    </nav>
  );
}

function BottomNavItem({
  to,
  icon,
  iconFilled,
  label,
  active,
  badge,
}: {
  to: string;
  icon: string;
  iconFilled: string;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-0.5 py-1 min-w-[3rem] ${
        active ? "" : "opacity-50 hover:opacity-80"
      } transition-opacity`}
    >
      <motion.div
        whileTap={{ scale: 0.85 }}
        className="relative grid h-8 w-8 place-items-center"
      >
        {active && (
          <motion.span
            layoutId="bottom-active"
            className="absolute inset-0 rounded-full bg-primary-container/20 border border-primary-container/30"
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          />
        )}
        <span
          className={`material-symbols-outlined text-[22px] relative z-10 transition-colors ${
            active ? "text-primary-fixed-dim" : "text-on-surface-variant"
          }`}
          style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
        >
          {active ? iconFilled : icon}
        </span>
        {badge && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-error flex items-center justify-center font-label-sm text-[9px] text-on-error z-20">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </motion.div>
      <span className={`font-label-sm text-[10px] uppercase tracking-widest ${active ? "text-primary-fixed-dim" : "text-on-surface-variant"}`}>
        {label}
      </span>
      {active && (
        <motion.span
          layoutId="bottom-dot"
          className="h-0.5 w-3 rounded-full bg-primary-container"
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        />
      )}
    </Link>
  );
}

// ─── Legacy TopNav export (used nowhere after AppShell update, but kept for safety) ──

export function TopNav() {
  return null;
}
