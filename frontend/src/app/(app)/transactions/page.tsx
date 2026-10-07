"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import { MonthSwitcher, Segmented } from "@/components/ui/Controls";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import TransactionRow from "@/components/TransactionRow";
import { useTransactions } from "@/hooks/useTransactions";
import { useImports } from "@/hooks/useImports";
import { currentMonth, dayHeading, naira } from "@/lib/format";
import type { Transaction, TxType } from "@/lib/types";

type Filter = "all" | TxType;

export default function TransactionsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useTransactions({ month });
  const toReview = (useImports().data ?? []).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (t) =>
        (filter === "all" || t.type === filter) &&
        (!q || t.category.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q))
    );
  }, [data, filter, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of visible) {
      const key = dayHeading(tx.date);
      map.set(key, [...(map.get(key) ?? []), tx]);
    }
    return [...map.entries()];
  }, [visible]);

  const totalIn = visible.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalOut = visible.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <PageHeader
        title="Transactions"
        right={
          <>
          <Link href="/imports" aria-label="To review" className="relative w-10 h-10 rounded-full flex items-center justify-center border bg-surface border-line text-muted hover:text-ink">
            <Icon name="inbox" size={20} />
            {toReview > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-extrabold flex items-center justify-center">{toReview}</span>
            )}
          </Link>
          <HeaderButton
            icon={searchOpen ? "close" : "search"}
            label="Search"
            active={searchOpen}
            onClick={() => { setSearchOpen(!searchOpen); setSearch(""); }}
          />
          </>
        }
      />

      <div className="px-4 flex flex-col gap-3 pb-4">
        {searchOpen && (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or note, e.g. Bolt"
            className="input"
          />
        )}
        <MonthSwitcher month={month} onChange={setMonth} />
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "expense", label: "Expenses" },
            { value: "income", label: "Income" },
          ]}
        />

        {!isLoading && visible.length > 0 && (
          <div className="flex justify-between text-sm px-1">
            <span className="text-muted">In <b className="text-income tabular-nums">{naira(totalIn)}</b></span>
            <span className="text-muted">Out <b className="text-ink tabular-nums">{naira(totalOut)}</b></span>
          </div>
        )}

        {isLoading ? (
          <SkeletonRows count={6} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : groups.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={search ? "search_off" : "receipt_long"}
              title={search ? "No matches" : "Nothing logged this month"}
              description={search ? "Try a different word." : "Add your income and expenses to see where your money goes."}
              action={search ? undefined : { label: "Add transaction", onClick: () => router.push("/transactions/new") }}
            />
          </div>
        ) : (
          groups.map(([day, txs]) => {
            const dayNet = txs.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
            return (
              <section key={day}>
                <div className="flex justify-between px-1 mb-1.5 mt-1 text-xs font-bold text-muted">
                  <span>{day}</span>
                  <span className="tabular-nums">{naira(dayNet, { sign: true })}</span>
                </div>
                <div className="card divide-y divide-line overflow-hidden">
                  {txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
                </div>
              </section>
            );
          })
        )}
      </div>

      <Link
        href="/transactions/new"
        aria-label="Add transaction"
        className="fixed bottom-24 right-[max(1rem,calc(50%-14rem+1rem))] z-30 w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-black/25 active:scale-95 transition"
      >
        <Icon name="add" size={28} />
      </Link>
    </>
  );
}
