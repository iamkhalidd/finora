"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { AmountInput, ConfirmDelete, Field, Segmented } from "@/components/ui/Controls";
import { FormError } from "@/components/ui/States";
import { useTransactionMutations } from "@/hooks/useTransactions";
import { categoriesFor, categoryIcon } from "@/lib/categories";
import { dateInputToISO, errorMessage, todayInput } from "@/lib/format";
import type { Transaction, TxType } from "@/lib/types";

export default function TransactionForm({ initialType = "expense", existing }: { initialType?: TxType; existing?: Transaction }) {
  const router = useRouter();
  const { create, update, remove } = useTransactionMutations();

  const [type, setType] = useState<TxType>(existing?.type ?? initialType);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [date, setDate] = useState(existing ? existing.date.slice(0, 10) : todayInput());
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const categories = categoriesFor(type);
  // Keep a category from an older version of the app selectable when editing
  const legacy = category && !categories.some((c) => c.name === category) && existing?.category === category && existing.type === type;
  const hint = categories.find((c) => c.name === category)?.hint;
  const saving = create.isPending || update.isPending;

  const changeType = (t: TxType) => {
    setType(t);
    if (!categoriesFor(t).some((c) => c.name === category)) setCategory("");
  };

  const submit = async (addAnother: boolean) => {
    const value = parseFloat(amount);
    if (!(value > 0)) return setError("Enter an amount greater than zero.");
    if (!category) return setError("Pick a category.");
    setError("");

    const payload = {
      amount: value,
      type,
      category,
      notes: notes.trim() || null,
      date: existing && date === existing.date.slice(0, 10) ? existing.date : dateInputToISO(date),
    };
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, ...payload });
        router.back();
      } else {
        await create.mutateAsync(payload);
        if (addAnother) {
          setAmount("");
          setNotes("");
          setSavedCount((n) => n + 1);
        } else {
          router.back();
        }
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    try {
      await remove.mutateAsync(existing.id);
      router.back();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(false); }}
      className="px-4 flex flex-col gap-5 pb-36"
    >
      <Segmented<TxType>
        value={type}
        onChange={changeType}
        options={[
          { value: "expense", label: "Expense", activeClass: "bg-expense/15 text-expense" },
          { value: "income", label: "Income", activeClass: "bg-income/15 text-income" },
        ]}
      />

      <Field label="Amount" htmlFor="amount">
        <AmountInput id="amount" value={amount} onChange={setAmount} autoFocus={!existing} className="[&_input]:text-2xl [&_input]:py-4" />
      </Field>

      <Field label="Category" hint={hint}>
        <div className="grid grid-cols-4 gap-2">
          {legacy && (
            <button type="button" className="flex flex-col items-center gap-1 rounded-xl border p-2 py-2.5 border-primary/50 bg-primary/15 text-primary">
              <Icon name={categoryIcon(category)} size={22} />
              <span className="text-[10.5px] font-semibold leading-tight text-center">{category}</span>
            </button>
          )}
          {categories.map((c) => {
            const on = c.name === category;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 py-2.5 transition ${
                  on ? "border-primary/50 bg-primary/15 text-primary" : "border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                <Icon name={c.icon} size={22} filled={on} />
                <span className="text-[10.5px] font-semibold leading-tight text-center">{c.name}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="date">
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
        </Field>
        <Field label="Note (optional)" htmlFor="notes">
          <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} placeholder={type === "income" ? "e.g. October pay" : "e.g. Bolt to work"} className="input" />
        </Field>
      </div>

      <FormError message={error} />
      {savedCount > 0 && !error && (
        <p className="text-sm text-income font-semibold flex items-center gap-1.5">
          <Icon name="check_circle" size={18} filled /> Saved {savedCount} {savedCount === 1 ? "entry" : "entries"}. Add the next one.
        </p>
      )}

      {existing && <ConfirmDelete onConfirm={handleDelete} pending={remove.isPending} label="Delete transaction" />}

      <div className="fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur-md border-t border-line pb-safe">
        <div className="max-w-md mx-auto px-4 py-3 flex gap-2">
          {!existing && (
            <button type="button" onClick={() => submit(true)} disabled={saving} className="btn-ghost flex-1 text-sm">
              Save & add another
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving…" : existing ? "Save changes" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
