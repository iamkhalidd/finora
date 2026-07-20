"use client";

import React, { useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import GlassCard from "@/components/ui/GlassCard";
import BottomSheet from "@/components/ui/BottomSheet";
import { SkeletonRow } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

const CATEGORIES_ICONS: { [key: string]: string } = {
  "Salary":         "payments",
  "Trading Profit": "show_chart",
  "Savings":        "savings",
  "Food & Dining":  "restaurant",
  "Rent & Housing": "home",
  "Subscriptions":  "subscriptions",
  "Investments":    "trending_up",
  "Shopping":       "shopping_bag",
  "Travel":         "flight",
  "Others":         "category",
};

function ProgressBar({ percentage }: { percentage: number }) {
  let barColor = "bg-tertiary";
  if (percentage >= 100) barColor = "bg-error";
  else if (percentage >= 80) barColor = "bg-amber-400";

  return (
    <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} ${percentage >= 90 && percentage < 100 ? "animate-pulse" : ""}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

export default function BudgetsPage() {
  const { budgets, isLoading, createBudget, deleteBudget, isCreating } = useBudgets();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [limit, setLimit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSaveBudget = async () => {
    const numLimit = parseFloat(limit);
    if (!selectedCategory) { setError("Please select a category."); return; }
    if (!limit || isNaN(numLimit) || numLimit <= 0) { setError("Please enter a valid budget limit."); return; }
    setError("");
    try {
      await createBudget({ category: selectedCategory, limit: numLimit });
      setLimit("");
      setSelectedCategory("");
      setIsAddOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create budget.");
    }
  };

  const totalLimit = budgets.reduce((acc: number, b: any) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc: number, b: any) => acc + b.spent, 0);
  const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

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
        <h1 className="text-headline-lg font-bold text-on-surface">Budgets</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </header>

      {/* ── Monthly Summary Hero ────────────────────────── */}
      <GlassCard primary className="flex flex-col gap-4">
        <div className="flex justify-between items-center z-10 relative">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Monthly Summary</span>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              totalPercentage >= 100
                ? "bg-error/20 text-error"
                : totalPercentage >= 80
                ? "bg-amber-400/20 text-amber-400"
                : "bg-tertiary/20 text-tertiary"
            }`}
          >
            {totalPercentage.toFixed(0)}% used
          </span>
        </div>

        <div className="z-10 relative">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-display-sm font-black text-on-surface">
              ₦{totalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-body-sm text-outline">
              of ₦{totalLimit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar percentage={totalPercentage} />
          </div>
        </div>
      </GlassCard>

      {/* ── Category List ────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-headline-sm font-bold text-on-surface">Categories</h2>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon="savings"
            title="No budgets yet"
            description="Set spending limits per category to track where your money goes."
            actionLabel="Create Budget"
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {budgets.map((b: any, i: number) => {
              const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const icon = CATEGORIES_ICONS[b.category] || "category";
              const isConfirming = deletingId === b.id;

              let textColor = "text-tertiary";
              if (percentage >= 100) textColor = "text-error";
              else if (percentage >= 80) textColor = "text-amber-400";

              return (
                <div
                  key={b.id}
                  className="stagger-item glass-card glass-edge rounded-2xl p-4 flex flex-col gap-3"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body-sm font-bold text-on-surface">{b.category}</span>
                        <span className="text-[11px] text-outline">
                          ₦{b.spent.toLocaleString("en-US", { maximumFractionDigits: 0 })} of ₦{b.limit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[15px] font-black ${textColor}`}>
                        {percentage.toFixed(0)}%
                      </span>
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { deleteBudget(b.id); setDeletingId(null); }}
                            className="text-[11px] font-bold text-error bg-error/10 border border-error/30 px-2 py-1 rounded-lg"
                          >Delete</button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-[11px] font-bold text-outline px-2 py-1"
                          >Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(b.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-outline/40 hover:text-error hover:bg-error/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <ProgressBar percentage={percentage} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Add Budget Sheet ─────────────────────────────── */}
      <BottomSheet isOpen={isAddOpen} onClose={() => { setIsAddOpen(false); setError(""); setSelectedCategory(""); setLimit(""); }}>
        <div className="flex flex-col gap-5 pt-2">
          <h2 className="text-headline-sm font-bold text-on-surface">Create Budget</h2>

          {error && (
            <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-error text-body-sm">{error}</div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest pl-1">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(CATEGORIES_ICONS).map((catName) => {
                const isSel = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => setSelectedCategory(catName)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                      isSel
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-surface-container border-white/5 text-outline hover:text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `'FILL' ${isSel ? 1 : 0}` }}>
                      {CATEGORIES_ICONS[catName]}
                    </span>
                    <span className="text-[10px] font-semibold text-center leading-tight">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest pl-1">Monthly Limit (₦)</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="50,000"
              className="input-base"
            />
          </div>

          <button
            onClick={handleSaveBudget}
            disabled={isCreating}
            className="w-full bg-primary hover:opacity-90 text-on-primary font-bold py-4 rounded-2xl transition-all shadow-glow-primary disabled:opacity-50 active:scale-[0.98]"
          >
            {isCreating ? "Creating..." : "Create Budget"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
