"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import PageHeader, { HeaderButton } from "@/components/ui/PageHeader";
import BottomSheet from "@/components/ui/BottomSheet";
import { ConfirmDelete, Field } from "@/components/ui/Controls";
import { ErrorState, FormError, Skeleton } from "@/components/ui/States";
import { useTrade, useTradeMutations } from "@/hooks/useTrades";
import { errorMessage, usd } from "@/lib/format";
import { canEstimate, estimatePnl, plannedRR } from "@/lib/trading";

export default function TradeDetailPage() {
  const router = useRouter();
  const id = Number(useParams<{ id: string }>().id);
  const { data: trade, isLoading, isError, refetch } = useTrade(id);
  const { update, remove } = useTradeMutations();

  const [closing, setClosing] = useState(false);
  const [exit, setExit] = useState("");
  const [pnl, setPnl] = useState("");
  const [pnlTouched, setPnlTouched] = useState(false);
  const [error, setError] = useState("");

  const estimate = trade ? estimatePnl(trade.pair, trade.direction, trade.entry_price, Number(exit), trade.lot_size) : null;
  useEffect(() => {
    if (!pnlTouched && estimate !== null) setPnl(String(estimate));
  }, [estimate, pnlTouched]);
  const closeSheet = useCallback(() => setClosing(false), []);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Trade" back />
        <div className="px-4 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-40" /></div>
      </>
    );
  }
  if (isError || !trade) {
    return (
      <>
        <PageHeader title="Trade" back="/trades" />
        <div className="px-4"><ErrorState message="This trade couldn't be loaded. It may have been deleted." onRetry={() => refetch()} /></div>
      </>
    );
  }

  const open = trade.exit_price == null;
  const rr = plannedRR(trade.entry_price, trade.stop_loss, trade.take_profit);
  const details: [string, React.ReactNode][] = [
    ["Entry", trade.entry_price],
    ["Exit", trade.exit_price ?? "—"],
    ["Stop loss", trade.stop_loss ?? "—"],
    ["Take profit", trade.take_profit ?? "—"],
    ["Lot size", trade.lot_size],
    ["Planned R:R", rr !== null ? `1 : ${rr.toFixed(2)}` : "—"],
    ["Session", trade.session],
    ["Strategy", trade.strategy ?? "—"],
  ];

  const closeTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(exit) > 0)) return setError("Enter the exit price.");
    if (pnl.trim() === "") return setError("Enter the profit or loss your broker shows.");
    try {
      await update.mutateAsync({ id: trade.id, exit_price: Number(exit), p_l: Number(pnl) });
      setClosing(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title={trade.pair}
        subtitle={new Date(trade.date).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        back="/trades"
        right={<HeaderButton icon="edit" label="Edit trade" onClick={() => router.push(`/trades/${trade.id}/edit`)} />}
      />

      <div className="px-4 pb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
        {/* On phones these items join the parent grid so Delete can drop to the very end */}
        <div className="contents lg:flex lg:flex-col lg:gap-4 lg:min-w-0">
          <section className="card p-5 text-center lg:p-7 order-1 lg:order-none">
            <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold ${trade.direction === "BUY" ? "bg-income/10 text-income" : "bg-expense/10 text-expense"}`}>
              {trade.direction}
            </span>
            {open ? (
              <>
                <p className="text-[28px] font-extrabold text-primary mt-2">Open</p>
                <p className="text-sm text-muted">Close it when you exit to record the result.</p>
                <button onClick={() => { setExit(""); setPnl(""); setPnlTouched(false); setError(""); setClosing(true); }} className="btn-primary mt-4 w-full">
                  <Icon name="task_alt" size={20} /> Close trade
                </button>
              </>
            ) : (
              <>
                <p className={`figure text-[38px] mt-2 ${trade.p_l > 0 ? "text-income" : trade.p_l < 0 ? "text-expense" : ""}`}>
                  {usd(trade.p_l, { sign: true })}
                </p>
                <p className="text-sm text-muted">{trade.p_l > 0 ? "Win" : trade.p_l < 0 ? "Loss" : "Break-even"}</p>
              </>
            )}
          </section>

          <div className="order-3 lg:order-none">
            <ConfirmDelete
              label="Delete trade"
              pending={remove.isPending}
              onConfirm={async () => {
                await remove.mutateAsync(trade.id);
                router.replace("/trades");
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 order-2 lg:order-none">
          <section className="card grid grid-cols-2">
            {details.map(([label, value], i) => (
              <div key={label} className={`px-4 py-3 border-line ${i % 2 === 0 ? "border-r" : ""} ${i < details.length - 2 ? "border-b" : ""}`}>
                <p className="text-xs text-muted font-semibold">{label}</p>
                <p className="font-bold tabular-nums truncate">{value}</p>
              </div>
            ))}
          </section>

          <section className="card p-4">
            <p className="text-xs text-muted font-semibold mb-1.5">Journal notes</p>
            {trade.notes ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{trade.notes}</p>
            ) : (
              <button onClick={() => router.push(`/trades/${trade.id}/edit`)} className="text-sm text-primary font-semibold">
                Add notes on why you took this trade →
              </button>
            )}
          </section>
        </div>
      </div>

      <BottomSheet open={closing} onClose={closeSheet} title={`Close ${trade.pair} ${trade.direction.toLowerCase()}`}>
        <form onSubmit={closeTrade} className="flex flex-col gap-4">
          <Field label="Exit price" htmlFor="exit">
            <input id="exit" type="number" inputMode="decimal" step="any" min="0" autoFocus value={exit} onChange={(e) => setExit(e.target.value)} className="input tabular-nums" placeholder={String(trade.entry_price)} />
          </Field>
          <Field
            label="Profit / loss (USD)"
            htmlFor="close-pnl"
            hint={canEstimate(trade.pair) ? "Auto-calculated. Edit to match your broker." : "Copy this from your broker (use - for a loss)."}
          >
            <input id="close-pnl" type="number" inputMode="decimal" step="any" value={pnl} onChange={(e) => { setPnl(e.target.value); setPnlTouched(true); }} className="input tabular-nums font-bold" placeholder="-25.50" />
          </Field>
          <FormError message={error} />
          <button type="submit" disabled={update.isPending} className="btn-primary">
            {update.isPending ? "Saving…" : "Close trade"}
          </button>
        </form>
      </BottomSheet>
    </>
  );
}
