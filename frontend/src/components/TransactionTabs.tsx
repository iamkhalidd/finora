"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useImports } from "@/hooks/useImports";

/** Activity and the bank-alert inbox are two views of the same money. */
export default function TransactionTabs() {
  const pathname = usePathname();
  const toReview = (useImports().data ?? []).length;
  const tabs = [
    { href: "/transactions", label: "Activity", count: 0 },
    { href: "/imports", label: "Inbox", count: toReview },
  ];
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={active}
            className={`-mb-px flex items-center gap-2 px-3 pb-2.5 pt-1 text-[15px] font-bold border-b-2 transition-colors ${
              active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-extrabold flex items-center justify-center">
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
