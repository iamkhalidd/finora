import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { categoryIcon } from "@/lib/categories";
import { naira, shortDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export default function TransactionRow({ tx, showDate }: { tx: Transaction; showDate?: boolean }) {
  const income = tx.type === "income";
  const meta = [showDate ? shortDate(tx.date) : null, tx.notes].filter(Boolean).join(" · ");
  return (
    <Link href={`/transactions/${tx.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2/50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${income ? "bg-income/10 text-income" : "bg-surface-2 text-muted"}`}>
        <Icon name={categoryIcon(tx.category)} size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{tx.category}</p>
        {meta && <p className="text-xs text-muted truncate">{meta}</p>}
      </div>
      <span className={`text-[15px] font-bold tabular-nums shrink-0 ${income ? "text-income" : "text-ink"}`}>
        {income ? "+" : "-"}{naira(tx.amount)}
      </span>
    </Link>
  );
}
