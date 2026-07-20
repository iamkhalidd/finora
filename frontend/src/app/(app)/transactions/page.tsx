"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { SkeletonRow } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

export default function TransactionsPage() {
  const router = useRouter();
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Track which row has delete confirmation inline
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { transactions, isLoading, deleteTransaction } = useTransactions({
    type: filterType === "all" ? undefined : filterType,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const handleClearFilters = () => {
    setFromDate("");
    setToDate("");
    setShowDatePicker(false);
  };

  const groupTransactionsByDate = (txs: any[]) => {
    const groups: { [key: string]: any[] } = {};
    txs.forEach((tx) => {
      const dateStr = new Date(tx.date).toDateString();
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      let heading = new Date(tx.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });
      if (dateStr === todayStr) heading = "Today";
      else if (dateStr === yesterdayStr) heading = "Yesterday";
      if (!groups[heading]) groups[heading] = [];
      groups[heading].push(tx);
    });
    return groups;
  };

  const grouped = groupTransactionsByDate(transactions);
  const hasFilters = fromDate || toDate;

  // Summary stats for current filter
  const totalIncome = transactions.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = transactions.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + t.amount, 0);

  return (
    <div className="flex flex-col gap-4 px-container-padding pt-[76px] pb-28 w-full animate-fadeIn">
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex justify-between items-center px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-headline-lg font-bold text-on-surface">Transactions</h1>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
            hasFilters
              ? "bg-primary/20 border-primary/40 text-primary"
              : "bg-surface-container border-white/5 text-outline hover:text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
        </button>
      </header>

      {/* ── Date Picker ────────────────────────────────── */}
      {showDatePicker && (
        <div className="glass-card glass-edge rounded-2xl p-4 flex flex-col gap-3 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-outline uppercase tracking-widest">Date Range</span>
            {hasFilters && (
              <button onClick={handleClearFilters} className="text-primary text-[11px] font-bold uppercase tracking-wider">
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-outline uppercase font-bold pl-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-base py-2.5 text-body-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-outline uppercase font-bold pl-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-base py-2.5 text-body-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Tabs ─────────────────────────────────── */}
      <div className="flex bg-surface-container p-1 rounded-2xl border border-white/5">
        {(["all", "income", "expense"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold capitalize transition-all ${
              filterType === tab
                ? tab === "income"
                  ? "bg-tertiary text-background shadow-glow-tertiary"
                  : tab === "expense"
                  ? "bg-error text-background shadow-glow-error"
                  : "bg-primary text-on-primary shadow-glow-primary"
                : "text-outline hover:text-on-surface-variant"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Summary Strip (when data loaded) ─────────── */}
      {!isLoading && transactions.length > 0 && (
        <div className="flex gap-3 animate-fadeIn">
          <div className="flex-1 flex flex-col items-center py-3 rounded-xl bg-tertiary/8 border border-tertiary/20" style={{ backgroundColor: "rgba(73,223,155,0.07)" }}>
            <span className="text-[10px] font-bold text-tertiary/70 uppercase tracking-wider">Income</span>
            <span className="font-mono text-[15px] font-bold text-tertiary mt-0.5">
              +₦{totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center py-3 rounded-xl border border-error/20" style={{ backgroundColor: "rgba(255,180,171,0.07)" }}>
            <span className="text-[10px] font-bold text-error/70 uppercase tracking-wider">Spent</span>
            <span className="font-mono text-[15px] font-bold text-error mt-0.5">
              -₦{totalExpense.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* ── List ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No transactions found"
            description={hasFilters ? "Try adjusting your date range or filters." : "Add your first income or expense to get started."}
            actionLabel={hasFilters ? "Clear Filters" : "Add Transaction"}
            onAction={hasFilters ? handleClearFilters : () => router.push("/transactions/add")}
          />
        ) : (
          Object.keys(grouped).map((dateHeading) => (
            <div key={dateHeading} className="flex flex-col gap-2 stagger-item">
              <span className="text-[11px] font-bold text-outline uppercase tracking-widest pl-1">
                {dateHeading}
              </span>
              <div className="flex flex-col gap-2">
                {grouped[dateHeading].map((tx: any) => {
                  const isIncome = tx.type === "income";
                  const isConfirmingDelete = deletingId === tx.id;
                  return (
                    <div
                      key={tx.id}
                      className="glass-card glass-edge rounded-xl p-4 flex items-center justify-between hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isIncome ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                        }`}>
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isIncome ? "arrow_downward" : "arrow_upward"}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-body-sm font-bold text-on-surface">{tx.category}</span>
                          {tx.notes ? (
                            <span className="text-[11px] text-outline italic truncate max-w-[140px]">{tx.notes}</span>
                          ) : (
                            <span className="text-[11px] text-outline">
                              {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-mono text-[15px] font-bold ${isIncome ? "text-tertiary" : "text-error"}`}>
                          {isIncome ? "+" : "-"}₦{tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>

                        {/* Inline delete — always visible, no hover needed */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { deleteTransaction(tx.id); setDeletingId(null); }}
                              className="text-[11px] font-bold text-error bg-error/10 border border-error/30 px-2 py-1 rounded-lg"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-[11px] font-bold text-outline px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-outline/40 hover:text-error hover:bg-error/10 transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── FAB ───────────────────────────────────────── */}
      <Link
        href="/transactions/add"
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-glow-primary hover:scale-105 active:scale-95 transition-transform z-30"
      >
        <span className="material-symbols-outlined text-[26px] font-bold">add</span>
      </Link>
    </div>
  );
}
