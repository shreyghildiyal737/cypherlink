import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const initialized = useAuthStore((s) => s.initialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!initialized) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
