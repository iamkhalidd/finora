"use client";

import { useEffect } from "react";
import { setAccessToken } from "@/lib/auth";
import { DEMO_FLAG, DEMO_TOKEN } from "@/lib/demo/mode";
import Logo from "@/components/shell/Logo";

/** Entry point for "Try the demo": switch this browser into demo mode and open the app. */
export default function DemoPage() {
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_FLAG, "1");
      setAccessToken(DEMO_TOKEN);
    } catch {
      // Without storage the demo can't remember anything, but it still opens
    }
    // A full load so no cached data from a real session leaks into the demo
    window.location.replace("/dashboard");
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Logo size={44} />
      <p className="text-muted">Opening the demo…</p>
    </main>
  );
}
