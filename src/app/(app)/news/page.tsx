"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import GlassCard from "@/components/ui/GlassCard";

const NEWS_CATEGORIES = ["All", "Forex", "Crypto", "Economy", "Stocks"];

export default function MarketNewsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"latest" | "saved">("latest");

  const { articles, bookmarks, addBookmark, removeBookmark, isLoading, isBookmarksLoading } = useNews(
    selectedCategory === "All" ? undefined : selectedCategory
  );

  const isArticleBookmarked = (url: string) => {
    return bookmarks.some((b: any) => b.url === url);
  };

  const getBookmarkId = (url: string) => {
    return bookmarks.find((b: any) => b.url === url)?.id;
  };

  const handleBookmarkToggle = async (e: React.MouseEvent, art: any) => {
    e.stopPropagation(); // Avoid navigating to details
    const bookmarkedId = getBookmarkId(art.url);
    if (bookmarkedId) {
      await removeBookmark(bookmarkedId);
    } else {
      await addBookmark({
        title: art.title,
        description: art.description,
        source: art.source,
        url: art.url,
        image_url: art.image_url,
        published_at: art.published_at,
        category: art.category,
      });
    }
  };

  const listData = activeTab === "latest" ? articles : bookmarks;
  const isListLoading = activeTab === "latest" ? isLoading : isBookmarksLoading;

  return (
    <div className="flex flex-col gap-stack-md px-container-padding pt-24 pb-safe w-full">
      {/* Top Header bar */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-container-padding py-stack-sm border-b border-white/5">
        <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold">Market News</h1>
        <div className="flex bg-surface-container p-1 rounded-xl border border-white/5 h-10 w-44 items-center">
          {(["latest", "saved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-full rounded-lg text-[11px] font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Categories scrollbar - only shown in latest mode */}
      {activeTab === "latest" && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 snap-x scrollbar-none z-10">
          {NEWS_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-label-xs font-bold snap-center border transition-all ${
                  isSel
                    ? "bg-primary text-on-primary border-primary shadow-md"
                    : "bg-surface-container border-white/5 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* News Feeds List */}
      <div className="flex flex-col gap-3.5 mt-2">
        {isListLoading ? (
          <div className="text-center text-outline text-body-sm py-8">Loading feed...</div>
        ) : listData.length === 0 ? (
          <div className="text-center text-outline text-body-sm py-12 bg-surface-container/30 rounded-xl border border-white/5">
            {activeTab === "latest" ? "No market articles found." : "No bookmarked articles yet."}
          </div>
        ) : (
          listData.map((art: any) => {
            const bookmarked = isArticleBookmarked(art.url);
            return (
              <article
                key={art.id || art.url}
                onClick={() => {
                  // Direct navigation to source or details can also be simulated or used
                  router.push(`/news/${art.id || "view"}?url=${encodeURIComponent(art.url)}`);
                }}
                className="glass-card glass-edge rounded-xl p-5 flex flex-col gap-3.5 hover:border-white/20 transition-all cursor-pointer"
              >
                {art.image_url && (
                  <div className="w-full h-36 rounded-lg overflow-hidden relative">
                    <img
                      src={art.image_url}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-primary uppercase">
                      {art.category || "Economy"}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-3">
                    <h3 className="text-body-sm font-bold text-on-surface leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <button
                      onClick={(e) => handleBookmarkToggle(e, art)}
                      className={`p-1 transition-colors ${bookmarked ? "text-primary" : "text-outline hover:text-on-surface"}`}
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>
                        bookmark
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {art.description}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-outline font-semibold mt-1">
                  <span>{art.source || "Market Desk"}</span>
                  <span>
                    {new Date(art.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
