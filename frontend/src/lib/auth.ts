import { clearDemo } from "./demo/mode";

const KEY = "accessToken";

export const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(KEY) : null;

export const setAccessToken = (token: string) => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, token);
};

export const removeAccessToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  // Signing out of the demo also throws away its sample data
  clearDemo();
};
