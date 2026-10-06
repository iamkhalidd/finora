"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const NAV_ITEMS = [
  { label: "Home", icon: "home", href: "/dashboard" },
  { label: "Transactions", icon: "receipt_long", href: "/transactions" },
  { label: "Budgets", icon: "pie_chart", href: "/budgets" },
  { label: "Trading", icon: "candlestick_chart", href: "/trades" },
  { label: "Profile", icon: "person", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-bg/95 backdrop-blur-md border-t border-line pb-safe">
      <div className="max-w-md mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 transition-colors ${
                active ? "text-primary" : "text-faint hover:text-muted"
              }`}
            >
              <Icon name={item.icon} size={24} filled={active} />
              <span className="text-[10.5px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
