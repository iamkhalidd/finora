import { create } from "zustand";

interface User {
  id: number;
  name: string;
  email: string;
}

interface StoreState {
  user: User | null;
  authStatus: "idle" | "authenticated" | "unauthenticated" | "loading";
  notificationCount: number;
  setUser: (user: User | null) => void;
  setAuthStatus: (status: "idle" | "authenticated" | "unauthenticated" | "loading") => void;
  setNotificationCount: (count: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  authStatus: "idle",
  notificationCount: 0,
  setUser: (user) => set({ user }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  setNotificationCount: (notificationCount) => set({ notificationCount }),
}));
