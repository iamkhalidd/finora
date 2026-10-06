"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen max-w-md mx-auto px-5 flex flex-col justify-center py-10">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
          <Icon name="account_balance_wallet" size={22} filled />
        </div>
        <span className="text-2xl font-extrabold tracking-tight">Finora</span>
      </div>
      <h1 className="text-[26px] font-extrabold leading-tight">{title}</h1>
      <p className="text-muted mt-1 mb-7">{subtitle}</p>
      {children}
    </main>
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
