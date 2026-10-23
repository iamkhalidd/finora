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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAccessToken()) router.replace("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name: name.trim(), email, password });
      setAccessToken(data.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err, "Couldn't create your account. Please try again."));
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Know where every naira goes, and keep an honest trading journal.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <Field label="Your name" htmlFor="name">
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Chiamaka" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 6 characters">
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-bold">Sign in</Link>
      </p>
      <p className="text-sm text-muted text-center mt-2">
        Just looking?{" "}
        <Link href="/demo" className="text-primary font-bold">Try the demo</Link>
      </p>
    </AuthShell>
  );
}
