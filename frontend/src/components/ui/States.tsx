import Icon from "./Icon";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-6">
      <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-3 text-muted">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="font-bold text-ink">{title}</h3>
      {description && <p className="text-sm text-muted mt-1 max-w-[260px]">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-5 py-3 text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center text-center py-8 px-6">
      <Icon name="cloud_off" size={28} className="text-muted mb-2" />
      <p className="text-sm text-muted">{message ?? "Couldn't load this. Check your connection."}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-4 py-2.5 text-sm">
          <Icon name="refresh" size={18} /> Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="card divide-y divide-line">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-expense/25 bg-expense/10 px-3.5 py-3 text-sm text-expense">
      <Icon name="error" size={18} className="mt-px" />
      <span>{message}</span>
    </div>
  );
}
