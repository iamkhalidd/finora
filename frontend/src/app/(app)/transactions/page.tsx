"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import { MonthSwitcher, Segmented } from "@/components/ui/Controls";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import TransactionRow from "@/components/TransactionRow";
import TransactionTabs from "@/components/TransactionTabs";
import { useTransactions } from "@/hooks/useTransactions";
import { categoryIcon } from "@/lib/categories";
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
          <span className="lg:hidden">
            <HeaderButton
              icon={searchOpen ? "close" : "search"}
              label="Search"
              active={searchOpen}
              onClick={() => { setSearchOpen(!searchOpen); setSearch(""); }}
            />
          </span>
        }
      />

      <div className="px-4 flex flex-col gap-3 pb-4">
        <TransactionTabs />
        {searchOpen && (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or note, e.g. Bolt"
            className="input lg:hidden"
          />
        )}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="lg:w-64"><MonthSwitcher month={month} onChange={setMonth} /></div>
          <div className="lg:w-80">
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "expense", label: "Expenses" },
                { value: "income", label: "Income" },
              ]}
            />
          </div>
          <div className="hidden lg:block relative flex-1">
            <Icon name="search" size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category or note"
              aria-label="Search transactions"
              className="input pl-11"
            />
          </div>
        </div>

        {!isLoading && visible.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "In", value: naira(totalIn), cls: "text-income" },
              { label: "Out", value: naira(totalOut), cls: "" },
              { label: "Net", value: naira(totalIn - totalOut, { sign: true }), cls: totalIn - totalOut < 0 ? "text-expense" : "" },
            ].map((k) => (
              <div key={k.label} className="card px-3.5 py-2.5 lg:px-4 lg:py-3">
                <p className="text-xs text-muted font-semibold">{k.label}</p>
                <p className={`figure text-[15px] lg:text-xl truncate ${k.cls}`}>{k.value}</p>
              </div>
            ))}
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
          <>
            {/* Phones: grouped by day */}
            <div className="flex flex-col gap-3 lg:hidden">
              {groups.map(([day, txs]) => {
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
              })}
            </div>
            {/* Desktop: one table */}
            <div className="hidden lg:block card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted border-b border-line">
                    <th className="font-semibold px-4 py-3 w-36">Date</th>
                    <th className="font-semibold px-4 py-3">Category</th>
                    <th className="font-semibold px-4 py-3">Note</th>
                    <th className="font-semibold px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((tx) => {
                    const income = tx.type === "income";
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => router.push(`/transactions/${tx.id}`)}
                        className="cursor-pointer hover:bg-surface-2/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{dayHeading(tx.date)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/transactions/${tx.id}`} className="flex items-center gap-3 font-bold" onClick={(e) => e.stopPropagation()}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${income ? "bg-income/10 text-income" : "bg-surface-2 text-muted"}`}>
                              <Icon name={categoryIcon(tx.category)} size={18} />
                            </span>
                            {tx.category}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted max-w-[280px] truncate">{tx.notes}</td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums whitespace-nowrap ${income ? "text-income" : ""}`}>
                          {income ? "+" : "-"}{naira(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </>
  );
}
