"use client";

import React, { useState } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import GlassCard from "@/components/ui/GlassCard";
import BottomSheet from "@/components/ui/BottomSheet";

const CATEGORIES_ICONS: { [key: string]: string } = {
  "Salary": "payments",
  "Trading Profit": "show_chart",
  "Food & Dining": "restaurant",
  "Rent & Housing": "home",
  "Subscriptions": "subscriptions",
  "Investments": "trending_up",
  "Shopping": "shopping_bag",
  "Travel": "flight",
  "Others": "category",
};

export default function BudgetsPage() {
  const { budgets, isLoading, createBudget, deleteBudget, isCreating } = useBudgets();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [limit, setLimit] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [error, setError] = useState("");

  const handleSaveBudget = async () => {
    const numLimit = parseFloat(limit);
    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }
    if (!limit || isNaN(numLimit) || numLimit <= 0) {
      setError("Please enter a valid positive budget limit.");
      return;
    }

    setError("");
    try {
      await createBudget({
        category: selectedCategory,
        limit: numLimit,
      });
      // Clear forms
      setLimit("");
      setSelectedCategory("");
      setIsAddOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create budget limit.");
    }
  };

  // Aggregated totals across all limits
  const totalLimit = budgets.reduce((acc: number, b: any) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc: number, b: any) => acc + b.spent, 0);
  const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold">Budgets</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="p-2 rounded-lg bg-primary/20 border border-primary/30 text-primary"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
      </header>

      {/* Monthly Budget Summary Card */}
      <GlassCard primary className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-body-sm font-body-sm text-on-surface-variant">Monthly Summary</span>
          <span className="text-[10px] font-bold text-on-surface-variant bg-white/10 px-2.5 py-1 rounded-full uppercase">
            Active
          </span>
        </div>
        <div className="flex justify-between items-baseline my-1">
          <h2 className="text-display-sm font-bold font-data-lg text-on-surface">
            ${totalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            <span className="text-body-sm text-outline font-normal ml-1">
              / ${totalLimit.toLocaleString("en-US", { maximumFractionDigits: 0 })} spent
            </span>
          </h2>
          <span className="text-label-xs font-bold text-outline">
            {totalPercentage.toFixed(1)}%
          </span>
        </div>
        {/* Horizontal main progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
          />
        </div>
      </GlassCard>

      {/* Category List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-headline-sm font-headline-sm text-on-surface">Categories</h3>

        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">Loading limits...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center text-outline text-body-sm py-12 bg-surface-container/30 rounded-xl border border-white/5">
            No budgets created yet. Click the + button to add one.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {budgets.map((b: any) => {
              const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const icon = CATEGORIES_ICONS[b.category] || "category";

              // Progress color formatting
              let barColor = "bg-tertiary"; // green
              let textColor = "text-tertiary";
              if (percentage >= 80 && percentage < 100) {
                barColor = "bg-amber-400";
                textColor = "text-amber-400";
              } else if (percentage >= 100) {
                barColor = "bg-error";
                textColor = "text-error";
              }

              return (
                <div
                  key={b.id}
                  className="glass-card glass-edge rounded-xl p-4 flex flex-col gap-3 relative group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-body-sm font-bold text-on-surface">{b.category}</span>
                        <span className="text-[11px] text-outline">
                          ${b.spent.toLocaleString("en-US", { maximumFractionDigits: 0 })} spent of ${b.limit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-label-xs font-bold px-2 py-1 bg-white/5 rounded-full ${textColor}`}>
                        {percentage.toFixed(0)}%
                      </span>
                      <button
                        onClick={() => {
                          if (confirm("Delete this budget limit?")) {
                            deleteBudget(b.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-error transition-opacity duration-200"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add budget bottom sheet overlay */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
        <div className="flex flex-col gap-5 pt-2">
          <h2 className="text-headline-sm font-headline-sm text-on-surface">Create Category Budget</h2>

          {error && (
            <div className="bg-error/10 border border-error/20 p-3 rounded-lg text-error text-body-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
              Select Category
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.keys(CATEGORIES_ICONS).map((catName) => {
                const isSel = selectedCategory === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => setSelectedCategory(catName)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                      isSel
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-surface-container border-white/5 text-on-surface-variant text-[11px]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {CATEGORIES_ICONS[catName]}
                    </span>
                    <span className="text-[10px] truncate w-full text-center font-medium">
                      {catName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
              Monthly Limit Amount ($)
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="500.00"
              className="w-full bg-surface-container border border-white/5 rounded-xl px-4 py-3.5 text-body-md text-on-surface focus:outline-none focus:border-primary font-data-lg"
            />
          </div>

          <button
            onClick={handleSaveBudget}
            disabled={isCreating}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-xl mt-3 transition-all shadow-lg"
          >
            {isCreating ? "Saving Budget..." : "Create Budget"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
