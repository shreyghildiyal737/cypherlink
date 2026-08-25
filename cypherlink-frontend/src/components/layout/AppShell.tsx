import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SideNav, BottomNav } from "./Nav";
import { useAuthStore } from "../../store/authStore";
import { useUserSocket } from "../../hooks/useUserSocket";
import { NotificationToast } from "../ui/NotificationToast";
import { AmbientBackground } from "../ui/AmbientBackground";
import { ErrorBoundary } from "./ErrorBoundary";

const ONBOARDING_EXEMPT_PREFIXES = [
  "/onboarding",
  "/login",
  "/settings",
  "/logout",
];

export function AppShell() {
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding);
  const initialized = useAuthStore((s) => s.initialized);
  const location = useLocation();
  const navigate = useNavigate();

  useUserSocket();

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const el = (e.target as Element).closest(".liquid-hover") as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty("--y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    }
    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (!initialized || !needsOnboarding) return;
    const exempt = ONBOARDING_EXEMPT_PREFIXES.some((p) =>
      location.pathname.startsWith(p),
    );
    if (!exempt) navigate("/onboarding", { replace: true });
  }, [initialized, needsOnboarding, location.pathname, navigate]);

  return (
    <div className="relative min-h-screen bg-[#080810] selection:bg-primary-container/30 selection:text-on-surface">
      {/* Ambient lighting layer */}
      <AmbientBackground />

      {/* Film grain */}
      <div className="grain-overlay" aria-hidden />

      {/* Desktop sidebar */}
      <SideNav />

      {/* Main content — offset by sidebar on desktop */}
      <main
        className="relative z-10 min-h-screen md:ml-64"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Notification toast (all authenticated routes) */}
      <NotificationToast />
    </div>
  );
}
