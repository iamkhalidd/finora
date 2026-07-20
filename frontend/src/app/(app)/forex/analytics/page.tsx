"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/useTrades";
import GlassCard from "@/components/ui/GlassCard";
import LineChart from "@/components/charts/LineChart";
import { SkeletonHeroCard, SkeletonRow } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

export default function ForexAnalyticsPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("3m");
  const { useAnalytics } = useTrades();
  const { data: analytics, isLoading } = useAnalytics(selectedPeriod);

  const cumulativePL = analytics?.cumulative_p_l ?? [];
  const sessionPerformance = analytics?.session_performance ?? [];
  const strategyPerformance = analytics?.strategy_performance ?? [];

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full animate-fadeIn">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-3 border-b border-white/5">
        <button onClick={() => router.back()} className="text-on-surface hover:text-primary flex items-center p-2 rounded-full hover:bg-white/5 transition-colors">
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
                onClick={() => setSelectedPeriod(period)}
                className={`px-2 h-full rounded text-[10px] font-bold uppercase transition-all ${
                  selectedPeriod === period
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-outline hover:text-on-surface-variant"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-[160px] flex items-center justify-center text-outline text-body-sm">
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
            Calculating performance data...
          </div>
        ) : cumulativePL.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-outline text-body-sm border border-dashed border-white/5 rounded-xl">
            No trade data logged for this period.
          </div>
        ) : (
          <LineChart data={cumulativePL} />
        )}
      </GlassCard>

      {/* Session Metrics list */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-headline-sm font-bold text-on-surface pl-1">Trading Sessions</h3>
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : sessionPerformance.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-6 bg-surface-container/30 rounded-2xl border border-white/5">
              No session data.
            </div>
          ) : (
            sessionPerformance.map((sess: any, i: number) => {
              const isProfit = sess.value >= 0;
              return (
                <div key={sess.name} className="stagger-item glass-card glass-edge p-4 rounded-xl flex items-center justify-between" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex flex-col">
                    <span className="text-body-sm font-bold text-on-surface">{sess.name}</span>
                    <span className="text-[10px] text-outline mt-0.5 font-semibold uppercase">
                      {sess.trades} Trades Logged
                    </span>
                  </div>
                  <span className={`text-body-md font-bold font-mono ${isProfit ? "text-tertiary" : "text-error"}`}>
                    {isProfit ? "+" : ""}₦{sess.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Strategy Performance */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-headline-sm font-bold text-on-surface pl-1">Strategy Performance</h3>
        <div className="flex flex-col bg-surface-container/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          {isLoading ? (
            <div className="p-4 flex flex-col gap-3">
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ) : strategyPerformance.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-6">No strategies journaled yet.</div>
          ) : (
            strategyPerformance.map((strat: any, i: number) => {
              const isProfit = strat.p_l >= 0;
              return (
                <div key={strat.name} className="flex justify-between items-center px-4 py-4 hover:bg-white/[0.01] transition-colors stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
                  <span className="text-body-sm font-semibold text-on-surface">{strat.name}</span>
                  <span className={`text-body-sm font-bold font-mono ${isProfit ? "text-tertiary" : "text-error"}`}>
                    {isProfit ? "+" : ""}₦{strat.p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
