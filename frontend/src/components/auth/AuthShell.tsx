"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/shell/Logo";

const POINTS = [
  { icon: "pie_chart", text: "Monthly budgets that warn you before transport or food runs out" },
  { icon: "mail", text: "Forward bank alert emails and approve them in one tap" },
  { icon: "candlestick_chart", text: "A trading journal that shows what actually makes you money" },
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel: desktop only */}
      <aside className="hero hidden lg:flex flex-col justify-between rounded-none p-12 xl:p-16 after:!w-72 after:!h-72 after:!-right-20 after:!-top-20">
        <Link href="/" className="text-on-hero"><Logo size={36} onHero /></Link>
        <div className="max-w-md">
          <p className="font-display text-[40px] xl:text-[46px] font-extrabold leading-[1.05] tracking-tight">Know where every naira goes.</p>
          <ul className="mt-8 flex flex-col gap-4">
            {POINTS.map((p) => (
              <li key={p.icon} className="flex items-start gap-3 text-[15px]">
                <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Icon name={p.icon} size={20} />
                </span>
                <span className="pt-1.5 text-on-hero/90">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-hero-muted">Amounts in naira. Trading P&L in your broker&apos;s USD.</p>
      </aside>

      <main className="max-w-md w-full mx-auto px-5 flex flex-col justify-center py-10 lg:px-10">
        <Link href="/" className="mb-10 lg:hidden"><Logo size={40} /></Link>
        <h1 className="text-[30px] font-extrabold leading-tight">{title}</h1>
        <p className="text-muted mt-1 mb-7">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input pr-12"
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} size={20} />
      </button>
    </div>
  );
}
