"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";

export default function AccountProfilePage() {
  const router = useRouter();

  // Fetch current user details
  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get("/api/v1/users/me");
      return response.data;
    },
  });

  // Fetch statistics aggregation numbers
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const response = await api.get("/api/v1/users/me/stats");
      return response.data;
    },
  });

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch (err) {
      console.error("Failed backend logout call", err);
    } finally {
      localStorage.removeItem("accessToken");
      router.push("/login");
    }
  };

  const username = user?.name ?? "Khalid";
  const userEmail = user?.email ?? "trader.pro@gmail.com";

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold">Profile</h1>
        <button onClick={handleLogout} className="text-error hover:opacity-80 flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider p-2">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </header>

      {/* User Avatar details glass banner card */}
      <GlassCard className="flex flex-col items-center text-center gap-3">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-highest border-2 border-primary/20 relative shadow-md">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
            alt="User avatar"
          />
        </div>
        <div className="flex flex-col">
          <h2 className="text-headline-sm font-bold text-on-surface">{username}</h2>
          <span className="text-[11px] text-outline font-semibold uppercase mt-0.5 tracking-wider">
            Premium Journal Member
          </span>
          <span className="text-[10px] text-outline-variant mt-0.5">{userEmail}</span>
        </div>
      </GlassCard>

      {/* Numerical Stats overview */}
      <section className="grid grid-cols-3 gap-3">
        <div className="glass-card glass-edge p-4 rounded-xl flex flex-col items-center justify-center text-center gap-1 bg-surface-container/40">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Logs</span>
          <span className="text-lg font-bold font-data-lg text-on-surface">
            {isStatsLoading ? "..." : stats?.transactions_count ?? 0}
          </span>
        </div>
        <div className="glass-card glass-edge p-4 rounded-xl flex flex-col items-center justify-center text-center gap-1 bg-surface-container/40">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Limits</span>
          <span className="text-lg font-bold font-data-lg text-on-surface">
            {isStatsLoading ? "..." : stats?.active_budgets ?? 0}
          </span>
        </div>
        <div className="glass-card glass-edge p-4 rounded-xl flex flex-col items-center justify-center text-center gap-1 bg-surface-container/40">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Trades</span>
          <span className="text-lg font-bold font-data-lg text-on-surface">
            {isStatsLoading ? "..." : stats?.total_trades ?? 0}
          </span>
        </div>
      </section>

      {/* Interactive Account options / settings links */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-headline-sm font-headline-sm text-on-surface">Journal Settings</h3>
        <div className="flex flex-col bg-surface-container/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          <div className="flex justify-between items-center px-4 py-4 hover:bg-white/[0.02] cursor-pointer">
            <div className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary">person</span>
              <span className="text-body-sm font-semibold">Personal Profile</span>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
          </div>

          <div className="flex justify-between items-center px-4 py-4 hover:bg-white/[0.02] cursor-pointer" onClick={() => router.push("/alerts")}>
            <div className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary">notifications_active</span>
              <span className="text-body-sm font-semibold">Linked Services Sync</span>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
          </div>

          <div className="flex justify-between items-center px-4 py-4 hover:bg-white/[0.02] cursor-pointer">
            <div className="flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-[20px] text-primary">security</span>
              <span className="text-body-sm font-semibold">Security & Access Keys</span>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
          </div>
        </div>
      </section>
    </div>
  );
}
