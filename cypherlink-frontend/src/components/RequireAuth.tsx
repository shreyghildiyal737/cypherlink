import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  if (!isLoggedIn)
    return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
