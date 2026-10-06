import Icon from "@/components/ui/Icon";
import { categoryIcon, CHART_COLORS } from "@/lib/categories";
import { naira } from "@/lib/format";
import type { CategoryTotal } from "@/lib/types";

export default function CategoryBars({ categories, limit }: { categories: CategoryTotal[]; limit?: number }) {
  const rows = limit ? categories.slice(0, limit) : categories;
  const max = Math.max(...rows.map((c) => c.value), 1);
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((c, i) => (
        <li key={c.name} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center shrink-0" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
            <Icon name={categoryIcon(c.name)} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline gap-2 text-sm">
              <span className="font-semibold truncate">{c.name}</span>
              <span className="font-bold tabular-nums shrink-0">{naira(c.value)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(c.value / max) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              </div>
              <span className="text-[11px] text-muted font-semibold w-9 text-right tabular-nums">{Math.round(c.percentage)}%</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
