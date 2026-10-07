"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useImportMutations, useInboundAddress } from "@/hooks/useImports";
import { BANK_SENDER_DOMAINS } from "@/lib/categories";

const FILTER = BANK_SENDER_DOMAINS.join(" OR ");

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked: the text is selectable on screen
        }
      }}
      className="btn-ghost py-2 px-3 text-sm shrink-0"
    >
      <Icon name={copied ? "check" : "content_copy"} size={18} /> {copied ? "Copied" : label}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-7 h-7 rounded-full bg-surface-2 text-ink text-sm font-extrabold flex items-center justify-center shrink-0">{n}</span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-bold">{title}</p>
        <div className="text-sm text-muted mt-1 flex flex-col gap-2">{children}</div>
      </div>
    </li>
  );
}

export default function ImportSetupPage() {
  const { data, isLoading, isError, refetch } = useInboundAddress();
  const { rotate } = useImportMutations();
  const [confirmRotate, setConfirmRotate] = useState(false);

  return (
    <>
      <PageHeader title="Import from email" back />
      <div className="px-4 flex flex-col gap-4 pb-6">
        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : isError || !data ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data.enabled ? (
          <div className="card p-5">
            <p className="font-bold">Email import isn&apos;t switched on yet</p>
            <p className="text-sm text-muted mt-1">
              The server needs <code>INBOUND_EMAIL_DOMAIN</code> and <code>INBOUND_EMAIL_SECRET</code> set, plus the email worker. See <code>email-worker/README.md</code>.
              You can still <Link href="/imports" className="text-primary font-semibold">paste alerts</Link> by hand.
            </p>
          </div>
        ) : (
          <>
            <section className="card p-5">
              <p className="text-sm text-muted font-semibold">Your private Finora address</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="flex-1 min-w-0 font-bold break-all select-all">{data.address}</p>
                <CopyButton text={data.address!} />
              </div>
              <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
                <Icon name={data.last_received_at ? "check_circle" : "schedule"} size={16} className={data.last_received_at ? "text-income" : ""} filled={!!data.last_received_at} />
                {data.last_received_at
                  ? `Last email received ${new Date(data.last_received_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
                  : "Nothing received yet"}
              </p>
            </section>

            {data.confirmation && (
              <section className="card p-5 border-primary/40">
                <p className="text-sm font-bold">Gmail confirmation code</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="flex-1 text-2xl font-extrabold tabular-nums tracking-wider">{data.confirmation.code ?? "—"}</p>
                  {data.confirmation.code && <CopyButton text={data.confirmation.code} />}
                </div>
                {data.confirmation.link && (
                  <a href={data.confirmation.link} target="_blank" rel="noreferrer" className="btn-primary mt-3 w-full text-sm">
                    Confirm in Gmail <Icon name="open_in_new" size={18} />
                  </a>
                )}
              </section>
            )}

            <section className="card p-5">
              <h2 className="font-extrabold mb-4">Set up Gmail forwarding</h2>
              <ol className="flex flex-col gap-5">
                <Step n={1} title="Add Finora as a forwarding address">
                  <p>On a computer, open Gmail → <b className="text-ink">Settings</b> (gear) → <b className="text-ink">See all settings</b> → <b className="text-ink">Forwarding and POP/IMAP</b> → <b className="text-ink">Add a forwarding address</b>, and paste your Finora address.</p>
                </Step>
                <Step n={2} title="Confirm it">
                  <p>Gmail sends Finora a confirmation code. It appears on this screen within a minute. Enter it in Gmail and click <b className="text-ink">Verify</b>.</p>
                  <p>Leave forwarding set to <b className="text-ink">Disable forwarding</b>. The filter in the next step forwards only bank alerts.</p>
                </Step>
                <Step n={3} title="Forward only bank alerts">
                  <p>In Gmail&apos;s search bar, open <b className="text-ink">Show search options</b>, paste this into <b className="text-ink">From</b>, then <b className="text-ink">Create filter</b> → <b className="text-ink">Forward it to</b> your Finora address.</p>
                  <div className="rounded-xl bg-surface-2 p-3 text-xs text-ink break-words select-all">{FILTER}</div>
                  <CopyButton text={FILTER} label="Copy filter" />
                </Step>
                <Step n={4} title="Done">
                  <p>New alerts appear in <Link href="/imports" className="text-primary font-semibold">To review</Link>. You approve each one, and Finora remembers your category for the same merchant next time.</p>
                </Step>
              </ol>
            </section>

            <section className="card p-5">
              <p className="text-sm font-bold">Address leaked or getting spam?</p>
              <p className="text-sm text-muted mt-1">Get a new address. The old one stops working, and you&apos;ll need to update your Gmail filter.</p>
              {confirmRotate ? (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setConfirmRotate(false)} className="btn-ghost flex-1">Cancel</button>
                  <button onClick={() => { rotate.mutate(); setConfirmRotate(false); }} className="btn flex-1 bg-expense text-surface py-3">Yes, new address</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRotate(true)} className="btn-ghost w-full mt-3 text-sm">
                  <Icon name="autorenew" size={18} /> Get a new address
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
