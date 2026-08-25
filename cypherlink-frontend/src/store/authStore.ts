import { create } from "zustand";
import { api, setAccessToken, registerSilentRefreshHook } from "../services/api";
import { getSocket, disconnectSocket, updateSocketToken } from "../services/socket";
import type { Artist } from "../types";

// Wire up the Axios silent-refresh hook once at module load so the socket
// re-authenticates whenever the interceptor rotates the access token.
registerSilentRefreshHook((t) => updateSocketToken(t));

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  handle?: string;
}
interface AuthState {
  user: Artist | null;
  isLoggedIn: boolean;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (d: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const ONBOARDING_DISMISSED_KEY = "cypherlink:onboarding-dismissed";

function hasDismissedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function evaluateOnboardingNeeded(user: Artist | null): boolean {
  if (!user) return false;
  if (hasDismissedOnboarding()) return false;
  return !user.city;
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  initialized: false,
  loading: false,
  error: null,
  needsOnboarding: false,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const r = await api.post("/auth/login", { email, password });
      const t = r.data.accessToken ?? r.data.data?.accessToken;
      if (!t) throw new Error("No token returned");
      setAccessToken(t);
      const user = mapProfileToArtist(r.data.user ?? r.data);
      set({
        user,
        isLoggedIn: true,
        initialized: true,
        loading: false,
        needsOnboarding: evaluateOnboardingNeeded(user),
      });
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
      // Fresh registration: always show onboarding (any prior dismissal was for a previous account).
      try {
        localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
      } catch {}
      set({
        user,
        isLoggedIn: true,
        initialized: true,
        loading: false,
        needsOnboarding: !user.city,
      });
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
      // Dismissal is per-account; clear so the next login can be evaluated freshly.
      try {
        localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
      } catch {}
      set({ user: null, isLoggedIn: false, needsOnboarding: false });
      // disconnectSocket() nulls the singleton so the next login creates a
      // fresh socket with the correct new auth token rather than reusing a
      // stale disconnected instance.
      try { disconnectSocket(); } catch {}
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
          set({
            user,
            isLoggedIn: true,
            initialized: true,
            loading: false,
            needsOnboarding: evaluateOnboardingNeeded(user),
          });
          const s = getSocket();
          if (s && t) {
            s.auth = { token: t };
            s.connect();
          }
        } catch {
          setAccessToken(null);
          set({
            user: null,
            isLoggedIn: false,
            initialized: true,
            loading: false,
            needsOnboarding: false,
          });
        }
      } else {
        set({ user: null, isLoggedIn: false, initialized: true, needsOnboarding: false });
      }
    } catch {
      set({ user: null, isLoggedIn: false, initialized: true, needsOnboarding: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export function dismissOnboarding() {
  try {
    localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
  } catch {}
  useAuthStore.setState({ needsOnboarding: false });
}
