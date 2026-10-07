import Icon from "@/components/ui/Icon";
import { categoryIcon } from "@/lib/categories";
import { naira } from "@/lib/format";
import type { CategoryTotal } from "@/lib/types";

// One series of nominal categories: a single hue, since bar length already
// shows the size and a rainbow would spend colour on nothing.
export default function CategoryBars({ categories, limit }: { categories: CategoryTotal[]; limit?: number }) {
  const rows = limit ? categories.slice(0, limit) : categories;
  const max = Math.max(...rows.map((c) => c.value), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((c) => (
        <li key={c.name} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-2 text-muted flex items-center justify-center shrink-0">
            <Icon name={categoryIcon(c.name)} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2 text-sm">
              <span className="font-semibold truncate">{c.name}</span>
              <span className="font-bold tabular-nums shrink-0">{naira(c.value)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c.value / max) * 100}%` }} />
              </div>
              <span className="text-[11px] text-muted font-semibold w-9 text-right tabular-nums">{Math.round(c.percentage)}%</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
