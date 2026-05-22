import { create } from "zustand";
import { api, setAccessToken, getAccessToken } from "../services/api";
import { getSocket } from "../services/socket";
import type { Artist } from "../types";
import { artists } from "../data/mock";

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  handle?: string;
}
interface AuthState {
  user: Artist | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (d: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

function mapProfileToArtist(p: any): Artist {
  return {
    id: p.id,
    name: p.displayName ?? p.handle ?? "",
    handle: p.handle ?? "",
    city: p.city ?? p.location ?? "",
    genres: p.genres ?? [],
    verified: !!p.isVerified,
    role: p.role,
    momentum: p.momentum ?? "New Voice",
    avatar: p.avatarUrl ?? (p.displayName ?? p.handle ?? " ")[0] ?? " ",
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const r = await api.post("/auth/login", { email, password });
      const t = r.data.accessToken ?? r.data.data?.accessToken;
      if (!t) throw new Error("No token returned");
      setAccessToken(t);
      const user = mapProfileToArtist(r.data.user ?? r.data);
      set({ user, isLoggedIn: true, loading: false });
      const s = getSocket();
      if (s && t) {
        s.auth = { token: t };
        s.connect();
      }
    } catch (e: any) {
      const msg =
        e.response?.data?.error?.message ??
        e.response?.data?.message ??
        e.message ??
        "Login failed";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (d) => {
    set({ loading: true, error: null });
    try {
      const r = await api.post("/auth/register", d);
      const t = r.data.accessToken ?? r.data.data?.accessToken;
      if (!t) throw new Error("No token returned");
      setAccessToken(t);
      const user = mapProfileToArtist(r.data.user ?? r.data);
      set({ user, isLoggedIn: true, loading: false });
      const s = getSocket();
      if (s && t) {
        s.auth = { token: t };
        s.connect();
      }
    } catch (e: any) {
      const msg =
        e.response?.data?.error?.message ??
        e.response?.data?.message ??
        e.message ??
        "Registration failed";
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      setAccessToken(null);
      set({ user: null, isLoggedIn: false });
      try {
        getSocket()?.disconnect();
      } catch {}
    }
  },

  refreshSession: async () => {
    try {
      const r = await api.post("/auth/refresh");
      const t = r.data.accessToken ?? r.data.data?.accessToken;
      if (t) {
        setAccessToken(t);
        try {
          const me = await api.get("/auth/me");
          const user = mapProfileToArtist(me.data);
          set({ user, isLoggedIn: true, loading: false });
          const s = getSocket();
          if (s && t) {
            s.auth = { token: t };
            s.connect();
          }
        } catch {
          setAccessToken(null);
          set({ user: null, isLoggedIn: false, loading: false });
        }
      } else {
        set({ user: null, isLoggedIn: false });
      }
    } catch {
      set({ user: null, isLoggedIn: false });
    }
  },

  clearError: () => set({ error: null }),
}));
