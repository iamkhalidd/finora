"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Controls";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/States";
import { TradeFilter, useTradeStats, useTrades } from "@/hooks/useTrades";
import { shortDate, usd } from "@/lib/format";

export default function TradesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<TradeFilter>("all");
  const trades = useTrades(filter);
  const { data: stats } = useTradeStats();

  return (
    <>
      <PageHeader
        title="Trading journal"
        right={<HeaderButton icon="insights" label="Performance" onClick={() => router.push("/trades/stats")} />}
      />

      <div className="px-4 flex flex-col gap-4 pb-4">
        <section className="card p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted font-semibold">Net P&L (closed trades)</p>
              {stats ? (
                <p className={`text-[30px] font-extrabold tabular-nums leading-tight mt-0.5 ${stats.total_p_l > 0 ? "text-income" : stats.total_p_l < 0 ? "text-expense" : ""}`}>
                  {usd(stats.total_p_l, { sign: true })}
                </p>
              ) : (
                <Skeleton className="h-9 w-36 mt-1" />
              )}
            </div>
            <span className="text-[11px] font-bold text-muted bg-surface-2 rounded-full px-2.5 py-1">USD</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[
              { label: "Win rate", value: stats?.total_trades ? `${stats.win_rate}%` : "—" },
              { label: "Won / lost", value: stats ? `${stats.wins} / ${stats.losses}` : "—" },
              { label: "Profit factor", value: stats?.profit_factor != null ? stats.profit_factor.toFixed(2) : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-bg/50 py-2.5">
                <p className="font-extrabold tabular-nums">{s.value}</p>
                <p className="text-[11px] text-muted font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <Segmented<TradeFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "open", label: `Open${stats?.open_trades ? ` (${stats.open_trades})` : ""}` },
            { value: "closed", label: "Closed" },
          ]}
        />

        {trades.isLoading ? (
          <SkeletonRows count={5} />
        ) : trades.isError ? (
          <ErrorState onRetry={() => trades.refetch()} />
        ) : trades.data!.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="candlestick_chart"
              title={filter === "open" ? "No open trades" : filter === "closed" ? "No closed trades" : "Your journal is empty"}
              description={filter === "all" ? "Log every trade, wins and losses alike. Patterns show up after 20 or so." : undefined}
              action={filter === "all" ? { label: "Log a trade", onClick: () => router.push("/trades/new") } : undefined}
            />
          </div>
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {trades.data!.map((t) => {
              const open = t.exit_price == null;
              return (
                <Link key={t.id} href={`/trades/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2/50">
                  <span className={`w-12 text-center rounded-lg py-1 text-[11px] font-extrabold shrink-0 ${t.direction === "BUY" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
                    {t.direction}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{t.pair} <span className="text-muted font-semibold">· {t.lot_size} lot{t.lot_size === 1 ? "" : "s"}</span></p>
                    <p className="text-xs text-muted truncate">{[shortDate(t.date), t.session, t.strategy].filter(Boolean).join(" · ")}</p>
                  </div>
                  {open ? (
                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1">Open</span>
                  ) : (
                    <span className={`text-[15px] font-bold tabular-nums ${t.p_l > 0 ? "text-income" : t.p_l < 0 ? "text-expense" : "text-muted"}`}>
                      {usd(t.p_l, { sign: true })}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </>
  );
}
