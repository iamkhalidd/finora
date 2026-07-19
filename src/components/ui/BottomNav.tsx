"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", icon: "home", href: "/dashboard" },
  { label: "Transactions", icon: "account_balance_wallet", href: "/transactions" },
  { label: "Forex", icon: "monitoring", href: "/forex" },
  { label: "News", icon: "newspaper", href: "/news" },
  { label: "Account", icon: "person", href: "/account" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[80px] bg-surface-container-low/80 backdrop-blur-2xl border-t border-white/5 z-40 flex items-center justify-around px-2 pb-safe shadow-2xl max-w-md mx-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300 ${
              isActive
                ? "text-primary scale-95"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{
                fontVariationSettings: `'FILL' ${isActive ? 1 : 0}`,
                textShadow: isActive ? "0 0 10px rgba(155, 202, 255, 0.4)" : "none",
              }}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-semibold tracking-wide uppercase">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
