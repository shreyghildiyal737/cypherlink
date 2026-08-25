import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api",
  timeout: 12000,
  withCredentials: true,
});
let accessToken: string | null = null;
export function setAccessToken(t: string | null) {
  accessToken = t;
}
export function getAccessToken() {
  return accessToken;
}

// Callback registered by authStore so the socket token stays in sync with
// silent Axios-interceptor refreshes — without creating a circular import.
let _onSilentRefresh: ((token: string) => void) | null = null;
export function registerSilentRefreshHook(cb: (token: string) => void) {
  _onSilentRefresh = cb;
}
api.interceptors.request.use((c) => {
  if (accessToken) c.headers.Authorization = `Bearer ${accessToken}`;
  c.headers["X-Client"] = "cypherlink-web";
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const o = e.config;
    const isAuthEndpoint =
      typeof o?.url === "string" && o.url.includes("/auth/");
    if (e.response?.status === 401 && !o?._retry && !isAuthEndpoint) {
      o._retry = true;
      try {
        const r = await api.post("/auth/refresh");
        const t = r.data.accessToken ?? r.data.data?.accessToken;
        if (t) {
          setAccessToken(t);
          _onSilentRefresh?.(t); // keeps socket auth token in sync
          o.headers.Authorization = `Bearer ${t}`;
          return api(o);
        } else {
          setAccessToken(null);
        }
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(e);
  },
);
