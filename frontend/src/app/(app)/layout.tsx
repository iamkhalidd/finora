"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import Sidebar from "@/components/shell/Sidebar";
import Fab from "@/components/shell/Fab";
import { getAccessToken } from "@/lib/auth";

// Form screens get the full height (their save button sits at the bottom)
const FULL_SCREEN = [/\/new$/, /\/edit$/, /^\/transactions\/\d+$/];
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
      <div className={`lg:pl-64 min-h-screen ${fullScreen ? "pb-24" : "pb-24 lg:pb-10"}`}>
        {/* Pages are still single-column; they widen as each one is redesigned */}
        <div className="max-w-xl mx-auto lg:pt-4">{children}</div>
      </div>
      {!fullScreen && <BottomNav />}
      {showFab && <Fab />}
    </>
  );
}
