"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getAccessToken, setAccessToken } from "@/lib/auth";
import { errorMessage } from "@/lib/format";
import AuthShell, { PasswordInput } from "@/components/auth/AuthShell";
import { Field } from "@/components/ui/Controls";
import { FormError } from "@/components/ui/States";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAccessToken(data.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err, "Couldn't sign you in. Please try again."));
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track your money and trades.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        New to Finora?{" "}
        <Link href="/register" className="text-primary font-bold">Create an account</Link>
      </p>
    </AuthShell>
  );
}
