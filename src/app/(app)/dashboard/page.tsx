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

export default function DashboardPage() {
  const router = useRouter();
  const notificationCount = useStore((state) => state.notificationCount);
  const { transactions, summary: txSummary, isLoading: isTxLoading } = useTransactions({ limit: 3 });

  // Load hero and dashboard summary numbers
  const { data: dashboardSummary, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get("/api/v1/dashboard/summary");
      return response.data;
    },
  });

  // Load user profile details
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
  const userName = userProfile?.name ?? "Khalid";

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-label-xs font-label-xs text-on-surface-variant">Good morning,</span>
            <span className="text-headline-sm font-headline-sm text-primary tracking-tight">{userName}</span>
          </div>
        </div>
        <Link href="/alerts" className="text-primary hover:opacity-80 transition-opacity relative p-2">
          <span className="material-symbols-outlined text-[24px]">notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full animate-pulse" />
          )}
        </Link>
      </header>

      {/* Hero Balance Card */}
      <GlassCard primary>
        <p className="text-body-sm font-body-sm text-on-surface-variant z-10">Total Balance</p>
        <h1 className="text-display-lg font-display-lg text-on-surface z-10 font-data-lg mt-1">
          ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h1>
        <div className="flex gap-2 mt-4 z-10">
          <div className="bg-tertiary/10 border border-tertiary/20 px-3 py-1.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-tertiary">trending_up</span>
            <span className="text-label-xs font-label-xs text-tertiary">
              +${totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-error/10 border border-error/20 px-3 py-1.5 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-error">trending_down</span>
            <span className="text-label-xs font-label-xs text-error">
              -${totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Quick Action Buttons */}
      <section className="grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/transactions/add?type=income")}
          className="flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-white/5 py-4 px-4 rounded-xl text-primary font-bold text-body-sm transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Add Income
        </button>
        <button
          onClick={() => router.push("/transactions/add?type=expense")}
          className="flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high border border-white/5 py-4 px-4 rounded-xl text-error font-bold text-body-sm transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[20px]">remove_circle</span>
          Add Expense
        </button>
      </section>

      {/* Spending Overview with Donut Chart */}
      <GlassCard className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-headline-sm font-headline-sm text-on-surface">Monthly Spending</h3>
          <span className="text-label-xs font-label-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full uppercase">
            Month
          </span>
        </div>

        <DonutChart
          data={txSummary.categories}
          centerLabel="Total Spent"
          centerValue={`$${totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        />

        {/* Legend listing */}
        <div className="flex flex-col gap-2 mt-2">
          {txSummary.categories.slice(0, 3).map((cat: any, index: number) => {
            const colors = ["#9bcaff", "#adc8f5", "#49df9b", "#ffb4ab"];
            return (
              <div key={cat.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-body-sm text-on-surface-variant">{cat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-body-sm text-on-surface font-semibold font-data-lg">
                    ${cat.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-label-xs text-outline font-bold">{cat.percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent Transactions List */}
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-headline-sm font-headline-sm text-on-surface">Recent Transactions</h3>
          <Link href="/transactions" className="text-primary hover:underline text-label-xs font-bold uppercase tracking-wider">
            See All
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {isTxLoading ? (
            <div className="text-center text-outline text-body-sm py-4">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-outline text-body-sm py-6 bg-surface-container/30 rounded-xl border border-white/5">
              No transactions added yet.
            </div>
          ) : (
            transactions.map((tx: any) => {
              const isIncome = tx.type === "income";
              return (
                <div
                  key={tx.id}
                  className="glass-card glass-edge rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isIncome ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {isIncome ? "download" : "upload"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-body-sm font-bold text-on-surface">{tx.category}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-body-md font-semibold font-data-lg ${isIncome ? "text-tertiary" : "text-error"}`}>
                    {isIncome ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
