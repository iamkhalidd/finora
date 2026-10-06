"use client";

import { useCallback, useState } from "react";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import BottomSheet from "@/components/ui/BottomSheet";
import { AmountInput, ConfirmDelete, Field, MonthSwitcher } from "@/components/ui/Controls";
import { EmptyState, ErrorState, FormError, SkeletonRows } from "@/components/ui/States";
import { useBudgetMutations, useBudgets } from "@/hooks/useBudgets";
import { useSummary } from "@/hooks/useTransactions";
import { categoryIcon, EXPENSE_CATEGORIES } from "@/lib/categories";
import { currentMonth, daysLeftInMonth, errorMessage, monthLabel, naira, shiftMonth } from "@/lib/format";
import type { Budget } from "@/lib/types";

function tone(pct: number) {
  if (pct >= 100) return { bar: "bg-expense", text: "text-expense" };
  if (pct >= 80) return { bar: "bg-warn", text: "text-warn" };
  return { bar: "bg-income", text: "text-income" };
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${tone(pct).bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

type SheetState = { mode: "add"; category?: string } | { mode: "edit"; budget: Budget } | null;

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth());
  const isCurrent = month === currentMonth();
  const { data: budgets, isLoading, isError, refetch } = useBudgets(month);
  const { data: summary } = useSummary(month);
  const { data: lastMonth } = useSummary(shiftMonth(month, -1));
  const { create, update, remove } = useBudgetMutations(month);

  const [sheet, setSheet] = useState<SheetState>(null);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  const openAdd = (preset?: string) => {
    setSheet({ mode: "add" });
    setCategory(preset ?? "");
    setLimit("");
    setError("");
  };
  const openEdit = (budget: Budget) => {
    setSheet({ mode: "edit", budget });
    setLimit(String(budget.limit));
    setError("");
  };
  const close = useCallback(() => setSheet(null), []);

  const save = async () => {
    const value = parseFloat(limit);
    if (sheet?.mode === "add" && !category) return setError("Pick a category.");
    if (!(value > 0)) return setError("Enter a monthly limit greater than zero.");
    try {
      if (sheet?.mode === "edit") await update.mutateAsync({ id: sheet.budget.id, limit: value });
      else await create.mutateAsync({ category, limit: value });
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const list = budgets ?? [];
  const budgeted = new Set(list.map((b) => b.category));
  const totalLimit = list.reduce((s, b) => s + b.limit, 0);
  const totalSpent = list.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalLimit ? (totalSpent / totalLimit) * 100 : 0;
  const remaining = totalLimit - totalSpent;
  const days = daysLeftInMonth();
  const unbudgeted = (summary?.categories ?? []).filter((c) => !budgeted.has(c.name));
  const lastSpent = (name: string) => lastMonth?.categories.find((c) => c.name === name)?.value ?? 0;

  return (
    <>
      <PageHeader title="Budgets" right={<HeaderButton icon="add" label="New budget" onClick={() => openAdd()} />} />

      <div className="px-4 flex flex-col gap-4 pb-4">
        <MonthSwitcher month={month} onChange={setMonth} />

        {isLoading ? (
          <SkeletonRows count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="pie_chart"
              title="No budgets yet"
              description="Set a monthly limit for things like food, transport and data. We'll warn you before you overspend."
              action={{ label: "Create a budget", onClick: () => openAdd() }}
            />
          </div>
        ) : (
          <>
            <section className="card p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted font-semibold">Spent {isCurrent ? "so far" : `in ${monthLabel(month)}`}</p>
                  <p className="text-[28px] font-extrabold tabular-nums leading-tight mt-0.5">{naira(totalSpent)}</p>
                  <p className="text-sm text-muted">of {naira(totalLimit)} budgeted</p>
                </div>
                <span className={`text-sm font-extrabold tabular-nums ${tone(totalPct).text}`}>{Math.round(totalPct)}%</span>
              </div>
              <div className="mt-4"><Progress pct={totalPct} /></div>
              {isCurrent && (
                <p className="text-sm mt-3">
                  {remaining > 0 ? (
                    <>
                      <b className="tabular-nums">{naira(remaining)}</b> <span className="text-muted">left. That&apos;s about</span>{" "}
                      <b className="tabular-nums">{naira(Math.floor(remaining / days))}</b> <span className="text-muted">a day for {days} day{days === 1 ? "" : "s"}.</span>
                    </>
                  ) : (
                    <span className="text-expense font-semibold">You&apos;re {naira(-remaining)} over your total budget.</span>
                  )}
                </p>
              )}
            </section>

            <section className="card divide-y divide-line overflow-hidden">
              {list.map((b) => {
                const pct = b.limit ? (b.spent / b.limit) * 100 : 0;
                const left = b.limit - b.spent;
                return (
                  <button key={b.id} onClick={() => openEdit(b)} className="w-full text-left px-4 py-4 flex flex-col gap-2.5 hover:bg-surface-2/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-2 text-muted flex items-center justify-center shrink-0">
                        <Icon name={categoryIcon(b.category)} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{b.category}</p>
                        <p className="text-xs text-muted tabular-nums">{naira(b.spent)} of {naira(b.limit)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-extrabold tabular-nums ${tone(pct).text}`}>
                          {left >= 0 ? naira(left) : naira(-left)}
                        </p>
                        <p className="text-[11px] text-muted">{left >= 0 ? "left" : "over"}</p>
                      </div>
                    </div>
                    <Progress pct={pct} />
                  </button>
                );
              })}
            </section>
          </>
        )}

        {unbudgeted.length > 0 && !isLoading && (
          <section>
            <h2 className="font-extrabold px-1 mb-2">Spending without a budget</h2>
            <div className="card divide-y divide-line overflow-hidden">
              {unbudgeted.map((c) => (
                <div key={c.name} className="flex items-center gap-3 px-4 py-3">
                  <Icon name={categoryIcon(c.name)} size={20} className="text-muted" />
                  <span className="flex-1 text-sm font-semibold truncate">{c.name}</span>
                  <span className="text-sm font-bold tabular-nums">{naira(c.value)}</span>
                  <button onClick={() => openAdd(c.name)} className="text-xs font-bold text-primary px-2 py-1">Set limit</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomSheet open={sheet !== null} onClose={close} title={sheet?.mode === "edit" ? sheet.budget.category : "New budget"}>
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-4">
          {sheet?.mode === "add" && (
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.filter((c) => !budgeted.has(c.name)).map((c) => (
                  <button key={c.name} type="button" onClick={() => setCategory(c.name)} className={c.name === category ? "chip-on" : "chip-off"}>
                    <Icon name={c.icon} size={16} /> {c.name}
                  </button>
                ))}
              </div>
            </Field>
          )}
          <Field
            label="Monthly limit"
            htmlFor="limit"
            hint={(() => {
              const name = sheet?.mode === "edit" ? sheet.budget.category : category;
              const spent = name ? lastSpent(name) : 0;
              return spent > 0 ? `You spent ${naira(spent)} on ${name} in ${monthLabel(shiftMonth(month, -1))}.` : undefined;
            })()}
          >
            <AmountInput id="limit" value={limit} onChange={setLimit} placeholder="e.g. 50,000" />
          </Field>
          <FormError message={error} />
          <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary">
            {sheet?.mode === "edit" ? "Save limit" : "Create budget"}
          </button>
          {sheet?.mode === "edit" && (
            <ConfirmDelete
              label="Delete budget"
              pending={remove.isPending}
              onConfirm={async () => {
                try {
                  await remove.mutateAsync(sheet.budget.id);
                  close();
                } catch (err) {
                  setError(errorMessage(err));
                }
              }}
            />
          )}
        </form>
      </BottomSheet>
    </>
  );
}
