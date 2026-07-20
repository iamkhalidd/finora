"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import { SkeletonNewsCard } from "@/components/ui/SkeletonLoader";
import EmptyState from "@/components/ui/EmptyState";

const NEWS_CATEGORIES = ["All", "Forex", "Crypto", "Economy", "Stocks"];

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='144' viewBox='0 0 400 144'%3E%3Crect width='400' height='144' fill='%23142032'/%3E%3Ctext x='50%25' y='50%25' font-size='32' text-anchor='middle' dominant-baseline='middle' fill='%238a919b'%3E📰%3C/text%3E%3C/svg%3E";

export default function MarketNewsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"latest" | "saved">("latest");

  const { articles, bookmarks, addBookmark, removeBookmark, isLoading, isBookmarksLoading } = useNews(
    selectedCategory === "All" ? undefined : selectedCategory
  );

  const isArticleBookmarked = (url: string) => bookmarks.some((b: any) => b.url === url);
  const getBookmarkId = (url: string) => bookmarks.find((b: any) => b.url === url)?.id;

  const handleBookmarkToggle = async (e: React.MouseEvent, art: any) => {
    e.stopPropagation();
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
    <div className="flex flex-col gap-4 px-container-padding pt-[76px] pb-28 w-full animate-fadeIn">
      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 flex justify-between items-center px-container-padding py-3"
        style={{
          background: "linear-gradient(to bottom, rgba(7,19,37,0.98) 60%, rgba(7,19,37,0))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <h1 className="text-headline-lg font-bold text-on-surface">Market News</h1>
        <div className="flex bg-surface-container p-1 rounded-xl border border-white/5 h-10 w-40 items-center">
          {(["latest", "saved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-full rounded-lg text-[11px] font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-outline hover:text-on-surface-variant"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* ── Category Pills ──────────────────────────────── */}
      {activeTab === "latest" && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none snap-x">
          {NEWS_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold snap-center border whitespace-nowrap transition-all ${
                  isSel
                    ? "bg-primary text-on-primary border-primary shadow-glow-primary"
                    : "bg-surface-container border-white/5 text-outline hover:text-on-surface-variant"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Articles ────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {isListLoading ? (
          [...Array(4)].map((_, i) => <SkeletonNewsCard key={i} />)
        ) : listData.length === 0 ? (
          <EmptyState
            icon={activeTab === "latest" ? "newspaper" : "bookmark"}
            title={activeTab === "latest" ? "No articles found" : "No saved articles"}
            description={
              activeTab === "latest"
                ? "Try a different category or check back later."
                : "Bookmark articles to read them later."
            }
          />
        ) : (
          listData.map((art: any, index: number) => {
            const bookmarked = isArticleBookmarked(art.url);
            const isHero = index === 0 && activeTab === "latest";
            return (
              <article
                key={art.id || art.url}
                onClick={() =>
                  router.push(`/news/${art.id || "view"}?url=${encodeURIComponent(art.url)}`)
                }
                className={`stagger-item glass-card glass-edge rounded-2xl flex flex-col gap-3 cursor-pointer hover:border-white/20 transition-all overflow-hidden ${
                  isHero ? "p-0" : "p-4"
                }`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Hero card — large image top */}
                {isHero ? (
                  <>
                    <div className="w-full h-48 relative overflow-hidden">
                      <img
                        src={art.image_url || DEFAULT_IMAGE}
                        alt={art.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <span className="absolute top-3 left-3 bg-primary/90 text-on-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {art.category || "Market"}
                      </span>
                      <button
                        onClick={(e) => handleBookmarkToggle(e, art)}
                        className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                          bookmarked ? "bg-primary text-on-primary" : "bg-background/60 text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>bookmark</span>
                      </button>
                    </div>
                    <div className="px-4 pb-4 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-outline">{art.source || "Market Desk"} · {new Date(art.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <h2 className="text-headline-sm font-bold text-on-surface leading-snug line-clamp-2">{art.title}</h2>
                      <p className="text-[12px] text-on-surface-variant leading-relaxed line-clamp-2">{art.description}</p>
                    </div>
                  </>
                ) : (
                  /* Regular card — image left / text right if image exists */
                  <div className="flex gap-3 items-start">
                    {art.image_url && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={art.image_url}
                          alt={art.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-body-sm font-bold text-on-surface leading-snug line-clamp-2 flex-1">{art.title}</h3>
                        <button
                          onClick={(e) => handleBookmarkToggle(e, art)}
                          className={`p-1 transition-colors shrink-0 ${bookmarked ? "text-primary" : "text-outline hover:text-on-surface"}`}
                        >
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' ${bookmarked ? 1 : 0}` }}>bookmark</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-outline font-semibold">
                        <span>{art.source || "Market Desk"}</span>
                        <span>·</span>
                        <span>{new Date(art.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        {art.category && (
                          <>
                            <span>·</span>
                            <span className="text-primary">{art.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
