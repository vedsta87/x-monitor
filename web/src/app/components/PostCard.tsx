import type { WebPost } from "@/types/digest";

function scoreColor(total: number): string {
  if (total >= 20) return "bg-emerald-100 text-emerald-700";
  if (total >= 15) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "just now";
}

interface Props {
  post: WebPost;
  isSelected: boolean;
  isBookmarked: boolean;
  categoryLabel: string;
  onClick: () => void;
  onBookmark: (e: React.MouseEvent) => void;
}

export default function PostCard({ post, isSelected, isBookmarked, categoryLabel, onClick, onBookmark }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 transition-colors group focus:outline-none ${
        isSelected
          ? "bg-blue-50 border-l-2 border-blue-500"
          : "border-l-2 border-transparent hover:bg-gray-50"
      }`}
    >
      {/* Top row: platform badge + rank + score + bookmark */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm text-white"
            style={{ backgroundColor: post.platform_color }}
          >
            {post.platform_label}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">#{post.rank}</span>
          <span className="text-[10px] text-gray-400">{categoryLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${scoreColor(post.scores.total)}`}>
            {post.scores.total}/25
          </span>
          {/* Bookmark button */}
          <span
            role="button"
            onClick={onBookmark}
            title={isBookmarked ? "Remove bookmark" : "Save for later"}
            className={`text-sm leading-none transition-opacity select-none cursor-pointer ${
              isBookmarked ? "opacity-100" : "opacity-20 group-hover:opacity-50"
            }`}
          >
            {isBookmarked ? "❤️" : "🤍"}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className={`text-xs font-semibold leading-snug mb-1 line-clamp-2 ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
        {post.title}
      </p>

      {/* English summary preview */}
      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
        {post.english_summary}
      </p>

      {/* Bottom: author + metrics + time */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">@{post.author_handle}</span>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {post.metrics.likes > 0 && <span>❤️ {post.metrics.likes.toLocaleString()}</span>}
          {post.metrics.comments !== undefined && post.metrics.comments > 0 && <span>💬 {post.metrics.comments}</span>}
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
