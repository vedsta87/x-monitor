import type { WebPost, PostScores } from "@/types/digest";

const SCORE_LABELS: [keyof PostScores, string][] = [
  ["novelty",      "Novelty"],
  ["practicality", "Practicality"],
  ["evidence",     "Evidence"],
  ["relevance",    "Relevance"],
  ["japan_fit",    "Japan fit"],
];

function ScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 4 ? "bg-emerald-400" : value >= 3 ? "bg-blue-400" : value >= 1 ? "bg-amber-400" : "bg-gray-200";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-6 text-right">{value}/{max}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  post: WebPost;
  categoryLabel: string;
}

export default function ExplainerPanel({ post, categoryLabel }: Props) {
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-6 gap-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded text-white"
            style={{ backgroundColor: post.platform_color }}
          >
            {post.platform_label}
          </span>
          <span className="text-xs text-gray-500">{categoryLabel}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">Rank #{post.rank}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 leading-snug mb-1">
          {post.title}
        </h2>
        <p className="text-xs text-gray-400">by @{post.author_handle} · {post.author_name}</p>
      </div>

      {/* ── English summary ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">What it is</p>
        <p className="text-sm text-gray-800 leading-relaxed">{post.english_summary}</p>
      </div>

      {/* ── Japanese summary ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">🇯🇵 日本語サマリー</p>
        <p className="text-sm text-gray-700 leading-relaxed">{post.japanese_summary}</p>
      </div>

      {/* ── Why it matters ──────────────────────────────────────────────── */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">Why it matters</p>
        <p className="text-sm text-blue-900 leading-relaxed">{post.why_it_matters}</p>
      </div>

      {/* ── Tags ────────────────────────────────────────────────────────── */}
      {post.inferred_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.inferred_tags.map((tag) => (
            <span key={tag} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Score breakdown ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Score breakdown</p>
          <span className="text-sm font-bold text-gray-900">{post.scores.total}<span className="text-xs font-normal text-gray-400">/25</span></span>
        </div>
        <div className="flex flex-col gap-2">
          {SCORE_LABELS.map(([key, label]) => (
            <ScoreBar key={key} label={label} value={post.scores[key] as number} />
          ))}
        </div>
      </div>

      {/* ── CTA buttons ─────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <a
          href={post.article_url}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-medium py-2.5 px-4 rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: post.platform_color }}
        >
          Read on {post.platform_label} →
        </a>
        {post.source_url && (
          <a
            href={post.source_url}
            target="_blank" rel="noopener noreferrer"
            className="text-sm font-medium py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Source ↗
          </a>
        )}
      </div>

    </div>
  );
}
