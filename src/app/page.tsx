"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-outline">
      Directing session...
    </div>
  );
}
