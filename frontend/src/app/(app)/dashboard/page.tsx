"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTransactions } from "@/hooks/useTransactions";
import { useStore } from "@/hooks/useStore";
import GlassCard from "@/components/ui/GlassCard";
import DonutChart from "@/components/charts/DonutChart";
import { SkeletonHeroCard, SkeletonRow, SkeletonStatCard } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const notificationCount = useStore((state) => state.notificationCount);
  const { transactions, summary: txSummary, isLoading: isTxLoading } = useTransactions({ limit: 4 });

  const { data: dashboardSummary, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get("/api/v1/dashboard/summary");
      return response.data;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get("/api/v1/users/me");
      return response.data;
    },
  });

  const totalBalance = dashboardSummary?.total_balance ?? 0.0;
  const totalIncome = dashboardSummary?.total_income ?? 0.0;
  const totalExpenses = dashboardSummary?.total_expenses ?? 0.0;
  const userName = userProfile?.name ?? "Trader";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-5 px-container-padding pt-[76px] pb-28 w-full animate-fadeIn">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex justify-between items-center px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-outline uppercase tracking-widest">
            {getGreeting()},
          </span>
          <span className="text-headline-sm font-bold text-primary tracking-tight leading-tight">
            {userName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <Link href="/alerts" className="relative w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-white/5 hover:border-primary/30 transition-all">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications</span>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-background animate-pulse" />
            )}
          </Link>

          {/* Avatar / account link */}
          <Link href="/account"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-container text-on-primary text-[15px] font-black border border-primary/20 shadow-glow-primary"
          >
            {userInitial}
          </Link>
        </div>
      </header>

      {/* ── Hero Balance Card ───────────────────────────── */}
      {isDashboardLoading ? (
        <SkeletonHeroCard />
      ) : (
        <GlassCard primary className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest z-10 relative">
            Total Balance
          </p>
          <h1 className="font-mono text-[38px] font-bold text-on-surface z-10 relative mt-1 leading-none tracking-tight">
            ₦{totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          <div className="flex gap-2.5 mt-4 z-10 relative">
            <div className="bg-tertiary/10 border border-tertiary/25 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
              <span className="text-[12px] font-bold text-tertiary font-mono">
                +₦{totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-tertiary/60 font-semibold">income</span>
            </div>
            <div className="bg-error/10 border border-error/25 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_downward</span>
              <span className="text-[12px] font-bold text-error font-mono">
                -₦{totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-error/60 font-semibold">spent</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── Quick Actions ──────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <button
          onClick={() => router.push("/transactions/add?type=income")}
          className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border border-tertiary/20 bg-tertiary/8 text-tertiary font-bold text-body-sm transition-all hover:bg-tertiary/15 active:scale-95 shadow-md"
          style={{ backgroundColor: "rgba(73,223,155,0.07)" }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
          Add Income
        </button>
        <button
          onClick={() => router.push("/transactions/add?type=expense")}
          className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border border-error/20 text-error font-bold text-body-sm transition-all hover:bg-error/10 active:scale-95 shadow-md"
          style={{ backgroundColor: "rgba(255,180,171,0.07)" }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>remove_circle</span>
          Add Expense
        </button>
      </section>

      {/* ── Spending Donut ─────────────────────────────── */}
      <GlassCard className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <div className="flex justify-between items-center">
          <h2 className="text-headline-sm font-bold text-on-surface">Monthly Spending</h2>
          <span className="text-[10px] font-bold text-outline bg-surface-container px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/5">
            This Month
          </span>
        </div>

        <DonutChart
          data={txSummary.categories}
          centerLabel="Total Spent"
          centerValue={`₦${totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        />

        {/* Legend */}
        <div className="flex flex-col gap-2.5 mt-1">
          {txSummary.categories.slice(0, 4).map((cat: any, index: number) => {
            const colors = ["#9bcaff", "#adc8f5", "#49df9b", "#ffb4ab", "#5ba3e8"];
            return (
              <div key={cat.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="text-body-sm text-on-surface-variant">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-body-sm text-on-surface font-bold font-mono">
                    ₦{cat.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[11px] text-outline font-bold w-8 text-right">{cat.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* ── Recent Transactions ────────────────────────── */}
      <section className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <div className="flex justify-between items-center">
          <h2 className="text-headline-sm font-bold text-on-surface">Recent Transactions</h2>
          <Link href="/transactions" className="text-primary text-[11px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity flex items-center gap-0.5">
            See All
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {isTxLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No transactions yet"
              description="Start tracking your money by adding your first transaction."
              actionLabel="Add Transaction"
              onAction={() => router.push("/transactions/add")}
            />
          ) : (
            transactions.map((tx: any, i: number) => {
              const isIncome = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="stagger-item glass-card glass-edge rounded-xl p-4 flex items-center justify-between hover:border-white/15 transition-colors"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                    }`}>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isIncome ? "arrow_downward" : "arrow_upward"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body-sm font-bold text-on-surface">{tx.category}</span>
                      <span className="text-[11px] text-outline font-medium">
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className={`font-mono text-[15px] font-bold ${isIncome ? "text-tertiary" : "text-error"}`}>
                    {isIncome ? "+" : "-"}₦{tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
