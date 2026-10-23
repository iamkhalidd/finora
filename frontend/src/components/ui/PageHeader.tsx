"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import Avatar from "@/components/shell/Avatar";

export default function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Show a back button; a string navigates there instead of history.back() */
  back?: boolean | string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md lg:bg-bg lg:backdrop-blur-none px-4 pt-3 pb-2 flex items-center gap-2 min-h-[64px]">
      {back && (
        <button
          onClick={() => (typeof back === "string" ? router.push(back) : router.back())}
          className="-ml-1.5 w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-surface"
          aria-label="Back"
        >
          <Icon name="arrow_back" size={22} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {subtitle && <p className="text-xs text-muted truncate">{subtitle}</p>}
        <h1 className={`font-extrabold text-ink truncate ${back ? "text-lg" : "text-[26px] leading-tight"}`}>{title}</h1>
      </div>
      {right && <div className="flex items-center gap-1.5 shrink-0">{right}</div>}
      {/* Settings live behind the avatar on phones; the sidebar has them on desktop */}
      {!back && (
        <Link href="/profile" aria-label="Settings" className="lg:hidden ml-1 shrink-0">
          <Avatar size={38} />
        </Link>
      )}
    </header>
  );
}

export function HeaderButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center border transition ${
        active ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface border-line text-muted hover:text-ink"
      }`}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
