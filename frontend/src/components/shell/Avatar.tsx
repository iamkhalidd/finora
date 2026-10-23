"use client";

import { useProfile } from "@/hooks/useProfile";

export default function Avatar({ size = 36 }: { size?: number }) {
  const { data: user } = useProfile();
  return (
    <span
      aria-hidden
      className="rounded-full bg-sun text-on-sun font-display font-extrabold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {user?.name.charAt(0).toUpperCase() ?? ""}
    </span>
  );
}
