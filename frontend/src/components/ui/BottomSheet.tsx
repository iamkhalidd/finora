"use client";

import { useEffect, useId, useRef } from "react";
import Icon from "./Icon";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const IN_FORM = FOCUSABLE.split(", ").map((sel) => `form ${sel}`).join(", ");

/** A sheet on phones and a centred dialog on desktop. Keeps keyboard focus inside while open. */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const opener = useRef<HTMLElement | null>(null);

  // Remember what had focus before opening (an autoFocus field steals it on mount)
  useEffect(() => {
    if (open) return;
    const track = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[role="dialog"]')) opener.current = target;
    };
    document.addEventListener("focusin", track);
    return () => document.removeEventListener("focusin", track);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const returnTo = opener.current;
    const el = panel.current;
    // Respect an autoFocus field inside; otherwise start on the first control
    if (el && !el.contains(document.activeElement)) {
      const first = el.querySelector<HTMLElement>(IN_FORM) ?? el.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      returnTo?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-6" role="dialog" aria-modal aria-labelledby={titleId}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        ref={panel}
        className="relative w-full max-w-md bg-surface border-t border-line rounded-t-[28px] px-5 pt-4 pb-6 pb-safe max-h-[90vh] overflow-y-auto animate-slide-up lg:max-w-lg lg:border lg:rounded-[24px] lg:pb-6 lg:animate-fade-in"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-muted hover:text-ink">
            <Icon name="close" size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
