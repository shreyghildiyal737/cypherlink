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
api.interceptors.request.use((c) => {
  if (accessToken) c.headers.Authorization = `Bearer ${accessToken}`;
  c.headers["X-Client"] = "cypherlink-web";
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const o = e.config;
    if (e.response?.status === 401 && !o?._retry) {
      o._retry = true;
      try {
        const r = await api.post("/auth/refresh");
        const t = r.data.accessToken ?? r.data.data?.accessToken;
        if (t) {
          setAccessToken(t);
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
