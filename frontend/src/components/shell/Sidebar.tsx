"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Avatar from "./Avatar";
import { NAV_ITEMS, isActive, quickAdd } from "./nav";
import { useProfile } from "@/hooks/useProfile";
import { useImports } from "@/hooks/useImports";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useProfile();
  const toReview = (useImports().data ?? []).length;
  const add = quickAdd(pathname);
  const onProfile = isActive(pathname, ["/profile"]);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col gap-1 bg-surface border-r border-line px-3 py-5">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-3 pb-6">
        <span className="w-8 h-8 rounded-[10px] bg-hero text-on-hero flex items-center justify-center">
          <Icon name="account_balance_wallet" size={18} filled />
        </span>
        <span className="font-display text-xl font-extrabold tracking-tight">Finora</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          const count = item.badge === "imports" ? toReview : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-[15px] transition-colors ${
                active ? "bg-surface-2 text-ink font-bold" : "text-muted font-semibold hover:text-ink hover:bg-surface-2/60"
              }`}
            >
              <Icon name={item.icon} size={22} filled={active} className={active ? "text-primary" : ""} />
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-on-primary text-[11px] font-extrabold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Link href={add.href} className="btn-primary">
          <Icon name="add" size={20} /> {add.label}
        </Link>
        <Link
          href="/profile"
          aria-current={onProfile ? "page" : undefined}
          className={`flex items-center gap-3 rounded-[14px] px-2 py-2 transition-colors ${onProfile ? "bg-surface-2" : "hover:bg-surface-2/60"}`}
        >
          <Avatar size={34} />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold truncate">{user?.name ?? "Account"}</span>
            <span className="block text-xs text-muted">Settings</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
