"use client";

import { useState } from "react";
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

export default function DigestViewer({ digest }: { digest: WebDigest }) {
  const [selected, setSelected] = useState<WebPost>(digest.posts[0]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-none bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🤖</span>
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">JP AI Monitor</h1>
            <p className="text-xs text-gray-500">Japanese AI tool discoveries</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          {digest.is_mock && (
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
              Demo data
            </span>
          )}
          <span>Updated {formatDate(digest.generated_at)}</span>
          <span className="hidden sm:inline text-gray-300">·</span>
          <span className="hidden sm:inline">{digest.passed_filter} picks from {digest.total_scanned} scanned</span>
          <div className="hidden sm:flex items-center gap-1.5">
            {digest.sources.map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 capitalize">{s}</span>
            ))}
          </div>
          <a
            href="https://github.com/vedsta87/x-monitor"
            target="_blank" rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      {/* ── Main columns ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: feed */}
        <aside className="w-full sm:w-[42%] lg:w-[38%] flex-none overflow-y-auto scrollbar-thin border-r border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {digest.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSelected={selected.id === post.id}
                categoryLabel={CATEGORY_LABELS[post.category] ?? "📌"}
                onClick={() => setSelected(post)}
              />
            ))}
          </div>

          {digest.posts.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No strong signals found this week. Check back next run.
            </div>
          )}
        </aside>

        {/* Right: explainer */}
        <main className="hidden sm:flex flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
          <ExplainerPanel post={selected} categoryLabel={CATEGORY_LABELS[selected.category] ?? "📌"} />
        </main>
      </div>
    </div>
  );
}
