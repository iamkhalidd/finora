"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useNews } from "@/hooks/useNews";
import GlassCard from "@/components/ui/GlassCard";

function NewsArticleDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url");

  const { bookmarks, addBookmark, removeBookmark } = useNews();

  const { data: articles } = useQuery({
    queryKey: ["news-list"],
    queryFn: async () => {
      const response = await api.get("/api/v1/news");
      return response.data;
    },
  });

  const article = articles?.find((a: any) => a.url === targetUrl) || {
    title: "Market Insight",
    description: "Detailed analysis on ongoing forex spot operations and capital distributions.",
    source: "Reuters",
    published_at: new Date().toISOString(),
    category: "Forex",
    author: "Finora Analyst Desk",
    body: "Market trading volumes remained consistently high across foreign exchange spot operations. Investors and retail traders are parsing ongoing balance sheet reconciliations and inflation statistics to forecast upcoming central bank guidelines. Speculative positions on precious metals continue to outline safe-haven hedge demands.",
  };

  const isBookmarked = bookmarks.some((b: any) => b.url === targetUrl);
  const bookmarkId = bookmarks.find((b: any) => b.url === targetUrl)?.id;

  const handleBookmarkToggle = async () => {
    if (isBookmarked && bookmarkId) {
      await removeBookmark(bookmarkId);
    } else {
      await addBookmark({
        title: article.title,
        description: article.description,
        source: article.source,
        url: targetUrl || "",
        image_url: article.image_url,
        published_at: article.published_at,
        category: article.category,
      });
    }
  };

  return (
    <div className="flex flex-col gap-stack-lg px-container-padding pt-24 pb-safe w-full">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <button onClick={() => router.back()} className="text-on-surface hover:text-primary flex items-center p-2">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <span className="text-headline-sm font-bold text-on-surface truncate max-w-[200px]">Article</span>
        <button
          onClick={handleBookmarkToggle}
          className={`p-2 transition-colors ${isBookmarked ? "text-primary" : "text-outline hover:text-on-surface"}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: `'FILL' ${isBookmarked ? 1 : 0}` }}>
            bookmark
          </span>
        </button>
      </header>

      {article.image_url && (
        <div className="w-full h-52 rounded-xl overflow-hidden glass-panel glass-edge relative">
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
          <span className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-label-xs font-bold text-primary uppercase">
            {article.category || "Economy"}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-outline font-semibold pl-1">
        <span>By {article.author || "Staff Writer"} • {article.source || "Reuters"}</span>
        <span>
          {new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-headline-lg font-bold text-on-surface leading-tight pl-1">
          {article.title}
        </h1>

        <GlassCard className="border-l-4 border-l-primary py-4">
          <p className="text-body-sm font-semibold text-primary leading-relaxed">
            {article.description}
          </p>
        </GlassCard>

        <p className="text-body-sm text-on-surface-variant leading-relaxed pl-1 whitespace-pre-line">
          {article.body}
        </p>
      </div>

      {targetUrl && (
        <button
          onClick={() => window.open(targetUrl, "_blank")}
          className="w-full bg-surface-container hover:bg-surface-container-high text-primary border border-white/5 font-bold py-4 rounded-xl mt-4 transition-all shadow-md flex justify-center items-center gap-2 text-body-sm"
        >
          Read Full Article
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </button>
      )}
    </div>
  );
}

export default function NewsArticleDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-outline">Loading Article...</div>}>
      <NewsArticleDetailContent />
    </Suspense>
  );
}
