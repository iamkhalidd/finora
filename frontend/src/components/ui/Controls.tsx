"use client";

import { useState } from "react";
import Icon from "./Icon";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/format";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; activeClass?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-surface border border-line rounded-xl p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition ${
            value === o.value ? o.activeClass ?? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const isCurrent = month >= currentMonth();
  return (
    <div className="flex items-center justify-between card px-1.5 py-1">
      <button onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month" className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink">
        <Icon name="chevron_left" size={22} />
      </button>
      <button onClick={() => onChange(currentMonth())} className="text-sm font-bold" disabled={isCurrent}>
        {monthLabel(month)}
        {!isCurrent && <span className="block text-[11px] font-semibold text-primary">Back to this month</span>}
      </button>
      <button onClick={() => onChange(shiftMonth(month, 1))} disabled={isCurrent} aria-label="Next month" className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-ink disabled:opacity-30">
        <Icon name="chevron_right" size={22} />
      </button>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

/** Keeps digits and one decimal point (max 2 dp) and adds thousands separators for display. */
export function cleanAmount(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, "");
  const [int, ...rest] = cleaned.split(".");
  return rest.length ? `${int}.${rest.join("").slice(0, 2)}` : int;
}

export function displayAmount(raw: string): string {
  if (!raw) return "";
  const [int, dec] = raw.split(".");
  const grouped = (int.replace(/^0+(?=\d)/, "") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

export function AmountInput({
  value,
  onChange,
  id,
  autoFocus,
  className = "",
  placeholder = "0",
}: {
  value: string;
  onChange: (raw: string) => void;
  id?: string;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold">₦</span>
      <input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        value={displayAmount(value)}
        onChange={(e) => onChange(cleanAmount(e.target.value))}
        placeholder={placeholder}
        className="input pl-8 font-bold tabular-nums"
      />
    </div>
  );
}

/** Two-step delete so a stray tap doesn't destroy data. */
export function ConfirmDelete({
  onConfirm,
  label = "Delete",
  pending,
}: {
  onConfirm: () => void;
  label?: string;
  pending?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="btn-danger w-full">
        <Icon name="delete" size={18} /> {label}
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setArmed(false)} className="btn-ghost flex-1">Cancel</button>
      <button type="button" onClick={onConfirm} disabled={pending} className="btn flex-1 bg-expense text-bg py-3">
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
    </div>
  );
}
