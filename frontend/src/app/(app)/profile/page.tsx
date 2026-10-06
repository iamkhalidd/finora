"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import BottomSheet from "@/components/ui/BottomSheet";
import { Field } from "@/components/ui/Controls";
import { FormError } from "@/components/ui/States";
import { PasswordInput } from "@/components/auth/AuthShell";
import { useProfile, useProfileMutations } from "@/hooks/useProfile";
import { api } from "@/lib/api";
import { removeAccessToken } from "@/lib/auth";
import { errorMessage } from "@/lib/format";

type Sheet = "name" | "password" | null;

function Row({ icon, label, sub, onClick, danger }: { icon: string; label: string; sub?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2/50">
      <Icon name={icon} size={22} className={danger ? "text-expense" : "text-muted"} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${danger ? "text-expense" : ""}`}>{label}</p>
        {sub && <p className="text-xs text-muted truncate">{sub}</p>}
      </div>
      {!danger && <Icon name="chevron_right" size={20} className="text-faint" />}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useProfile();
  const { updateName, changePassword } = useProfileMutations();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const close = useCallback(() => setSheet(null), []);

  const open = (s: Sheet) => {
    setSheet(s);
    setError("");
    setName(user?.name ?? "");
    setCurrent("");
    setNext("");
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your name.");
    try {
      await updateName.mutateAsync(name.trim());
      setNotice("Name updated");
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return setError("New password must be at least 6 characters.");
    try {
      await changePassword.mutateAsync({ current_password: current, new_password: next });
      setNotice("Password changed");
      close();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logging out locally is enough if the server can't be reached
    }
    removeAccessToken();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <>
      <PageHeader title="Profile" />
      <div className="px-4 flex flex-col gap-5 pb-6">
        <section className="flex items-center gap-4 px-1">
          <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-extrabold">
            {user?.name.charAt(0).toUpperCase() ?? ""}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-extrabold truncate">{user?.name ?? " "}</p>
            <p className="text-sm text-muted truncate">{user?.email}</p>
          </div>
        </section>

        {notice && (
          <p className="text-sm text-income font-semibold flex items-center gap-1.5 px-1">
            <Icon name="check_circle" size={18} filled /> {notice}
          </p>
        )}

        <section className="card divide-y divide-line overflow-hidden">
          <Row icon="badge" label="Name" sub={user?.name} onClick={() => open("name")} />
          <Row icon="lock" label="Change password" onClick={() => open("password")} />
        </section>

        <section className="card divide-y divide-line overflow-hidden">
          <Row icon="pie_chart" label="Budgets" sub="Monthly spending limits" onClick={() => router.push("/budgets")} />
          <Row icon="insights" label="Trading performance" sub="Win rate, best instruments and sessions" onClick={() => router.push("/trades/stats")} />
        </section>

        <section className="card overflow-hidden">
          <Row icon="logout" label="Sign out" onClick={logout} danger />
        </section>

        <p className="text-xs text-faint text-center">Amounts are in Naira (₦). Trading P&L is in USD, your broker&apos;s account currency.</p>
      </div>

      <BottomSheet open={sheet === "name"} onClose={close} title="Your name">
        <form onSubmit={saveName} className="flex flex-col gap-4">
          <Field label="Name" htmlFor="name">
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="input" autoComplete="name" autoFocus />
          </Field>
          <FormError message={error} />
          <button type="submit" disabled={updateName.isPending} className="btn-primary">Save</button>
        </form>
      </BottomSheet>

      <BottomSheet open={sheet === "password"} onClose={close} title="Change password">
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <Field label="Current password" htmlFor="current">
            <PasswordInput id="current" value={current} onChange={setCurrent} autoComplete="current-password" />
          </Field>
          <Field label="New password" htmlFor="next" hint="At least 6 characters">
            <PasswordInput id="next" value={next} onChange={setNext} autoComplete="new-password" />
          </Field>
          <FormError message={error} />
          <button type="submit" disabled={changePassword.isPending} className="btn-primary">Update password</button>
        </form>
      </BottomSheet>
    </>
  );
}
