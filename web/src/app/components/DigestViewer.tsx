"use client";

import { useState, useEffect } from "react";
import type { WebDigest, WebPost } from "@/types/digest";
import PostCard from "./PostCard";
import ExplainerPanel from "./ExplainerPanel";

const CATEGORY_LABELS: Record<string, string> = {
  new_tool: "🛠 New tool",
  workflow_demo: "⚙️ Workflow",
  prompt_template: "📝 Prompt",
  founder_announcement: "🚀 Launch",
  experiment: "🧪 Experiment",
  other: "📌 Other",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

type SortMode = "score" | "date";
type FilterMode = "all" | "saved";

export default function DigestViewer({ digest }: { digest: WebDigest }) {
  const [selected, setSelected] = useState<WebPost>(digest.posts[0]);
  const [sortBy, setSortBy] = useState<SortMode>("score");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("jp-ai-monitor-bookmarks");
    if (saved) {
      try { setBookmarks(new Set(JSON.parse(saved) as string[])); } catch {}
    }
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("jp-ai-monitor-bookmarks", JSON.stringify([...next]));
      return next;
    });
  };

  const sorted = [...digest.posts].sort((a, b) =>
    sortBy === "date"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : a.rank - b.rank
  );

  const visible = filterMode === "saved" ? sorted.filter((p) => bookmarks.has(p.id)) : sorted;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        className="flex-none px-5 py-3 flex items-center justify-between gap-4"
        style={{ backgroundColor: "#1a6b6b" }}
      >
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-none"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <svg className="w-4.5 h-4.5 text-white" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2.5"/>
              <path d="M8 21h8M12 17v4"/>
              <polyline points="5,12 7.5,7.5 9.5,13 12,5.5 14.5,12 16.5,9 19,12"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white leading-tight tracking-tight">JP AI Monitor</h1>
              <span className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }}>
                by Seranova
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>Japanese AI discoveries · weekly</p>
          </div>
        </div>

        {/* Right: stats + sources + github */}
        <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
          {digest.is_mock && (
            <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-full font-medium text-[10px]">
              Demo data
            </span>
          )}
          <span className="hidden sm:inline">Updated {formatDate(digest.generated_at)}</span>
          <span className="hidden sm:inline" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
          <span className="hidden sm:inline">{digest.passed_filter} picks from {digest.total_scanned} scanned</span>
          <div className="hidden md:flex items-center gap-1.5">
            {digest.sources.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>{s}</span>
            ))}
          </div>
          <a
            href="https://github.com/vedsta87/x-monitor"
            target="_blank" rel="noopener noreferrer"
            className="transition-opacity hover:opacity-100 opacity-60"
            aria-label="GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      {/* ── Main columns ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: feed */}
        <aside className="w-full sm:w-[42%] lg:w-[38%] flex-none flex flex-col overflow-hidden border-r border-gray-200 bg-white">

          {/* Feed controls */}
          <div className="flex-none flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            {/* Filter tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterMode("all")}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filterMode === "all" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                All {digest.posts.length}
              </button>
              <button
                onClick={() => setFilterMode("saved")}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filterMode === "saved" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                ❤️ Saved {bookmarks.size > 0 ? bookmarks.size : ""}
              </button>
            </div>

            {/* Sort toggle */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
              <button
                onClick={() => setSortBy("score")}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  sortBy === "score" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Score
              </button>
              <button
                onClick={() => setSortBy("date")}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  sortBy === "date" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Newest
              </button>
            </div>
          </div>

          {/* Scrollable feed */}
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-gray-100">
            {visible.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSelected={selected.id === post.id}
                isBookmarked={bookmarks.has(post.id)}
                categoryLabel={CATEGORY_LABELS[post.category] ?? "📌"}
                onClick={() => setSelected(post)}
                onBookmark={(e) => toggleBookmark(post.id, e)}
              />
            ))}

            {visible.length === 0 && filterMode === "saved" && (
              <div className="p-8 text-center text-gray-400 text-sm">
                <p className="text-2xl mb-2">❤️</p>
                <p>No saved posts yet.</p>
                <p className="text-xs mt-1">Click the heart on any article to save it.</p>
              </div>
            )}
            {visible.length === 0 && filterMode === "all" && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No strong signals found this week.
              </div>
            )}
          </div>
        </aside>

        {/* Right: explainer */}
        <main className="hidden sm:flex flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
          {selected
            ? <ExplainerPanel post={selected} categoryLabel={CATEGORY_LABELS[selected.category] ?? "📌"} isBookmarked={bookmarks.has(selected.id)} onBookmark={(e) => toggleBookmark(selected.id, e)} />
            : <div className="m-auto text-gray-400 text-sm">Select an article</div>
          }
        </main>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="flex-none border-t border-gray-100 px-6 py-2 flex items-center justify-between bg-white">
        <a
          href="https://seranova.jp"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 group"
        >
          <span className="text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors">
            Part of the
          </span>
          <span
            className="text-[11px] font-semibold group-hover:opacity-80 transition-opacity"
            style={{ color: "#1a6b6b" }}
          >
            Seranova
          </span>
          <span className="text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors">
            AI ecosystem
          </span>
        </a>
        <span className="text-[10px] text-gray-300 hidden sm:inline">
          Monitoring Japanese AI developments · Zenn · Qiita · Note
        </span>
      </footer>
    </div>
  );
}
