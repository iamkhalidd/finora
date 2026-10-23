"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { quickAdd } from "./nav";

/** Phone-only; on desktop the same action sits in the sidebar. */
export default function Fab() {
  const add = quickAdd(usePathname());
  return (
    <Link
      href={add.href}
      aria-label={add.label}
      className="lg:hidden fixed z-30 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-18rem+1rem))] w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-black/25 active:scale-95 transition"
    >
      <Icon name="add" size={28} />
    </Link>
  );
}
