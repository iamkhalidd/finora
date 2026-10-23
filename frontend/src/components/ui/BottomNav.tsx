"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { NAV_ITEMS, isActive } from "@/components/shell/nav";
import { useImports } from "@/hooks/useImports";

export default function BottomNav() {
  const pathname = usePathname();
  const toReview = (useImports().data ?? []).length;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line pb-safe">
      <div className="max-w-xl mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          const count = item.badge === "imports" ? toReview : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 transition-colors ${
                active ? "text-primary" : "text-faint hover:text-muted"
              }`}
            >
              <span className="relative">
                <Icon name={item.icon} size={24} filled={active} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-extrabold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
