"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/useTrades";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/charts/LineChart";

export default function ForexAnalyticsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedFilter] = useState("3m");
  const { useAnalytics } = useTrades();
  const { data: analytics, isLoading } = useAnalytics(selectedPeriod);

  const cumulativePL = analytics?.cumulative_p_l ?? [];
  const sessionPerformance = analytics?.session_performance ?? [];
  const strategyPerformance = analytics?.strategy_performance ?? [];

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <button onClick={() => router.back()} className="text-on-surface hover:text-primary flex items-center p-2">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-headline-sm font-bold text-on-surface">P&L Analytics</h2>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      {/* Cumulative Line Chart */}
      <GlassCard className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Cumulative Performance</span>
          <div className="flex bg-surface-container p-0.5 rounded-lg border border-white/5 h-8 items-center">
            {["week", "month", "3m", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedFilter(period)}
                className={`px-2 h-full rounded text-[10px] font-bold uppercase transition-all ${
                  selectedPeriod === period
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-[160px] flex items-center justify-center text-outline text-body-sm">
            Calculating performance data...
          </div>
        ) : (
          <LineChart data={cumulativePL} />
        )}
      </GlassCard>

      {/* Session Metrics list */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-headline-sm font-headline-sm text-on-surface pl-1">Trading Sessions</h3>
        <div className="flex flex-col gap-2">
          {sessionPerformance.map((sess: any) => {
            const isProfit = sess.value >= 0;
            return (
              <div key={sess.name} className="glass-card glass-edge p-4 rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-body-sm font-bold text-on-surface">{sess.name}</span>
                  <span className="text-[10px] text-outline mt-0.5 font-semibold uppercase">
                    {sess.trades} Trades Logged
                  </span>
                </div>
                <span className={`text-body-md font-bold font-data-lg ${isProfit ? "text-tertiary" : "text-error"}`}>
                  {isProfit ? "+" : ""}${sess.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strategy Performance */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-headline-sm font-headline-sm text-on-surface pl-1">Strategy Performance</h3>
        <div className="flex flex-col bg-surface-container/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          {strategyPerformance.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-6">No strategies journaled yet.</div>
          ) : (
            strategyPerformance.map((strat: any) => {
              const isProfit = strat.p_l >= 0;
              return (
                <div key={strat.name} className="flex justify-between items-center px-4 py-4">
                  <span className="text-body-sm font-semibold text-on-surface">{strat.name}</span>
                  <span className={`text-body-sm font-bold font-data-lg ${isProfit ? "text-tertiary" : "text-error"}`}>
                    {isProfit ? "+" : ""}${strat.p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
