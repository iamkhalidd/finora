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
import type { Direction } from "@/lib/types";

function Side({ direction }: { direction: Direction }) {
  return (
    <span className={`inline-block w-12 text-center rounded-lg py-1 text-[11px] font-extrabold shrink-0 ${direction === "BUY" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
      {direction}
    </span>
  );
}

function Result({ pnl }: { pnl: number | null }) {
  if (pnl === null) return <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1">Open</span>;
  return (
    <span className={`text-[15px] font-bold tabular-nums whitespace-nowrap ${pnl > 0 ? "text-income" : pnl < 0 ? "text-expense" : "text-muted"}`}>
      {usd(pnl, { sign: true })}
    </span>
  );
}

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
        <section className="hero p-5 lg:p-6">
          <p className="text-sm font-semibold text-hero-muted">Net P&L in USD, closed trades</p>
          {stats ? (
            <p className="figure text-[38px] lg:text-[46px] leading-[1.05] mt-1">{usd(stats.total_p_l, { sign: true })}</p>
          ) : (
            <Skeleton className="h-10 w-40 mt-2 opacity-30" />
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { label: "Win rate", value: stats?.total_trades ? `${stats.win_rate}%` : "—" },
              { label: "Won / lost", value: stats ? `${stats.wins} / ${stats.losses}` : "—" },
              { label: "Profit factor", value: stats?.profit_factor != null ? stats.profit_factor.toFixed(2) : "—" },
            ].map((s) => (
              <span key={s.label} className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold tabular-nums">
                <span className="text-hero-muted">{s.label}</span> {s.value}
              </span>
            ))}
          </div>
        </section>

        <div className="lg:w-96">
          <Segmented<TradeFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "open", label: `Open${stats?.open_trades ? ` (${stats.open_trades})` : ""}` },
              { value: "closed", label: "Closed" },
            ]}
          />
        </div>

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
          <>
            <div className="card divide-y divide-line overflow-hidden lg:hidden">
              {trades.data!.map((t) => {
                const open = t.exit_price == null;
                return (
                  <Link key={t.id} href={`/trades/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2/50">
                    <Side direction={t.direction} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{t.pair} <span className="text-muted font-semibold">· {t.lot_size} lot{t.lot_size === 1 ? "" : "s"}</span></p>
                      <p className="text-xs text-muted truncate">{[shortDate(t.date), t.session, t.strategy].filter(Boolean).join(" · ")}</p>
                    </div>
                    <Result pnl={open ? null : t.p_l} />
                  </Link>
                );
              })}
            </div>
            <div className="hidden lg:block card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-line">
                    <th className="font-semibold px-4 py-3">Date</th>
                    <th className="font-semibold px-4 py-3">Instrument</th>
                    <th className="font-semibold px-4 py-3">Side</th>
                    <th className="font-semibold px-4 py-3 text-right">Lots</th>
                    <th className="font-semibold px-4 py-3">Session</th>
                    <th className="font-semibold px-4 py-3">Strategy</th>
                    <th className="font-semibold px-4 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {trades.data!.map((t) => (
                    <tr key={t.id} onClick={() => router.push(`/trades/${t.id}`)} className="cursor-pointer hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{shortDate(t.date)}</td>
                      <td className="px-4 py-3 font-bold">
                        <Link href={`/trades/${t.id}`} onClick={(e) => e.stopPropagation()}>{t.pair}</Link>
                      </td>
                      <td className="px-4 py-3"><Side direction={t.direction} /></td>
                      <td className="px-4 py-3 text-right tabular-nums">{t.lot_size}</td>
                      <td className="px-4 py-3 text-muted">{t.session}</td>
                      <td className="px-4 py-3 text-muted max-w-[200px] truncate">{t.strategy ?? "—"}</td>
                      <td className="px-4 py-3 text-right"><Result pnl={t.exit_price == null ? null : t.p_l} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </>
  );
}
