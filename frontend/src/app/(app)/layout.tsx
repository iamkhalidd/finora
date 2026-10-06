"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { getAccessToken } from "@/lib/auth";

// Form screens get the full height (their save button sits at the bottom)
const FULL_SCREEN = [/\/new$/, /\/edit$/, /^\/transactions\/\d+$/];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  const hideNav = FULL_SCREEN.some((re) => re.test(pathname));
  return (
    <div className={`max-w-md mx-auto min-h-screen ${hideNav ? "" : "pb-24"}`}>
      {children}
      {!hideNav && <BottomNav />}
    </div>
  );
}
