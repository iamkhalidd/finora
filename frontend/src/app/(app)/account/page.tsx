"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";

function getInitialColor(name: string): string {
  const colors = [
    "from-primary to-primary-container",
    "from-tertiary to-tertiary-container",
    "from-secondary to-secondary-container",
    "from-purple-500 to-purple-800",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

const SETTINGS_ITEMS = [
  { icon: "person",               label: "Personal Profile",      sub: "Edit name, email",          href: null },
  { icon: "notifications_active", label: "Alert Preferences",     sub: "Gmail & broker sync",       href: "/alerts" },
  { icon: "savings",              label: "Budget Limits",         sub: "Manage categories",          href: "/budgets" },
  { icon: "monitoring",           label: "Trading Journal",       sub: "View forex history",        href: "/forex" },
  { icon: "security",             label: "Security & Access",     sub: "Passwords & API keys",      href: null },
];

export default function AccountProfilePage() {
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await api.get("/api/v1/users/me");
      return response.data;
    },
  });

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
      console.error("Backend logout error", err);
    } finally {
      localStorage.removeItem("accessToken");
      router.push("/login");
    }
  };

  const username = user?.name ?? "Trader";
  const userEmail = user?.email ?? "";
  const userInitial = username.charAt(0).toUpperCase();
  const gradientClass = getInitialColor(username);

  const statItems = [
    { label: "Transactions", value: stats?.transactions_count ?? 0, icon: "receipt_long" },
    { label: "Budgets",      value: stats?.active_budgets ?? 0,     icon: "savings"       },
    { label: "Trades",       value: stats?.total_trades ?? 0,       icon: "monitoring"    },
  ];

  return (
    <div className="flex flex-col pb-28 w-full animate-fadeIn">
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex justify-between items-center px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-headline-lg font-bold text-on-surface">Profile</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-error text-[12px] font-bold uppercase tracking-wider hover:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Logout
        </button>
      </header>

      {/* ── Avatar Banner ──────────────────────────────── */}
      <div
        className="relative flex flex-col items-center pt-[88px] pb-8 px-container-padding"
        style={{
          background: "linear-gradient(180deg, rgba(155,202,255,0.08) 0%, rgba(7,19,37,0) 100%)",
        }}
      >
        {/* Initials Avatar */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center text-[36px] font-black bg-gradient-to-br ${gradientClass} text-on-primary shadow-glow-primary border-4 border-background mb-4`}
        >
          {userInitial}
        </div>

        <h2 className="text-headline-lg font-black text-on-surface">{username}</h2>
        <span className="text-[11px] font-bold text-outline uppercase tracking-widest mt-0.5">
          Premium Journal Member
        </span>
        {userEmail && (
          <span className="text-[12px] text-on-surface-variant mt-1">{userEmail}</span>
        )}
      </div>

      <div className="flex flex-col gap-5 px-container-padding">
        {/* ── Stats Row ────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="glass-card glass-edge rounded-2xl p-4 flex flex-col items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[20px] text-outline">
                {stat.icon}
              </span>
              <span className="font-mono text-[22px] font-black text-on-surface">
                {isStatsLoading ? "—" : stat.value}
              </span>
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Settings List ─────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <h3 className="text-headline-sm font-bold text-on-surface">Settings</h3>
          <div className="flex flex-col bg-surface-container/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {SETTINGS_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => item.href && router.push(item.href)}
                className="flex justify-between items-center px-4 py-4 hover:bg-white/[0.03] transition-colors text-left w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-primary">{item.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-body-sm font-semibold text-on-surface">{item.label}</span>
                    <span className="text-[11px] text-outline">{item.sub}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Danger Zone ────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl border border-error/20 text-error font-bold text-body-sm flex items-center justify-center gap-2 hover:bg-error/8 transition-colors"
          style={{ backgroundColor: "rgba(255,180,171,0.04)" }}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out of Finora
        </button>
      </div>
    </div>
  );
}
