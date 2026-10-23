"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { removeAccessToken } from "@/lib/auth";

function leave(to: string) {
  removeAccessToken();
  window.location.href = to;
}

export default function DemoBanner() {
  return (
    <div className="bg-sun text-on-sun text-[13px] font-semibold">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-x-3 gap-y-1 flex-wrap">
        <Icon name="visibility" size={18} />
        <span className="flex-1 min-w-[12rem]">You&apos;re exploring a demo with sample data. Changes stay in this browser.</span>
        <span className="flex items-center gap-3">
          <Link href="/register" onClick={(e) => { e.preventDefault(); leave("/register"); }} className="underline underline-offset-2">
            Create your own account
          </Link>
          <button onClick={() => leave("/")} className="rounded-full bg-on-sun/10 hover:bg-on-sun/20 px-3 py-1">
            Exit demo
          </button>
        </span>
      </div>
    </div>
  );
}
