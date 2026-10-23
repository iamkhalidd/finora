"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import Sidebar from "@/components/shell/Sidebar";
import Fab from "@/components/shell/Fab";
import { getAccessToken } from "@/lib/auth";

// Form screens get the full height (their save button sits at the bottom)
const FULL_SCREEN = [/\/new$/, /\/edit$/, /^\/transactions\/\d+$/];
// Dashboards and lists use the full desktop width; forms and settings stay one readable column
const WIDE = [/^\/dashboard$/, /^\/transactions$/, /^\/imports$/, /^\/budgets$/, /^\/trades$/, /^\/trades\/stats$/, /^\/trades\/\d+$/];
// Screens with their own primary action don't need the floating "add" button
const NO_FAB = [/^\/profile/, /^\/imports/, /^\/budgets/];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  const fullScreen = FULL_SCREEN.some((re) => re.test(pathname));
  const showFab = !fullScreen && !NO_FAB.some((re) => re.test(pathname));
  return (
    <>
      <Sidebar />
      <div className="lg:pl-64 min-h-screen pb-24 lg:pb-10">
        <div className={`mx-auto lg:pt-4 ${WIDE.some((re) => re.test(pathname)) ? "max-w-xl lg:max-w-6xl lg:px-4" : "max-w-xl"}`}>{children}</div>
      </div>
      {!fullScreen && <BottomNav />}
      {showFab && <Fab />}
    </>
  );
}
