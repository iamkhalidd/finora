"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Basic route protection
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative pb-[90px] max-w-md mx-auto w-full">
      <main className="flex-1 w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
