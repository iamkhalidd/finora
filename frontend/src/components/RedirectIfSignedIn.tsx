"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";

/** The landing page is for visitors; signed-in people go straight to their overview. */
export default function RedirectIfSignedIn() {
  const router = useRouter();
  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
  }, [router]);
  return null;
}
