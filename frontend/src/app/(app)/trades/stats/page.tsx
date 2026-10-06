"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Controls";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import AreaChart from "@/components/charts/AreaChart";
import { useTradeAnalytics, useTradeStats } from "@/hooks/useTrades";
import { usd } from "@/lib/format";
import type { GroupStat } from "@/lib/types";

type Period = "month" | "3m" | "year" | "all";

function Breakdown({ title, rows }: { title: string; rows: GroupStat[] }) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="font-extrabold px-1 mb-2">{title}</h2>
      <div className="card divide-y divide-line overflow-hidden">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{r.name}</p>
              <p className="text-xs text-muted">{r.trades} trade{r.trades === 1 ? "" : "s"} · {r.win_rate}% won</p>
            </div>
            <span className={`font-bold tabular-nums ${r.p_l > 0 ? "text-income" : r.p_l < 0 ? "text-expense" : "text-muted"}`}>
              {usd(r.p_l, { sign: true })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TradeStatsPage() {
  const [period, setPeriod] = useState<Period>("3m");
  const { data, isLoading, isError, refetch } = useTradeAnalytics(period);
  const { data: stats } = useTradeStats();

  return (
    <>
      <PageHeader title="Performance" back />
      <div className="px-4 flex flex-col gap-5 pb-6">
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: "month", label: "30 days" },
            { value: "3m", label: "3 months" },
            { value: "year", label: "1 year" },
            { value: "all", label: "All" },
          ]}
        />

        {isLoading ? (
          <Skeleton className="h-56 rounded-2xl" />
        ) : isError || !data ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data.cumulative_p_l.length === 0 ? (
          <div className="card">
            <EmptyState icon="insights" title="No closed trades in this period" description="Close some trades to see your equity curve and what's working." />
          </div>
        ) : (
          <>
            <section className="card p-4">
              <p className="text-sm text-muted font-semibold">P&L over period</p>
              <p className={`text-[28px] font-extrabold tabular-nums ${data.total_p_l >= 0 ? "text-income" : "text-expense"}`}>
                {usd(data.total_p_l, { sign: true })}
              </p>
              <div className="mt-3"><AreaChart data={data.cumulative_p_l} /></div>
            </section>

            {stats && (
              <section className="grid grid-cols-2 gap-3">
                {[
                  { label: "Best trade", value: stats.best_trade != null ? usd(stats.best_trade, { sign: true }) : "—" },
                  { label: "Worst trade", value: stats.worst_trade != null ? usd(stats.worst_trade, { sign: true }) : "—" },
                  { label: "Avg planned R:R", value: stats.avg_rr != null ? `1 : ${stats.avg_rr}` : "—" },
                  { label: "Profit factor", value: stats.profit_factor != null ? stats.profit_factor.toFixed(2) : "—" },
                ].map((s) => (
                  <div key={s.label} className="card px-4 py-3">
                    <p className="text-xs text-muted font-semibold">{s.label}</p>
                    <p className="font-extrabold tabular-nums mt-0.5">{s.value}</p>
                  </div>
                ))}
              </section>
            )}

            <Breakdown title="By instrument" rows={data.by_pair} />
            <Breakdown title="By session" rows={data.by_session} />
            <Breakdown title="By strategy" rows={data.by_strategy} />
          </>
        )}
      </div>
    </>
  );
}
