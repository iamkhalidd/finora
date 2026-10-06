const KEY = "accessToken";

export const getAccessToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(KEY) : null;

export const setAccessToken = (token: string) => {
  if (typeof window !== "undefined") localStorage.setItem(KEY, token);
};

export const removeAccessToken = () => {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
};
