"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";

const CATEGORIES = [
  { name: "Salary",           icon: "payments"     },
  { name: "Trading Profit",   icon: "show_chart"   },
  { name: "Savings",          icon: "savings"      },
  { name: "Food & Dining",    icon: "restaurant"   },
  { name: "Rent & Housing",   icon: "home"         },
  { name: "Subscriptions",    icon: "subscriptions"},
  { name: "Investments",      icon: "trending_up"  },
  { name: "Shopping",         icon: "shopping_bag" },
  { name: "Travel",           icon: "flight"       },
  { name: "Others",           icon: "category"     },
];

function AddTransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "income" ? "income" : "expense";

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const { createTransaction, isCreating } = useTransactions();

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }
    setError("");
    try {
      await createTransaction({
        amount: numAmount,
        type,
        category: selectedCategory,
        notes: notes || undefined,
        date: new Date(date).toISOString(),
      });
      router.back();
    } catch (err: any) {
      setError("Failed to save. Please try again.");
    }
  };

  const isIncome = type === "income";
  const accentColor = isIncome ? "text-tertiary" : "text-error";
  const accentBg = isIncome ? "bg-tertiary" : "bg-error";

  return (
    <div className="flex flex-col gap-5 pb-28 animate-fadeIn">
      {/* ── Amount Display ─────────────────────────────── */}
      <div className={`flex flex-col items-center justify-center gap-2 mx-container-padding rounded-2xl py-8 transition-colors duration-300 ${
        isIncome ? "bg-tertiary/8" : "bg-error/8"
      }`}
        style={{ margin: "0 20px", backgroundColor: isIncome ? "rgba(73,223,155,0.07)" : "rgba(255,180,171,0.07)" }}
      >
        <span className={`text-[11px] font-bold uppercase tracking-widest ${isIncome ? "text-tertiary/60" : "text-error/60"}`}>
          {isIncome ? "Income Amount" : "Expense Amount"}
        </span>
        <div className={`flex items-center gap-1 ${accentColor}`}>
          <span className="text-[28px] font-bold opacity-50">₦</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`bg-transparent border-none text-[48px] font-black font-mono focus:outline-none w-48 text-center placeholder-current/30 ${accentColor}`}
            autoFocus
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-container-padding">
        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-error text-body-sm">
            {error}
          </div>
        )}

        {/* ── Type Toggle ─────────────────────────────── */}
        <div className="flex bg-surface-container p-1 rounded-2xl border border-white/5">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl text-[13px] font-bold capitalize transition-all ${
                type === t
                  ? t === "income"
                    ? "bg-tertiary text-background shadow-glow-tertiary"
                    : "bg-error text-background shadow-glow-error"
                  : "text-outline hover:text-on-surface-variant"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Category Grid ───────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-outline uppercase tracking-widest pl-1">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSel = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                    isSel
                      ? isIncome
                        ? "bg-tertiary/15 border-tertiary/40 text-tertiary"
                        : "bg-error/15 border-error/40 text-error"
                      : "bg-surface-container border-white/5 text-outline hover:text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: `'FILL' ${isSel ? 1 : 0}` }}>
                    {cat.icon}
                  </span>
                  <span className="text-[10px] font-semibold text-center leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Date & Notes ────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest pl-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base py-3 text-body-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest pl-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note"
              className="input-base py-3 text-body-sm"
            />
          </div>
        </div>

        {/* ── Save Button ─────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={isCreating}
          className={`w-full font-bold py-4 rounded-2xl mt-1 transition-all text-body-md disabled:opacity-50 active:scale-[0.98] ${
            isIncome
              ? "bg-tertiary text-background shadow-glow-tertiary hover:opacity-90"
              : "bg-error text-background shadow-glow-error hover:opacity-90"
          }`}
        >
          {isCreating ? "Saving..." : `Save ${isIncome ? "Income" : "Expense"}`}
        </button>
      </div>
    </div>
  );
}

export default function AddTransactionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex items-center gap-3 px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-headline-sm font-bold text-on-surface">Log Transaction</h1>
      </header>

      <div className="pt-[72px]">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20 text-outline text-body-sm">
            Loading...
          </div>
        }>
          <AddTransactionForm />
        </Suspense>
      </div>
    </div>
  );
}
