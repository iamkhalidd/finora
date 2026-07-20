import React from "react";

interface SkeletonProps {
  className?: string;
}

/** A single skeleton block — applies the shimmer animation via CSS. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

/** Pre-built skeleton for a transaction / list row */
export function SkeletonRow() {
  return (
    <div className="glass-card glass-edge rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-2/5 rounded-full" />
        <Skeleton className="h-3 w-1/4 rounded-full" />
      </div>
      <Skeleton className="h-4 w-16 rounded-full" />
    </div>
  );
}

/** Pre-built skeleton for a stat card (2-col grid) */
export function SkeletonStatCard() {
  return (
    <div className="glass-card glass-edge rounded-xl p-4 flex flex-col gap-2 animate-fadeIn">
      <Skeleton className="h-3 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-md" />
    </div>
  );
}

/** Pre-built skeleton for a news article card */
export function SkeletonNewsCard() {
  return (
    <div className="glass-card glass-edge rounded-xl p-5 flex flex-col gap-3 animate-fadeIn">
      <Skeleton className="w-full h-36 rounded-lg" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-3/4 rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
    </div>
  );
}

/** Full-page skeleton for the balance hero card */
export function SkeletonHeroCard() {
  return (
    <div className="glass-card-primary glass-edge rounded-2xl p-5 flex flex-col gap-3 animate-fadeIn">
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-10 w-48 rounded-lg mt-1" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
    </div>
  );
}
