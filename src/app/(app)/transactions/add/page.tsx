"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import BottomSheet from "@/components/ui/BottomSheet";

const CATEGORIES = [
  { name: "Salary", icon: "payments" },
  { name: "Trading Profit", icon: "show_chart" },
  { name: "Food & Dining", icon: "restaurant" },
  { name: "Rent & Housing", icon: "home" },
  { name: "Subscriptions", icon: "subscriptions" },
  { name: "Investments", icon: "trending_up" },
  { name: "Shopping", icon: "shopping_bag" },
  { name: "Travel", icon: "flight" },
  { name: "Others", icon: "category" },
];

function AddTransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "income" ? "income" : "expense";

  const [isOpen, setIsOpen] = useState(true);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const { createTransaction, isCreating } = useTransactions();

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.back();
    }, 300);
  };

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
      handleClose();
    } catch (err: any) {
      setError("Failed to create transaction. Try again.");
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className="flex flex-col gap-5 pt-2">
        <h2 className="text-headline-sm font-headline-sm text-on-surface">Log Transaction</h2>

        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-lg text-error text-body-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-1 my-2 bg-surface-container-lowest/40 p-4 rounded-2xl border border-white/5">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Amount</span>
          <div className="flex items-center gap-1">
            <span className="text-headline-lg font-bold text-outline">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent border-none text-display-lg font-bold font-data-lg text-on-surface focus:outline-none w-44 text-center placeholder-outline/50"
              style={{ MozAppearance: "textfield" }}
            />
          </div>
        </div>

        <div className="flex bg-surface-container p-1 rounded-xl border border-white/5">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-lg text-label-xs font-bold capitalize transition-all ${
                type === t
                  ? "bg-primary text-on-primary shadow-lg"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
            Category
          </label>
          <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSel = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl min-w-[76px] snap-center border transition-all ${
                    isSel
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-surface-container border-white/5 text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                  <span className="text-[10px] font-semibold tracking-tight truncate w-full text-center">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-3.5 text-body-sm text-on-surface focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Starbucks"
              className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-3.5 text-body-sm text-on-surface placeholder-outline focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isCreating}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-xl mt-3 transition-all shadow-lg disabled:opacity-50 text-body-md"
        >
          {isCreating ? "Saving transaction..." : "Save Transaction"}
        </button>
      </div>
    </BottomSheet>
  );
}

export default function AddTransactionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-container-padding pt-24 pb-safe opacity-40">
        <h1 className="text-headline-lg font-bold">New Transaction</h1>
      </div>
      <Suspense fallback={<div className="text-center py-10 text-outline">Loading...</div>}>
        <AddTransactionForm />
      </Suspense>
    </div>
  );
}
