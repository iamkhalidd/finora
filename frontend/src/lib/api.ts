import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken, removeAccessToken } from "./auth";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";

export const api = axios.create({ baseURL, withCredentials: true, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One shared refresh request, so parallel 401s don't each trigger a refresh.
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/");
    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      refreshing ??= axios
        .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        .then((res) => res.data.access_token as string)
        .finally(() => { refreshing = null; });
      const token = await refreshing;
      setAccessToken(token);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      removeAccessToken();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);
