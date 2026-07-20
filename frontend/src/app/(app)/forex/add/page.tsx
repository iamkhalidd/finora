"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrades } from "@/hooks/useTrades";
import BottomSheet from "@/components/ui/BottomSheet";

export default function AddTradePage() {
  const router = useRouter();
  const { createTrade, isCreating } = useTrades();

  const [isOpen, setIsOpen] = useState(true);
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [session, setSession] = useState("London");
  const [strategy, setStrategy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [estimatedPL, setEstimatedPL] = useState(0.0);

  // Close animation back trigger
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  // Recalculate estimated Profit/Loss dynamically on changes
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const lots = parseFloat(lotSize);

    if (isNaN(entry) || isNaN(exit) || isNaN(lots) || lots <= 0) {
      setEstimatedPL(0.0);
      return;
    }

    const pairUpper = pair.toUpperCase();
    let contractSize = 100000.0;
    if (pairUpper.includes("XAU") || pairUpper.includes("GOLD")) {
      contractSize = 100.0;
    } else if (pairUpper.includes("JPY")) {
      contractSize = 1000.0;
    }

    let multiplier = 1.0;
    if (pairUpper.includes("JPY")) {
      multiplier = 0.01;
    }

    let diff = exit - entry;
    if (direction === "SELL") {
      diff = -diff;
    }

    const est = diff * contractSize * lots * multiplier;
    setEstimatedPL(isNaN(est) ? 0.0 : est);
  }, [pair, direction, entryPrice, exitPrice, lotSize]);

  const handleSave = async () => {
    const entry = parseFloat(entryPrice);
    const exit = exitPrice ? parseFloat(exitPrice) : undefined;
    const lots = parseFloat(lotSize);
    const sl = stopLoss ? parseFloat(stopLoss) : undefined;
    const tp = takeProfit ? parseFloat(takeProfit) : undefined;

    if (!pair) {
      setError("Please specify a currency pair.");
      return;
    }
    if (isNaN(entry) || entry <= 0) {
      setError("Please specify a valid positive entry price.");
      return;
    }
    if (isNaN(lots) || lots <= 0) {
      setError("Please specify a valid positive lot size.");
      return;
    }

    setError("");
    try {
      await createTrade({
        pair: pair.toUpperCase(),
        direction,
        entry_price: entry,
        exit_price: exit,
        lot_size: lots,
        stop_loss: sl,
        take_profit: tp,
        session,
        strategy: strategy || undefined,
        notes: notes || undefined,
      });
      handleClose();
    } catch (err: any) {
      setError("Failed to save trade log. Try again.");
    }
  };

  const isBuy = direction === "BUY";

  return (
    <div className="min-h-screen bg-background">
      <div className="px-container-padding pt-24 pb-safe opacity-40">
        <h1 className="text-headline-lg font-bold">Log Forex Trade</h1>
      </div>

      <BottomSheet isOpen={isOpen} onClose={handleClose}>
        <div className="flex flex-col gap-4 pt-1 animate-fadeIn">
          <h2 className="text-headline-sm font-bold text-on-surface">Log Trade Position</h2>

          {error && (
            <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-error text-body-sm">
              {error}
            </div>
          )}

          {/* Pair & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Currency Pair
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                placeholder="XAUUSD"
                className="input-base uppercase font-bold text-center"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Direction
              </label>
              <div className="flex bg-surface-container p-1 rounded-xl border border-white/5 h-[46px] items-center">
                {(["BUY", "SELL"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setDirection(dir)}
                    className={`flex-1 h-full rounded-lg text-[11px] font-bold transition-all ${
                      direction === dir
                        ? dir === "BUY"
                          ? "bg-tertiary text-background shadow-glow-tertiary"
                          : "bg-error text-background shadow-glow-error"
                        : "text-outline hover:text-on-surface-variant"
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing parameters & Lot Size */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Entry Price
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="1982.40"
                className="input-base font-mono text-center px-1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="Optional"
                className="input-base font-mono text-center px-1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Lots
              </label>
              <input
                type="number"
                step="any"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                placeholder="0.10"
                className="input-base font-mono text-center px-1"
              />
            </div>
          </div>

          {/* Risk structures: stop-loss and take profit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Stop Loss (SL)
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="1975.00"
                className="input-base font-mono text-center"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Take Profit (TP)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="1995.00"
                className="input-base font-mono text-center"
              />
            </div>
          </div>

          {/* Trading sessions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
              Trading Session
            </label>
            <div className="flex bg-surface-container p-1 rounded-xl border border-white/5 h-[46px]">
              {(["London", "New York", "Asian"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSession(s)}
                  className={`flex-1 h-full rounded-lg text-[11px] font-bold transition-all ${
                    session === s
                      ? "bg-primary text-on-primary shadow-glow-primary"
                      : "text-outline hover:text-on-surface-variant"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy, Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Strategy Used
              </label>
              <input
                type="text"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Order Block"
                className="input-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Trendline support"
                className="input-base"
              />
            </div>
          </div>

          {/* Realtime estimated P&L calculator banner */}
          <div className="flex justify-between items-center bg-surface-container-low border border-white/5 px-4 py-3.5 rounded-xl mt-1">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Estimated P&L
            </span>
            <span className={`text-[15px] font-bold font-mono ${estimatedPL >= 0 ? "text-tertiary" : "text-error"}`}>
              {estimatedPL >= 0 ? "+" : ""}₦{estimatedPL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={isCreating}
            className={`w-full font-bold py-4 rounded-xl mt-2 transition-all disabled:opacity-50 text-body-sm active:scale-[0.98] ${
              isBuy
                ? "bg-tertiary text-background shadow-glow-tertiary"
                : "bg-error text-background shadow-glow-error"
            }`}
          >
            {isCreating ? "Saving journal entry..." : "Save Trade Entry"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
