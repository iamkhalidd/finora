"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Home",     icon: "home",                   href: "/dashboard"    },
  { label: "Wallet",   icon: "account_balance_wallet",  href: "/transactions" },
  { label: "Forex",    icon: "monitoring",              href: "/forex"        },
  { label: "Budgets",  icon: "savings",                 href: "/budgets"      },
  { label: "News",     icon: "newspaper",               href: "/news"         },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 flex items-end justify-around pb-safe px-2 pt-2"
      style={{
        background: "linear-gradient(to top, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        height: "80px",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full group"
          >
            {/* Animated active pill background */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-x-1 top-0.5 h-[36px] rounded-full bg-primary/15 border border-primary/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </AnimatePresence>

            {/* Icon */}
            <span
              className={`material-symbols-outlined text-[22px] z-10 transition-all duration-200 ${
                isActive
                  ? "text-primary drop-shadow-[0_0_8px_rgba(155,202,255,0.5)]"
                  : "text-outline group-hover:text-on-surface-variant"
              }`}
              style={{
                fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' ${isActive ? 600 : 400}`,
              }}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span
              className={`text-[10px] font-bold tracking-wide z-10 transition-colors duration-200 ${
                isActive ? "text-primary" : "text-outline group-hover:text-on-surface-variant"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
