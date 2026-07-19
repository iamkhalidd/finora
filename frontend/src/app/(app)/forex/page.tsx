"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/useTrades";
import { api } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";

interface LivePrice {
  pair: string;
  price: number;
  change: number;
  high: number;
  low: number;
}

export default function ForexJournalPage() {
  const router = useRouter();
  const { trades, stats, isLoading, deleteTrade } = useTrades(5);
  const [prices, setPrices] = useState<{ [key: string]: LivePrice }>({});

  // Periodic price fetcher (every 30 seconds)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await api.get("/api/v1/forex/prices?pairs=XAUUSD,EURUSD,GBPJPY");
        setPrices(response.data);
      } catch (err) {
        console.error("Failed to load prices", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold">Forex Journal</h1>
        <Link href="/forex/analytics" className="p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary">
          <span className="material-symbols-outlined text-[20px]">analytics</span>
        </Link>
      </header>

      {/* 2x2 Stats Grid */}
      <section className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Win Rate</span>
          <span className="text-xl font-bold font-data-lg text-primary">{stats.win_rate}%</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total P&L</span>
          <span className={`text-xl font-bold font-data-lg ₦{stats.total_p_l >= 0 ? "text-tertiary" : "text-error"}`}>
            {stats.total_p_l >= 0 ? "+" : ""}₦{stats.total_p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Avg RR</span>
          <span className="text-xl font-bold font-data-lg text-on-surface">1:{stats.avg_rr}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Trades</span>
          <span className="text-xl font-bold font-data-lg text-on-surface">{stats.total_trades}</span>
        </GlassCard>
      </section>

      {/* Live Market Prices Scrollable Row */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-headline-sm font-headline-sm text-on-surface">Live Market Prices</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none">
          {["XAUUSD", "EURUSD", "GBPJPY"].map((pair) => {
            const lPrice = prices[pair];
            const isUp = lPrice ? lPrice.change >= 0 : true;
            return (
              <div
                key={pair}
                className="glass-panel glass-edge p-4 rounded-xl min-w-[150px] snap-center flex flex-col gap-1 bg-surface-container/60 hover:bg-white/[0.02]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-on-surface-variant">{pair}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ₦{
                    isUp ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                  }`}>
                    {isUp ? "+" : ""}{lPrice ? lPrice.change : "0.00"}%
                  </span>
                </div>
                <h4 className="text-[15px] font-bold font-data-lg text-on-surface mt-1.5">
                  {lPrice ? lPrice.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "..."}
                </h4>
                <div className="flex justify-between items-center text-[9px] text-outline mt-1 font-semibold">
                  <span>H: {lPrice ? lPrice.high : "..."}</span>
                  <span>L: {lPrice ? lPrice.low : "..."}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Trades Logs list */}
      <section className="flex flex-col gap-3">
        <h3 className="text-headline-sm font-headline-sm text-on-surface">Recent Trades</h3>
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="text-center text-outline text-body-sm py-4">Loading trades...</div>
          ) : trades.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-8 bg-surface-container/30 rounded-xl border border-white/5">
              No trades logged yet. Click log trade to start journaling!
            </div>
          ) : (
            trades.map((t: any) => {
              const isProfit = t.p_l >= 0;
              return (
                <div
                  key={t.id}
                  onClick={() => router.push(`/forex/₦{t.id}`)}
                  className="glass-panel glass-edge rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[12px] ₦{
                      t.direction === "BUY" ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                    }`}>
                      {t.direction}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-body-sm font-bold text-on-surface">{t.pair}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase bg-white/5 px-2 py-0.5 rounded-full">
                          {t.session}
                        </span>
                      </div>
                      <span className="text-[11px] text-outline mt-0.5 font-medium">
                        Entry: {t.entry_price} • Lot: {t.lot_size}
                      </span>
                    </div>
                  </div>

                  <span className={`text-body-md font-semibold font-data-lg ₦{isProfit ? "text-tertiary" : "text-error"}`}>
                    {isProfit ? "+" : ""}₦{t.p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Persistent Floating Log Button */}
      <Link
        href="/forex/add"
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-30"
      >
        <span className="material-symbols-outlined text-[28px] font-bold">add</span>
      </Link>
    </div>
  );
}
