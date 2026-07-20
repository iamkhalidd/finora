"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) router.push("/dashboard");
  }, [router]);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError("Please fill out all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/api/v1/auth/register", { name, email, password });
      const accessToken = response.headers["x-access-token"] || response.data?.access_token;
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-container-padding max-w-md mx-auto relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-tertiary/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-glow-primary"
          style={{ background: "linear-gradient(135deg, #5ba3e8 0%, #003256 100%)" }}
        >
          <span className="material-symbols-outlined text-[40px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            monitoring
          </span>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-[36px] font-black text-on-surface tracking-tight leading-none">Finora</h1>
          <p className="text-[13px] text-outline font-medium mt-1">Finance & Forex Trading Journal</p>
        </div>
      </div>

      {/* Form card */}
      <div className="glass-card rounded-3xl p-6 flex flex-col gap-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <div className="flex flex-col gap-1">
          <h2 className="text-headline-sm font-black text-on-surface">Create your account</h2>
          <p className="text-body-sm text-outline">Start your finance journey today</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/25 px-4 py-3 rounded-xl text-error text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest">Full Name</label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base"
              placeholder="Khalid Adekunle"
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-widest">Password</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-base pr-12"
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          id="register-submit"
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-primary text-on-primary font-black py-4 rounded-2xl mt-1 transition-all shadow-glow-primary disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            </>
          )}
        </button>

        <p className="text-body-sm text-outline text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:opacity-70 transition-opacity">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
