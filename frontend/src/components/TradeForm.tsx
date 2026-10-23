"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, Segmented } from "@/components/ui/Controls";
import { FormError } from "@/components/ui/States";
import { useTradeMutations, useTrades } from "@/hooks/useTrades";
import { dateInputToISO, errorMessage, todayInput, usd } from "@/lib/format";
import { canEstimate, currentSession, estimatePnl, plannedRR, POPULAR_INSTRUMENTS, SESSIONS } from "@/lib/trading";
import type { Direction, Trade } from "@/lib/types";
import ActionBar from "@/components/shell/ActionBar";

const num = (v: string) => (v.trim() === "" ? null : Number(v));
const str = (v: number | null | undefined) => (v == null ? "" : String(v));

function NumberInput({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      step="any"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input tabular-nums"
    />
  );
}

export default function TradeForm({ existing }: { existing?: Trade }) {
  const router = useRouter();
  const { create, update } = useTradeMutations();
  const { data: pastTrades } = useTrades();

  const [pair, setPair] = useState(existing?.pair ?? "XAUUSD");
  const [direction, setDirection] = useState<Direction>(existing?.direction ?? "BUY");
  const [entry, setEntry] = useState(str(existing?.entry_price));
  const [lots, setLots] = useState(str(existing?.lot_size));
  const [sl, setSl] = useState(str(existing?.stop_loss));
  const [tp, setTp] = useState(str(existing?.take_profit));
  const [closed, setClosed] = useState(existing ? existing.exit_price != null : false);
  const [exit, setExit] = useState(str(existing?.exit_price));
  const [pnl, setPnl] = useState(existing?.exit_price != null ? str(existing.p_l) : "");
  const [pnlTouched, setPnlTouched] = useState(!!existing);
  const [session, setSession] = useState(existing?.session ?? currentSession());
  const [strategy, setStrategy] = useState(existing?.strategy ?? "");
  const [date, setDate] = useState(existing ? existing.date.slice(0, 10) : todayInput());
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState("");

  const estimate = closed ? estimatePnl(pair, direction, Number(entry), Number(exit), Number(lots)) : null;
  const autoPriced = canEstimate(pair);
  const rr = plannedRR(Number(entry), num(sl), num(tp));
  const strategies = useMemo(
    () => [...new Set((pastTrades ?? []).map((t) => t.strategy).filter(Boolean) as string[])],
    [pastTrades]
  );

  // Keep the P&L field in sync with prices until the user types their own figure
  useEffect(() => {
    if (!pnlTouched && estimate !== null) setPnl(String(estimate));
  }, [estimate, pnlTouched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pair.trim()) return setError("Enter the instrument, e.g. XAUUSD.");
    if (!(Number(entry) > 0)) return setError("Enter your entry price.");
    if (!(Number(lots) > 0)) return setError("Enter your lot size.");
    if (closed && !(Number(exit) > 0)) return setError("Enter the exit price, or mark the trade as still open.");
    if (closed && pnl.trim() === "") return setError("Enter the profit or loss your broker shows for this trade.");
    setError("");

    const payload = {
      pair: pair.trim(),
      direction,
      entry_price: Number(entry),
      lot_size: Number(lots),
      stop_loss: num(sl),
      take_profit: num(tp),
      exit_price: closed ? Number(exit) : null,
      p_l: closed ? Number(pnl) : null,
      session,
      strategy: strategy.trim() || null,
      notes: notes.trim() || null,
      date: existing && date === existing.date.slice(0, 10) ? existing.date : dateInputToISO(date),
    };
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, ...payload });
        router.replace(`/trades/${existing.id}`);
      } else {
        const trade = await create.mutateAsync(payload);
        router.replace(`/trades/${trade.id}`);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="px-4 flex flex-col gap-5 pb-28">
      <Field label="Instrument" htmlFor="pair">
        <input id="pair" value={pair} onChange={(e) => setPair(e.target.value.toUpperCase())} placeholder="XAUUSD" className="input font-bold uppercase" autoCapitalize="characters" />
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pt-1">
          {POPULAR_INSTRUMENTS.map((p) => (
            <button key={p} type="button" onClick={() => setPair(p)} className={`shrink-0 ${pair === p ? "chip-on" : "chip-off"}`}>{p}</button>
          ))}
        </div>
      </Field>

      <Segmented<Direction>
        value={direction}
        onChange={setDirection}
        options={[
          { value: "BUY", label: "Buy", activeClass: "text-income" },
          { value: "SELL", label: "Sell", activeClass: "text-expense" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Entry price" htmlFor="entry"><NumberInput id="entry" value={entry} onChange={setEntry} placeholder="0.00" /></Field>
        <Field label="Lot size" htmlFor="lots"><NumberInput id="lots" value={lots} onChange={setLots} placeholder="0.01" /></Field>
        <Field label="Stop loss" htmlFor="sl"><NumberInput id="sl" value={sl} onChange={setSl} placeholder="Optional" /></Field>
        <Field label="Take profit" htmlFor="tp"><NumberInput id="tp" value={tp} onChange={setTp} placeholder="Optional" /></Field>
      </div>
      {rr !== null && <p className="text-sm text-muted -mt-2">Planned risk : reward <b className="text-ink">1 : {rr.toFixed(2)}</b></p>}

      <Field label="Status">
        <Segmented<"open" | "closed">
          value={closed ? "closed" : "open"}
          onChange={(v) => setClosed(v === "closed")}
          options={[{ value: "open", label: "Still open" }, { value: "closed", label: "Closed" }]}
        />
      </Field>

      {closed && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Exit price" htmlFor="exit"><NumberInput id="exit" value={exit} onChange={setExit} placeholder="0.00" /></Field>
          <Field
            label="Profit / loss (USD)"
            htmlFor="pnl"
            hint={autoPriced ? (pnlTouched && estimate !== null ? <button type="button" className="text-primary font-semibold" onClick={() => { setPnlTouched(false); setPnl(String(estimate)); }}>Use estimate {usd(estimate)}</button> : "Auto-calculated. Edit to match your broker.") : "Copy this from your broker (use - for a loss)."}
          >
            <input
              id="pnl"
              type="number"
              inputMode="decimal"
              step="any"
              value={pnl}
              onChange={(e) => { setPnl(e.target.value); setPnlTouched(true); }}
              placeholder="-25.50"
              className={`input tabular-nums font-bold ${Number(pnl) > 0 ? "text-income" : Number(pnl) < 0 ? "text-expense" : ""}`}
            />
          </Field>
        </div>
      )}

      <Field label="Session">
        <Segmented value={session} onChange={setSession} options={SESSIONS.map((s) => ({ value: s, label: s }))} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Strategy" htmlFor="strategy">
          <input id="strategy" list="strategies" value={strategy} onChange={(e) => setStrategy(e.target.value)} maxLength={50} placeholder="e.g. Breakout" className="input" />
          <datalist id="strategies">{strategies.map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="Date" htmlFor="date">
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
        </Field>
      </div>

      <Field label="Journal notes" htmlFor="notes">
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={2000} placeholder="Why did you take this trade? Did you follow your plan? What will you do differently?" className="input resize-none" />
      </Field>

      <FormError message={error} />

      <ActionBar>
        <button type="submit" disabled={create.isPending || update.isPending} className="btn-primary w-full">
          {create.isPending || update.isPending ? "Saving…" : existing ? "Save changes" : "Save trade"}
        </button>
      </ActionBar>
    </form>
  );
}
