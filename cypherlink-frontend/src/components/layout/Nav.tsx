import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Map,
  MessageCircle,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
const nav = [
  ["/home", "Home"],
  ["/map", "Map"],
  ["/feed", "Clips"],
  ["/cyphers", "Cyphers"],
  ["/projects", "Projects"],
];
export function TopNav() {
  const { isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-black tracking-tight"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-ink shadow-glow">
            C
          </span>
          CypherLink
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${isActive ? "bg-white text-ink" : "text-white/70 hover:bg-white/10 hover:text-white"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="hidden rounded-full p-2 text-white/70 hover:bg-white/10 md:block"
          >
            <Search size={19} />
          </Link>
          <Link
            to="/notifications"
            className="hidden rounded-full p-2 text-white/70 hover:bg-white/10 md:block"
          >
            <Bell size={19} />
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                to={`/profile/${useAuthStore.getState().user?.id ?? "me"}`}
                className="rounded-full p-2 text-white/80 hover:bg-white/10"
              >
                <UserRound size={19} />
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-sm text-white/50 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">
              <Button className="py-2">Log in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 grid w-full grid-cols-5 border-t border-white/10 bg-ink/85 px-2 py-2 backdrop-blur-xl md:hidden">
      <NavLink to="/home" className="text-center text-xs text-white/70">
        Home
      </NavLink>
      <NavLink to="/map" className="text-center text-xs text-white/70">
        <Map className="mx-auto mb-1" size={18} />
        Map
      </NavLink>
      <Link to="/create" className="-mt-5 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-ink shadow-glow">
          <Plus />
        </span>
      </Link>
      <NavLink to="/messages" className="text-center text-xs text-white/70">
        <MessageCircle className="mx-auto mb-1" size={18} />
        DMs
      </NavLink>
      <NavLink to="/profile/me" className="text-center text-xs text-white/70">
        <UserRound className="mx-auto mb-1" size={18} />
        Me
      </NavLink>
    </nav>
  );
}
