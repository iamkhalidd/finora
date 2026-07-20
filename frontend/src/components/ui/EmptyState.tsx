import React from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 animate-fadeIn">
      {/* Icon circle */}
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 border border-white/5">
        <span className="material-symbols-outlined text-[32px] text-outline">{icon}</span>
      </div>

      <h3 className="text-headline-sm font-bold text-on-surface mb-1">{title}</h3>
      <p className="text-body-sm text-outline max-w-[220px] leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-3 bg-primary/20 border border-primary/30 text-primary text-label-xs font-bold uppercase tracking-wider rounded-full transition-all hover:bg-primary/30 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
