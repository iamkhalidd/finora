"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/useTrades";
import { api } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import { SkeletonRow, SkeletonStatCard } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

interface LivePrice {
  pair: string;
  price: number;
  change: number;
  high: number;
  low: number;
}

const STAT_ICONS: Record<string, string> = {
  "Win Rate": "emoji_events",
  "Total P&L": "account_balance",
  "Avg RR": "balance",
  "Total Trades": "receipt_long",
};

export default function ForexJournalPage() {
  const router = useRouter();
  const { trades, stats, isLoading, deleteTrade } = useTrades(5);
  const [prices, setPrices] = useState<{ [key: string]: LivePrice }>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await api.get("/api/v1/forex/prices?pairs=XAUUSD,EURUSD,GBPJPY");
        setPrices(response.data);
      } catch (err) {
        console.error("Failed to load prices", err);
      } finally {
        setPricesLoading(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: "Win Rate",     value: `${stats.win_rate}%`,    color: "text-primary" },
    { label: "Total P&L",   value: `${stats.total_p_l >= 0 ? "+" : ""}₦${stats.total_p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: stats.total_p_l >= 0 ? "text-tertiary" : "text-error" },
    { label: "Avg RR",      value: `1:${stats.avg_rr}`,      color: "text-on-surface" },
    { label: "Total Trades",value: `${stats.total_trades}`,  color: "text-on-surface" },
  ];

  return (
    <div className="flex flex-col gap-5 px-container-padding pt-[76px] pb-28 w-full animate-fadeIn">
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex justify-between items-center px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-headline-lg font-bold text-on-surface">Forex Journal</h1>
        <Link
          href="/forex/analytics"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">analytics</span>
        </Link>
      </header>

      {/* ── Stats Grid ──────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3">
        {statCards.map((stat, i) => (
          <GlassCard
            key={stat.label}
            className="flex flex-col gap-1.5 stagger-item"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-outline">
                {STAT_ICONS[stat.label]}
              </span>
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
            <span className={`font-mono text-[22px] font-black ${stat.color} leading-none`}>
              {stat.value}
            </span>
          </GlassCard>
        ))}
      </section>

      {/* ── Live Prices ─────────────────────────────────── */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-headline-sm font-bold text-on-surface">Live Prices</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
          {pricesLoading
            ? [1, 2, 3].map((k) => (
                <div key={k} className="glass-panel glass-edge rounded-xl p-4 min-w-[150px] snap-center flex flex-col gap-2">
                  <div className="skeleton h-3 w-12 rounded-full" />
                  <div className="skeleton h-5 w-20 rounded-md" />
                  <div className="skeleton h-3 w-24 rounded-full" />
                </div>
              ))
            : ["XAUUSD", "EURUSD", "GBPJPY"].map((pair) => {
                const lp = prices[pair];
                const isUp = lp ? lp.change >= 0 : true;
                return (
                  <div
                    key={pair}
                    className="glass-panel glass-edge p-4 rounded-xl min-w-[155px] snap-center flex flex-col gap-1.5 hover:border-white/15 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-on-surface-variant tracking-wide">{pair}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isUp ? "bg-tertiary/15 text-tertiary" : "bg-error/15 text-error"
                      }`}>
                        {isUp ? "+" : ""}{lp ? lp.change : "0.00"}%
                      </span>
                    </div>
                    <span className="font-mono text-[17px] font-bold text-on-surface">
                      {lp ? lp.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </span>
                    <div className="flex justify-between text-[10px] text-outline font-semibold">
                      <span>H: {lp ? lp.high : "—"}</span>
                      <span>L: {lp ? lp.low : "—"}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>

      {/* ── Recent Trades ──────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-headline-sm font-bold text-on-surface">Recent Trades</h2>
        <div className="flex flex-col gap-2">
          {isLoading ? (
            [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
          ) : trades.length === 0 ? (
            <EmptyState
              icon="monitoring"
              title="No trades logged yet"
              description="Start your forex journal by logging your first trade."
              actionLabel="Log a Trade"
              onAction={() => router.push("/forex/add")}
            />
          ) : (
            trades.map((t: any, i: number) => {
              const isProfit = t.p_l >= 0;
              const isBuy = t.direction === "BUY";
              const isConfirming = deletingId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => !isConfirming && router.push(`/forex/${t.id}`)}
                  className="stagger-item glass-panel glass-edge rounded-xl p-4 flex items-center justify-between hover:border-white/15 cursor-pointer transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[11px] tracking-wide ${
                      isBuy ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                    }`}>
                      {t.direction}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body-sm font-bold text-on-surface">{t.pair}</span>
                        <span className="text-[10px] font-bold text-outline bg-white/5 px-2 py-0.5 rounded-full uppercase">
                          {t.session}
                        </span>
                      </div>
                      <span className="text-[11px] text-outline font-medium mt-0.5">
                        Entry: {t.entry_price} · Lot: {t.lot_size}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`font-mono text-[15px] font-bold ${isProfit ? "text-tertiary" : "text-error"}`}>
                      {isProfit ? "+" : ""}₦{t.p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { deleteTrade(t.id); setDeletingId(null); }}
                          className="text-[11px] font-bold text-error bg-error/10 border border-error/30 px-2 py-1 rounded-lg"
                        >Delete</button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[11px] font-bold text-outline px-2 py-1"
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-outline/40 hover:text-error hover:bg-error/10 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── FAB ───────────────────────────────────────── */}
      <Link
        href="/forex/add"
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-glow-primary hover:scale-105 active:scale-95 transition-transform z-30"
      >
        <span className="material-symbols-outlined text-[26px]">add</span>
      </Link>
    </div>
  );
}
