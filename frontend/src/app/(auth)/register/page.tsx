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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/register", {
        name,
        email,
        password,
      });
      // Register returns accessToken in response headers under backup header or cookie. Let's retrieve it:
      const accessToken = response.headers["x-access-token"] || response.data?.access_token;
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-container-padding max-w-md mx-auto">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-[0_0_20px_rgba(155,202,255,0.3)]">
          <span className="material-symbols-outlined text-[36px] text-on-primary">monitoring</span>
        </div>
        <h1 className="text-display-lg font-display-lg text-on-surface text-center tracking-tight">Finora</h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant text-center">Create Journal Portfolio</p>
      </div>

      <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-headline-sm font-headline-sm text-on-surface mb-1">Get Started</h2>

        {error && (
          <div className="bg-error/10 border border-error/20 p-3 rounded-lg text-error text-body-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-label-xs text-on-surface-variant uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface-container-lowest border border-white/5 rounded-lg px-4 py-3 text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors text-body-md"
            placeholder="Khalid"
          />
        </div>

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
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-lg mt-2 transition-all shadow-[0_4px_12px_rgba(155,202,255,0.2)] disabled:opacity-50 text-body-md flex justify-center items-center gap-2"
        >
          {loading ? "Creating Account..." : "Create Account"}
          {!loading && <span className="material-symbols-outlined text-[18px]">how_to_reg</span>}
        </button>

        <p className="text-body-sm text-on-surface-variant text-center mt-2">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
