"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/States";
import CategoryBars from "@/components/charts/CategoryBars";
import TransactionRow from "@/components/TransactionRow";
import { useProfile } from "@/hooks/useProfile";
import { useSummary, useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useTradeStats } from "@/hooks/useTrades";
import { currentMonth, daysLeftInMonth, monthLabel, naira, usd } from "@/lib/format";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SectionTitle({ title, href, linkLabel = "See all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-2.5 px-1">
      <h2 className="font-extrabold">{title}</h2>
      {href && (
        <Link href={href} className="text-[13px] font-bold text-primary flex items-center">
          {linkLabel} <Icon name="chevron_right" size={18} />
        </Link>
      )}
    </div>
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

  const s = summary.data;
  const firstName = user?.name.split(" ")[0];
  const watch = (budgets.data ?? [])
    .map((b) => ({ ...b, pct: b.limit ? (b.spent / b.limit) * 100 : 0 }))
    .filter((b) => b.pct >= 80)
    .sort((a, b) => b.pct - a.pct);
  const hasTrades = !!stats.data && stats.data.total_trades + stats.data.open_trades > 0;

  return (
    <>
      <PageHeader
        subtitle={greeting() + (firstName ? "," : "")}
        title={firstName ?? "Welcome"}
        right={<HeaderButton icon="add" label="Add transaction" onClick={() => router.push("/transactions/new")} />}
      />

      <div className="px-4 flex flex-col gap-6 pb-4">
        {/* ── This month ─────────────────────────────── */}
        {summary.isError ? (
          <ErrorState onRetry={() => summary.refetch()} />
        ) : (
          <section className="card p-5">
            <p className="text-sm text-muted font-semibold">{monthLabel(month)}</p>
            {!s ? (
              <Skeleton className="h-10 w-48 mt-2" />
            ) : (
              <>
                <p className={`text-[34px] font-extrabold tabular-nums leading-tight mt-1 ${s.net < 0 ? "text-expense" : ""}`}>
                  {naira(Math.abs(s.net))}
                </p>
                <p className="text-sm text-muted">
                  {s.total_income === 0 && s.total_expenses === 0
                    ? "Nothing logged yet this month"
                    : s.net >= 0 ? "left over after spending" : "more spent than earned"}
                </p>
              </>
            )}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl bg-bg/50 px-3.5 py-3">
                <p className="text-xs text-muted font-semibold flex items-center gap-1">
                  <Icon name="south_west" size={14} className="text-income" /> Money in
                </p>
                <p className="font-bold tabular-nums mt-0.5">{s ? naira(s.total_income) : "—"}</p>
              </div>
              <div className="rounded-xl bg-bg/50 px-3.5 py-3">
                <p className="text-xs text-muted font-semibold flex items-center gap-1">
                  <Icon name="north_east" size={14} className="text-expense" /> Money out
                </p>
                <p className="font-bold tabular-nums mt-0.5">{s ? naira(s.total_expenses) : "—"}</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-3 -mt-2">
          <Link href="/transactions/new?type=expense" className="btn-ghost py-3.5 text-sm">
            <Icon name="remove" size={18} className="text-expense" /> Add expense
          </Link>
          <Link href="/transactions/new?type=income" className="btn-ghost py-3.5 text-sm">
            <Icon name="add" size={18} className="text-income" /> Add income
          </Link>
        </div>

        {/* ── Budget watch ───────────────────────────── */}
        {budgets.data && budgets.data.length === 0 && (
          <Link href="/budgets" className="card p-4 flex items-center gap-3 hover:bg-surface-2/50">
            <div className="w-10 h-10 rounded-full bg-warn/10 text-warn flex items-center justify-center shrink-0">
              <Icon name="pie_chart" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Set monthly budgets</p>
              <p className="text-xs text-muted">Get warned before transport or food runs past its limit.</p>
            </div>
            <Icon name="chevron_right" size={20} className="text-muted" />
          </Link>
        )}
        {watch.length > 0 && (
          <section>
            <SectionTitle title="Budget alerts" href="/budgets" linkLabel="Budgets" />
            <div className="card divide-y divide-line">
              {watch.map((b) => {
                const over = b.pct >= 100;
                return (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <Icon name={over ? "error" : "warning"} size={20} className={over ? "text-expense" : "text-warn"} filled />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{b.category}</p>
                      <p className="text-xs text-muted">
                        {over
                          ? `${naira(b.spent - b.limit)} over your ${naira(b.limit)} limit`
                          : `${naira(b.limit - b.spent)} left for ${daysLeftInMonth()} more day${daysLeftInMonth() === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <span className={`text-sm font-extrabold tabular-nums ${over ? "text-expense" : "text-warn"}`}>{Math.round(b.pct)}%</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Spending breakdown ─────────────────────── */}
        {s && s.categories.length > 0 && (
          <section>
            <SectionTitle title="Where your money went" />
            <div className="card p-4">
              <CategoryBars categories={s.categories} limit={5} />
            </div>
          </section>
        )}

        {/* ── Recent ─────────────────────────────────── */}
        <section>
          <SectionTitle title="Recent transactions" href={recent.data?.length ? "/transactions" : undefined} />
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

        {/* ── Trading snapshot ───────────────────────── */}
        {hasTrades && stats.data && (
          <section>
            <SectionTitle title="Trading" href="/trades" linkLabel="Journal" />
            <Link href="/trades" className="card p-4 grid grid-cols-3 gap-2 hover:bg-surface-2/50">
              <div>
                <p className="text-xs text-muted font-semibold">Net P&L</p>
                <p className={`font-extrabold tabular-nums ${stats.data.total_p_l >= 0 ? "text-income" : "text-expense"}`}>
                  {usd(stats.data.total_p_l, { sign: true })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted font-semibold">Win rate</p>
                <p className="font-extrabold tabular-nums">{stats.data.total_trades ? `${stats.data.win_rate}%` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted font-semibold">Open</p>
                <p className="font-extrabold tabular-nums">{stats.data.open_trades}</p>
              </div>
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
