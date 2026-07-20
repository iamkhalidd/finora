"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import { SkeletonHeroCard, SkeletonStatCard } from "@/components/ui/SkeletonLoader";

export default function TradeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params?.id;

  const [isDeleting, setIsDeleting] = useState(false);

  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade-detail", id],
    queryFn: async () => {
      const response = await api.get(`/api/v1/trades/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/api/v1/trades/${id}`);
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
    setIsDeleting(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 px-container-padding pt-24 pb-safe w-full animate-fadeIn">
        {/* Header Spacer */}
        <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-3 border-b border-white/5">
          <div className="w-10 h-10" />
          <div className="skeleton h-5 w-32 rounded-full" />
          <div className="w-10 h-10" />
        </header>
        <SkeletonHeroCard />
        <div className="grid grid-cols-2 gap-3.5">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
        <span className="material-symbols-outlined text-[48px] text-error mb-2">warning</span>
        <h3 className="text-headline-sm font-bold text-on-surface">Log Entry Not Found</h3>
        <button
          onClick={() => router.push("/forex")}
          className="px-6 py-3 bg-primary/20 border border-primary/30 text-primary text-label-xs font-bold uppercase tracking-wider rounded-full transition-all hover:bg-primary/30 mt-4"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isProfit = trade.p_l >= 0;

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full animate-fadeIn">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-3 border-b border-white/5">
        <button onClick={() => router.back()} className="text-on-surface hover:text-primary flex items-center p-2 rounded-full hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-headline-sm font-bold text-on-surface">{trade.pair} Detail</h2>
        
        {isDeleting ? (
          <div className="flex items-center gap-1">
            <button
              onClick={handleConfirmDelete}
              className="text-[11px] font-bold text-error bg-error/15 border border-error/30 px-2 py-1 rounded-lg hover:bg-error/25 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={handleCancelDelete}
              className="text-[11px] font-bold text-outline px-2 py-1 hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={handleDelete} className="text-error hover:bg-error/10 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[22px]">delete</span>
          </button>
        )}
      </header>

      {/* P&L banner */}
      <GlassCard primary className="flex flex-col gap-2 items-center text-center">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
          Profit / Loss Yield
        </span>
        <h1 className={`text-display-lg font-bold font-mono ${isProfit ? "text-tertiary" : "text-error"}`}>
          {isProfit ? "+" : ""}₦{trade.p_l.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </h1>
        <div className={`mt-2 px-3 py-1 rounded-full text-label-xs font-bold ${
          trade.direction === "BUY" ? "bg-tertiary/15 text-tertiary" : "bg-error/15 text-error"
        }`}>
          {trade.direction} POSITION
        </div>
      </GlassCard>

      {/* Bento parameters grid */}
      <section className="grid grid-cols-2 gap-3.5">
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Entry Price</span>
          <span className="text-headline-sm font-bold font-mono text-on-surface">{trade.entry_price}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Exit Price</span>
          <span className="text-headline-sm font-bold font-mono text-on-surface">
            {trade.exit_price ?? "Active / Open"}
          </span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Stop Loss (SL)</span>
          <span className="text-headline-sm font-bold font-mono text-outline-variant">
            {trade.stop_loss ?? "Not set"}
          </span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Take Profit (TP)</span>
          <span className="text-headline-sm font-bold font-mono text-outline-variant">
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
