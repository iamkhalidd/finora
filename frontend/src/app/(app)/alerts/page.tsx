"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAlerts } from "@/hooks/useAlerts";
import { SkeletonRow } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

const ALERT_FILTERS = ["All", "Unread", "Broker", "Bank"];

export default function NotificationInboxPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { alerts, isLoading, markAsRead, markAllAsRead } = useAlerts(selectedFilter);

  return (
    <div className="flex flex-col gap-4 px-container-padding pt-[76px] pb-28 w-full animate-fadeIn">
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex justify-between items-center px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-white/5 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 className="text-headline-sm font-bold text-on-surface">Inbox</h1>
        </div>
        <button
          onClick={() => markAllAsRead()}
          className="text-primary text-[11px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
        >
          Mark All Read
        </button>
      </header>

      {/* ── Gmail Sync Banner ──────────────────────────── */}
      <div className="glass-panel glass-edge rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary" />
          </div>
          <div className="flex flex-col">
            <span className="text-body-sm font-bold text-on-surface">Gmail Connected</span>
            <span className="text-[10px] text-outline font-semibold">Syncing broker & bank alerts</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline text-[20px]">sync</span>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────── */}
      <div className="flex bg-surface-container p-1 rounded-2xl border border-white/5">
        {ALERT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedFilter === f
                ? "bg-primary text-on-primary shadow-glow-primary"
                : "text-outline hover:text-on-surface-variant"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Alert List ──────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
        ) : alerts.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="All clear"
            description={
              selectedFilter === "Unread"
                ? "No unread notifications."
                : "No alerts matching this filter."
            }
          />
        ) : (
          alerts.map((alert: any, i: number) => {
            const initialLetter = (alert.sender || "F")[0].toUpperCase();
            const isBroker = alert.category === "Broker";
            return (
              <div
                key={alert.id}
                onClick={() => {
                  if (!alert.is_read) markAsRead(alert.id);
                }}
                className={`stagger-item rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer relative ${
                  alert.is_read
                    ? "glass-panel opacity-70 hover:opacity-100"
                    : "glass-panel-unread hover:border-primary/40 border-l-2 border-l-primary"
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Unread dot */}
                {!alert.is_read && (
                  <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(155,202,255,0.6)]" />
                )}

                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-[14px] ${
                    isBroker
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/20 text-secondary"
                  }`}
                >
                  {initialLetter}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-body-sm truncate pr-8 ${alert.is_read ? "text-on-surface-variant font-medium" : "text-on-surface font-bold"}`}>
                      {alert.sender}
                    </span>
                    <span className="text-[10px] text-outline shrink-0 font-semibold">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className={`text-[13px] truncate ${alert.is_read ? "text-outline" : "text-on-surface font-semibold"}`}>
                    {alert.subject}
                  </span>
                  <p className="text-[11px] text-outline truncate mt-0.5">{alert.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
