// Demo mode runs the whole app against sample data kept in this browser.
// The flag and data live in localStorage; nothing is sent to the server.
export const DEMO_FLAG = "finora-demo";
export const DEMO_DATA = "finora-demo-data";
export const DEMO_TOKEN = "demo";

export function isDemo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEMO_FLAG) === "1";
  } catch {
    return false;
  }
}

export function clearDemo() {
  try {
    localStorage.removeItem(DEMO_FLAG);
    localStorage.removeItem(DEMO_DATA);
  } catch {
    // Storage blocked: nothing to clear
  }
}
