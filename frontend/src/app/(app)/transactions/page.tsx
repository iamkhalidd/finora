"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";
import GlassCard from "@/components/ui/GlassCard";

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

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

      let heading = dateStr;
      if (dateStr === todayStr) heading = "Today";
      else if (dateStr === yesterdayStr) heading = "Yesterday";

      if (!groups[heading]) groups[heading] = [];
      groups[heading].push(tx);
    });
    return groups;
  };

  const grouped = groupTransactionsByDate(transactions);

  return (
    <div className="flex flex-col gap-stack-md px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold">Transactions</h1>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`p-2 rounded-lg border transition-all ₦{
            fromDate || toDate
              ? "bg-primary/20 border-primary text-primary"
              : "bg-surface-container border-white/5 text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
        </button>
      </header>

      {/* Date Range Selector overlay block */}
      {showDatePicker && (
        <GlassCard className="flex flex-col gap-3 py-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-1">
            <span className="text-label-xs text-on-surface-variant font-bold uppercase">Date Range Filter</span>
            {(fromDate || toDate) && (
              <button onClick={handleClearFilters} className="text-primary text-[11px] font-bold uppercase">
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-outline uppercase font-semibold">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-surface-container-lowest border border-white/5 rounded-lg px-2 py-1.5 text-body-sm text-on-surface focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-outline uppercase font-semibold">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-surface-container-lowest border border-white/5 rounded-lg px-2 py-1.5 text-body-sm text-on-surface focus:outline-none"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Segmented Filter Toggle */}
      <div className="flex bg-surface-container p-1 rounded-xl border border-white/5 z-10">
        {(["all", "income", "expense"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`flex-1 py-2.5 rounded-lg text-label-xs font-bold capitalize transition-all ₦{
              filterType === tab
                ? "bg-primary text-on-primary shadow-lg"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grouped Transactions List */}
      <div className="flex flex-col gap-4 mt-2">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">Loading history...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center text-outline text-body-sm py-12 bg-surface-container/30 rounded-xl border border-white/5">
            No transaction records found.
          </div>
        ) : (
          Object.keys(grouped).map((dateHeading) => (
            <div key={dateHeading} className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-outline uppercase tracking-wider pl-1">
                {dateHeading}
              </span>
              <div className="flex flex-col gap-2">
                {grouped[dateHeading].map((tx: any) => {
                  const isIncome = tx.type === "income";
                  return (
                    <div
                      key={tx.id}
                      className="glass-card glass-edge rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors relative group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ₦{
                          isIncome ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {isIncome ? "download" : "upload"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-body-sm font-bold text-on-surface">{tx.category}</span>
                          {tx.notes && (
                            <span className="text-[11px] text-on-surface-variant italic truncate max-w-[150px]">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-body-md font-semibold font-data-lg ₦{isIncome ? "text-tertiary" : "text-error"}`}>
                          {isIncome ? "+" : "-"}₦{tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>

                        {/* Instant delete button */}
                        <button
                          onClick={() => {
                            if (confirm("Delete this transaction?")) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-opacity duration-200"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Persistent Floating Add Button */}
      <Link
        href="/transactions/add"
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-30"
      >
        <span className="material-symbols-outlined text-[28px] font-bold">add</span>
      </Link>
    </div>
  );
}
