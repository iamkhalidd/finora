"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirection if already authenticated
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/login", {
        name: "LoginOnly", // placeholder
        email,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem("accessToken", access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-container-padding max-w-md mx-auto">
      <div className="flex flex-col items-center gap-2 mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-[0_0_20px_rgba(155,202,255,0.3)]">
          <span className="material-symbols-outlined text-[36px] text-on-primary">monitoring</span>
        </div>
        <h1 className="text-display-lg font-display-lg text-on-surface text-center tracking-tight">Finora</h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant text-center">Mobile Finance & Forex Journal</p>
      </div>

      <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-headline-sm font-headline-sm text-on-surface mb-2">Welcome Back</h2>

        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-lg text-error text-body-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-label-xs text-on-surface-variant uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-container-lowest border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors text-body-md"
            placeholder="trader@finora.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-xs text-on-surface-variant uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface-container-lowest border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors text-body-md"
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-lg mt-2 transition-all shadow-[0_4px_12px_rgba(155,202,255,0.2)] disabled:opacity-50 text-body-md flex justify-center items-center gap-2"
        >
          {loading ? "Signing In..." : "Sign In"}
          {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
        </button>

        <p className="text-body-sm text-on-surface-variant text-center mt-2">
          New to Finora?{" "}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
