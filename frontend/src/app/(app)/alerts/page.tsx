"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAlerts } from "@/hooks/useAlerts";

const ALERT_FILTERS = ["All", "Unread", "Broker", "Bank"];

export default function NotificationInboxPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const { alerts, isLoading, markAsRead, markAllAsRead } = useAlerts(selectedFilter);

  return (
    <div className="flex flex-col gap-stack-md px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <button onClick={() => router.back()} className="text-on-surface hover:text-primary flex items-center p-2">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-headline-sm font-bold text-on-surface">Inbox Alerts</h2>
        <button
          onClick={() => markAllAsRead()}
          className="text-primary hover:opacity-80 text-[11px] font-bold uppercase tracking-wider p-2"
        >
          Read All
        </button>
      </header>

      {/* Connection Gmail details info banner */}
      <div className="glass-panel glass-edge rounded-xl p-4 flex items-center justify-between bg-surface-container-low/40">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-tertiary"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-body-sm font-bold text-on-surface">Gmail Connection Sync</span>
            <span className="text-[10px] text-outline font-semibold">trader.pro@gmail.com</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline text-[18px]">sync</span>
      </div>

      {/* Filters Segmented list */}
      <div className="flex bg-surface-container p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none z-10">
        {ALERT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`flex-1 py-2 rounded-lg text-label-xs font-bold whitespace-nowrap px-4 transition-all ${
              selectedFilter === f
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Gmail Email List Rows */}
      <div className="flex flex-col gap-2 mt-2">
        {isLoading ? (
          <div className="text-center text-outline text-body-sm py-8">Loading notification inbox...</div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-outline text-body-sm py-12 bg-surface-container/30 rounded-xl border border-white/5">
            No incoming notifications matching filter.
          </div>
        ) : (
          alerts.map((alert: any) => {
            const initialLetter = (alert.sender || "F")[0].toUpperCase();
            return (
              <div
                key={alert.id}
                onClick={() => {
                  if (!alert.is_read) {
                    markAsRead(alert.id);
                  }
                }}
                className={`glass-edge rounded-xl p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                  alert.is_read
                    ? "glass-panel opacity-70 hover:opacity-100"
                    : "glass-panel-unread border-primary/25 hover:border-primary/50 relative pl-8"
                }`}
              >
                {/* Unread dot */}
                {!alert.is_read && (
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(155,202,255,0.6)] animate-pulse" />
                )}

                {/* Sender Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-headline-sm ${
                  alert.category === "Broker"
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-secondary-container text-on-secondary-container"
                }`}>
                  {initialLetter}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`text-body-sm truncate pr-2 ${alert.is_read ? "text-on-surface-variant font-medium" : "text-on-surface font-bold"}`}>
                      {alert.sender}
                    </span>
                    <span className="text-[10px] text-outline shrink-0 font-semibold">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className={`text-[13px] truncate ${alert.is_read ? "text-on-surface-variant" : "text-on-surface font-semibold"}`}>
                    {alert.subject}
                  </span>
                  <p className="text-[11px] text-outline truncate mt-0.5 font-medium">
                    {alert.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
