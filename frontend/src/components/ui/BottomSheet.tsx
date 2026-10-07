"use client";

import { useEffect } from "react";
import Icon from "./Icon";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border-t border-line rounded-t-3xl px-5 pt-4 pb-6 pb-safe max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-muted hover:text-ink">
            <Icon name="close" size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
