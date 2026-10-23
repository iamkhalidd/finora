"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/States";
import CategoryBars from "@/components/charts/CategoryBars";
import TransactionRow from "@/components/TransactionRow";
import { useProfile } from "@/hooks/useProfile";
import { useSummary, useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useTradeStats } from "@/hooks/useTrades";
import { useImports } from "@/hooks/useImports";
import { currentMonth, daysLeftInMonth, monthLabel, naira, usd } from "@/lib/format";

const TONE = {
  over: { text: "text-expense", bar: "bg-expense" },
  near: { text: "text-warn", bar: "bg-warn" },
  ok: { text: "text-income", bar: "bg-income" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SectionTitle({ title, href, linkLabel = "See all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2.5 px-1">
      <h2 className="text-lg font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-[13px] font-bold text-primary flex items-center">
          {linkLabel} <Icon name="chevron_right" size={18} />
        </Link>
      )}
    </div>
  );
}

function QuickAction({ href, icon, label, badge, iconClass = "" }: { href: string; icon: string; label: string; badge?: number; iconClass?: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink group">
      <span className="relative w-14 h-14 rounded-full bg-surface border border-line flex items-center justify-center text-ink group-hover:bg-surface-2 transition-colors" style={{ boxShadow: "var(--shadow-card)" }}>
        <Icon name={icon} size={24} className={iconClass} />
        {!!badge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-primary text-on-primary text-[11px] font-extrabold flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const month = currentMonth();
  const { data: user } = useProfile();
  const summary = useSummary(month);
  const recent = useTransactions({ limit: 5 });
  const budgets = useBudgets(month);
  const stats = useTradeStats();
  const toReview = (useImports().data ?? []).length;

  const s = summary.data;
  const firstName = user?.name.split(" ")[0];
  const days = daysLeftInMonth();
  const usedPct = s && s.total_income > 0 ? Math.round((s.total_expenses / s.total_income) * 100) : null;
  const budgetRows = (budgets.data ?? [])
    .map((b) => ({ ...b, pct: b.limit ? (b.spent / b.limit) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
  const hasTrades = !!stats.data && stats.data.total_trades + stats.data.open_trades > 0;

  const hero = summary.isError ? (
    <ErrorState onRetry={() => summary.refetch()} />
  ) : (
    <section className="hero p-5 lg:p-7">
      <p className="text-sm font-semibold text-hero-muted">
        {s && s.net < 0 ? `Overspent in ${monthLabel(month).split(" ")[0]}` : `Left to spend in ${monthLabel(month).split(" ")[0]}`}
      </p>
      {!s ? (
        <Skeleton className="h-11 w-52 mt-2 opacity-30" />
      ) : (
        <p className="figure text-[40px] lg:text-[52px] leading-[1.05] mt-1">{naira(Math.abs(s.net))}</p>
      )}
      <p className="text-sm text-hero-muted mt-1">
        {!s
          ? " "
          : s.total_income === 0 && s.total_expenses === 0
            ? "Nothing logged yet this month"
            : usedPct !== null
              ? `You've spent ${usedPct}% of what came in · ${days} day${days === 1 ? "" : "s"} to go`
              : `${days} day${days === 1 ? "" : "s"} to go`}
      </p>
      <div className="flex flex-wrap gap-2 mt-5">
        <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold tabular-nums flex items-center gap-1">
          <Icon name="south_west" size={15} /> In {s ? naira(s.total_income) : "—"}
        </span>
        <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold tabular-nums flex items-center gap-1">
          <Icon name="north_east" size={15} /> Out {s ? naira(s.total_expenses) : "—"}
        </span>
      </div>
    </section>
  );

  const actions = (
    <div className="grid grid-cols-4 gap-2">
      <QuickAction href="/transactions/new?type=expense" icon="remove" label="Expense" iconClass="text-expense" />
      <QuickAction href="/transactions/new?type=income" icon="add" label="Income" iconClass="text-income" />
      <QuickAction href="/imports" icon="inbox" label="Inbox" badge={toReview} />
      <QuickAction href="/budgets" icon="pie_chart" label="Budgets" />
    </div>
  );

  const recentSection = (
    <section>
      <SectionTitle title="Recent" href={recent.data?.length ? "/transactions" : undefined} />
      {recent.isLoading ? (
        <SkeletonRows count={3} />
      ) : recent.isError ? (
        <ErrorState onRetry={() => recent.refetch()} />
      ) : recent.data!.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="receipt_long"
            title="No transactions yet"
            description="Log what you spend and earn. It takes about 5 seconds."
            action={{ label: "Add your first one", onClick: () => router.push("/transactions/new") }}
          />
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {recent.data!.map((tx) => <TransactionRow key={tx.id} tx={tx} showDate />)}
        </div>
      )}
    </section>
  );

  const budgetSection = budgets.data && (
    budgets.data.length === 0 ? (
      <Link href="/budgets" className="card p-4 flex items-center gap-3 hover:bg-surface-2/50">
        <div className="w-11 h-11 rounded-full bg-sun/25 text-warn flex items-center justify-center shrink-0">
          <Icon name="pie_chart" size={22} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Set monthly budgets</p>
          <p className="text-xs text-muted">Get warned before transport or food runs past its limit.</p>
        </div>
        <Icon name="chevron_right" size={20} className="text-muted" />
      </Link>
    ) : (
      <section>
        <SectionTitle title="Budgets" href="/budgets" linkLabel="Manage" />
        <div className="card px-4 divide-y divide-line">
          {budgetRows.map((b) => {
            const tone = b.pct >= 100 ? TONE.over : b.pct >= 80 ? TONE.near : TONE.ok;
            return (
              <div key={b.id} className="py-3.5 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold truncate">{b.category}</p>
                  <span className={`text-sm font-extrabold tabular-nums ${tone.text}`}>{Math.round(b.pct)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                </div>
                <p className="text-xs text-muted">
                  {b.pct >= 100
                    ? `${naira(b.spent - b.limit)} over your ${naira(b.limit)} limit`
                    : `${naira(b.limit - b.spent)} left of ${naira(b.limit)}`}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    )
  );

  const spendingSection = s && s.categories.length > 0 && (
    <section>
      <SectionTitle title="Where your money went" />
      <div className="card p-4">
        <CategoryBars categories={s.categories} limit={5} />
      </div>
    </section>
  );

  const tradingSection = hasTrades && stats.data && (
    <section>
      <SectionTitle title="Trading" href="/trades" linkLabel="Journal" />
      <Link href="/trades" className="card p-4 grid grid-cols-3 gap-2 hover:bg-surface-2/50">
        <div>
          <p className="text-xs text-muted font-semibold">Net P&L</p>
          <p className={`figure text-lg ${stats.data.total_p_l >= 0 ? "text-income" : "text-expense"}`}>
            {usd(stats.data.total_p_l, { sign: true })}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted font-semibold">Win rate</p>
          <p className="figure text-lg">{stats.data.total_trades ? `${stats.data.win_rate}%` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-semibold">Open</p>
          <p className="figure text-lg">{stats.data.open_trades}</p>
        </div>
      </Link>
    </section>
  );

  return (
    <>
      <PageHeader subtitle={greeting() + (firstName ? "," : "")} title={firstName ?? "Welcome"} />

      <div className="px-4 pb-4 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {hero}
          {actions}
          {recentSection}
          {/* On phones trading comes last; on desktop it fills the left column */}
          <div className="hidden lg:block">{tradingSection}</div>
        </div>
        <div className="flex flex-col gap-6 min-w-0">
          {budgetSection}
          {spendingSection}
          <div className="lg:hidden">{tradingSection}</div>
        </div>
      </div>
    </>
  );
}
