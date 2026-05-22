import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav, TopNav } from "./Nav";
import { useAuthStore } from "../../store/authStore";
export function AppShell() {
  const refreshSession = useAuthStore((s) => s.refreshSession);
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);
  return (
    <>
      <TopNav />
      <main className="min-h-screen pb-24 pt-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
