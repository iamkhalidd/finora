"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import TransactionTabs from "@/components/TransactionTabs";
import BottomSheet from "@/components/ui/BottomSheet";
import { AmountInput, Field, Segmented } from "@/components/ui/Controls";
import { EmptyState, ErrorState, FormError, SkeletonRows } from "@/components/ui/States";
import { useImportMutations, useImports, useInboundAddress } from "@/hooks/useImports";
import { categoriesFor } from "@/lib/categories";
import { errorMessage, naira, shortDate } from "@/lib/format";
import type { ImportedTransaction, TxType } from "@/lib/types";

type Sheet = { mode: "review"; item: ImportedTransaction } | { mode: "paste" } | null;

export default function ImportsPage() {
  const router = useRouter();
  const { data: items, isLoading, isError, refetch } = useImports();
  const { data: address } = useInboundAddress();
  const { approve, approveSuggested, dismiss, paste } = useImportMutations();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const close = useCallback(() => setSheet(null), []);

  const pending = (items ?? []).filter((i) => i.status === "pending");
  const unreadable = (items ?? []).filter((i) => i.status === "unreadable");
  const withSuggestion = pending.filter((i) => i.suggested_category).length;

  const openReview = (item: ImportedTransaction) => {
    setSheet({ mode: "review", item });
    setType(item.type ?? "expense");
    setAmount(item.amount ? String(item.amount) : "");
    setCategory(item.suggested_category ?? "");
    setNotes(item.description ?? "");
    setError("");
  };

  const quickAdd = async (item: ImportedTransaction) => {
    try {
      await approve.mutateAsync({ id: item.id, category: item.suggested_category! });
    } catch (err) {
      setNotice(errorMessage(err));
    }
  };

  const saveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sheet?.mode !== "review") return;
    if (!(Number(amount) > 0)) return setError("Enter the amount.");
    if (!category) return setError("Pick a category.");
    try {
      await approve.mutateAsync({ id: sheet.item.id, category, type, amount: Number(amount), notes: notes.trim() || null });
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const savePaste = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await paste.mutateAsync(pasted);
      setPasted("");
      close();
      setNotice(res.duplicate ? "That alert is already here." : "Alert read. Check it below.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        right={<HeaderButton icon="content_paste" label="Paste an alert" onClick={() => { setSheet({ mode: "paste" }); setError(""); }} />}
      />

      <div className="px-4 flex flex-col gap-4 pb-6">
        <TransactionTabs />
        {notice && <p className="text-sm font-semibold text-muted px-1">{notice}</p>}

        {isLoading ? (
          <SkeletonRows count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : pending.length === 0 && unreadable.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="mark_email_read"
              title="Nothing to review"
              description={address?.last_received_at ? "New bank alerts you forward will show up here." : "Forward your bank alert emails to Finora and they'll show up here, ready to add."}
              action={address?.last_received_at ? undefined : { label: "Set up email import", onClick: () => router.push("/imports/setup") }}
            />
          </div>
        ) : null}

        {withSuggestion > 1 && (
          <button onClick={() => approveSuggested.mutate()} disabled={approveSuggested.isPending} className="btn-primary lg:self-start">
            <Icon name="done_all" size={20} /> Add all {withSuggestion} with suggested categories
          </button>
        )}

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          {pending.map((item) => {
            const income = item.type === "income";
            return (
              <article key={item.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted font-semibold">
                      {[item.bank, item.occurred_at && shortDate(item.occurred_at), item.source === "paste" && "Pasted"].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-sm font-bold mt-0.5 break-words">{item.description || item.subject}</p>
                  </div>
                  <span className={`text-[17px] font-extrabold tabular-nums shrink-0 ${income ? "text-income" : ""}`}>
                    {income ? "+" : "-"}{naira(item.amount ?? 0)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => dismiss.mutate(item.id)} aria-label="Dismiss" className="btn-ghost px-3">
                    <Icon name="close" size={20} />
                  </button>
                  <button onClick={() => openReview(item)} className="btn-ghost flex-1 text-sm">
                    {item.suggested_category ? "Edit" : "Choose category"}
                  </button>
                  {item.suggested_category && (
                    <button onClick={() => quickAdd(item)} disabled={approve.isPending} className="btn-primary flex-[1.4] py-3 text-sm">
                      Add as {item.suggested_category}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {unreadable.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-extrabold px-1 mt-2">Couldn&apos;t read</h2>
            {unreadable.map((item) => (
              <article key={item.id} className="card p-4 flex flex-col gap-2">
                <p className="text-xs text-muted font-semibold">{[item.bank, item.occurred_at && shortDate(item.occurred_at)].filter(Boolean).join(" · ")}</p>
                <p className="text-sm font-bold">{item.subject || "Bank email"}</p>
                {item.raw_excerpt && <p className="text-xs text-muted line-clamp-4 whitespace-pre-line">{item.raw_excerpt}</p>}
                <div className="flex gap-2 mt-1">
                  <button onClick={() => dismiss.mutate(item.id)} className="btn-ghost flex-1 text-sm">Dismiss</button>
                  <Link href="/transactions/new" className="btn-ghost flex-1 text-sm">Add manually</Link>
                </div>
              </article>
            ))}
          </section>
        )}

        <Link href="/imports/setup" className="text-sm font-semibold text-primary text-center py-2">
          Email import settings
        </Link>
      </div>

      <BottomSheet open={sheet?.mode === "review"} onClose={close} title="Add transaction">
        <form onSubmit={saveReview} className="flex flex-col gap-4">
          <Segmented<TxType>
            value={type}
            onChange={(t) => { setType(t); if (!categoriesFor(t).some((c) => c.name === category)) setCategory(""); }}
            options={[
              { value: "expense", label: "Expense", activeClass: "text-expense" },
              { value: "income", label: "Income", activeClass: "text-income" },
            ]}
          />
          <Field label="Amount" htmlFor="imp-amount"><AmountInput id="imp-amount" value={amount} onChange={setAmount} /></Field>
          <Field label="Category">
            <div className="flex flex-wrap gap-2">
              {categoriesFor(type).map((c) => (
                <button key={c.name} type="button" onClick={() => setCategory(c.name)} className={c.name === category ? "chip-on" : "chip-off"}>
                  <Icon name={c.icon} size={16} /> {c.name}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Note" htmlFor="imp-notes">
            <input id="imp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} className="input" />
          </Field>
          <FormError message={error} />
          <button type="submit" disabled={approve.isPending} className="btn-primary">Add transaction</button>
        </form>
      </BottomSheet>

      <BottomSheet open={sheet?.mode === "paste"} onClose={close} title="Paste a bank alert">
        <form onSubmit={savePaste} className="flex flex-col gap-4">
          <p className="text-sm text-muted">Copy the text of an alert email (or SMS) and paste it here. Handy for testing before you set up forwarding.</p>
          <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={8} className="input resize-none text-sm" placeholder={"Debit Alert\nAmount: NGN 4,500.00\nNarration: TRF/BOLT TECHNOLOGY\nDate: 06-Oct-2026"} />
          <FormError message={error} />
          <button type="submit" disabled={paste.isPending || pasted.trim().length < 10} className="btn-primary">
            {paste.isPending ? "Reading…" : "Read alert"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
