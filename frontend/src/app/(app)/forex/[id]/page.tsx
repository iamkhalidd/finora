"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";

export default function TradeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params?.id;

  const [error, setError] = useState("");

  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade-detail", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/trades/₦{id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/api/v1/trades/₦{id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades-stats"] });
      queryClient.invalidateQueries({ queryKey: ["trades-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      router.push("/forex");
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this trade journal record permanently?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-outline">
        Loading trade specifications...
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="text-headline-sm font-bold text-on-surface">Log Entry Not Found</h3>
        <button onClick={() => router.push("/forex")} className="text-primary font-bold mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const isProfit = trade.p_l >= 0;

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <button onClick={() => router.back()} className="text-on-surface hover:text-primary flex items-center p-2">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-headline-sm font-bold text-on-surface">{trade.pair} Detail</h2>
        <button onClick={handleDelete} className="text-error hover:opacity-80 p-2">
          <span className="material-symbols-outlined text-[22px]">delete</span>
        </button>
      </header>

      {/* P&L banner */}
      <GlassCard primary className="flex flex-col gap-2 items-center text-center">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          Profit / Loss Yield
        </span>
        <h1 className={`text-display-lg font-bold font-data-lg ₦{isProfit ? "text-tertiary" : "text-error"}`}>
          {isProfit ? "+" : ""}₦{trade.p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </h1>
        <div className={`mt-2 px-3 py-1 rounded-full text-label-xs font-bold ₦{
          trade.direction === "BUY" ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
        }`}>
          {trade.direction} POSITION
        </div>
      </GlassCard>

      {/* Bento parameters grid */}
      <section className="grid grid-cols-2 gap-3.5">
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Entry Price</span>
          <span className="text-headline-sm font-bold font-data-lg text-on-surface">{trade.entry_price}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Exit Price</span>
          <span className="text-headline-sm font-bold font-data-lg text-on-surface">
            {trade.exit_price ?? "Active / Open"}
          </span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Stop Loss (SL)</span>
          <span className="text-headline-sm font-bold font-data-lg text-outline-variant">
            {trade.stop_loss ?? "Not set"}
          </span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Take Profit (TP)</span>
          <span className="text-headline-sm font-bold font-data-lg text-outline-variant">
            {trade.take_profit ?? "Not set"}
          </span>
        </GlassCard>
      </section>

      {/* Metadata tags */}
      <section className="flex flex-wrap gap-2">
        <div className="bg-surface-container border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
          <span className="text-label-xs font-bold text-on-surface-variant uppercase">{trade.session} Session</span>
        </div>
        {trade.strategy && (
          <div className="bg-surface-container border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
            <span className="text-label-xs font-bold text-on-surface-variant uppercase">{trade.strategy}</span>
          </div>
        )}
        <div className="bg-surface-container border border-white/5 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary">layers</span>
          <span className="text-label-xs font-bold text-on-surface-variant uppercase">{trade.lot_size} Lots</span>
        </div>
      </section>

      {/* Narrative logs */}
      {trade.notes && (
        <GlassCard className="flex flex-col gap-3">
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Journal Notes</h3>
          <p className="text-body-sm text-on-surface leading-relaxed whitespace-pre-line">{trade.notes}</p>
        </GlassCard>
      )}

      {/* Log Timestamp */}
      <span className="text-[10px] text-outline text-center mt-2">
        Logged on: {new Date(trade.date).toLocaleString()}
      </span>
    </div>
  );
}
