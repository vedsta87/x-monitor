import "dotenv/config";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { ScoredPost, WebPost, WebDigest, Platform } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MOCK = process.env.MOCK_DATA === "true";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const PLATFORM_META: Record<Platform, { label: string; color: string }> = {
  zenn:  { label: "Zenn",  color: "#3ea8ff" },
  qiita: { label: "Qiita", color: "#55c500" },
  note:  { label: "Note",  color: "#41c9b4" },
  mock:  { label: "Demo",  color: "#9ca3af" },
};

function cleanText(raw: string): string {
  return raw
    .replace(/!\[.*?\]\(.*?\)/g, "")  // strip markdown images
    .replace(/<[^>]+>/g, " ")          // strip HTML tags
    .replace(/https?:\/\/\S+/g, "")    // strip bare URLs
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackSummary(post: ScoredPost): { en: string; ja: string; why: string } {
  const preview = cleanText(post.text).slice(0, 180);
  return {
    en: preview || post.title,
    ja: post.title,
    why: "High-signal content from the Japanese AI developer community.",
  };
}

async function main() {
  const date = today();
  const posts: ScoredPost[] = JSON.parse(
    readFileSync(join(ROOT, "data", "processed", `${date}.json`), "utf-8")
  );

  const passed = posts.filter((p) => p.passed_filter);
  const top = passed.slice(0, 10);
  const sources = [...new Set(passed.map((p) => p.platform))] as Platform[];

  const webPosts: WebPost[] = top.map((p, i) => {
    const meta = PLATFORM_META[p.platform] ?? PLATFORM_META.mock;
    const fb = fallbackSummary(p);
    return {
      ...p,
      rank: i + 1,
      platform_label: meta.label,
      platform_color: meta.color,
      english_summary: p.english_summary ?? fb.en,
      japanese_summary: p.japanese_summary ?? fb.ja,
      why_it_matters: p.why_it_matters ?? fb.why,
    };
  });

  const digest: WebDigest = {
    date,
    generated_at: new Date().toISOString(),
    is_mock: MOCK,
    sources,
    total_scanned: posts.length,
    passed_filter: passed.length,
    posts: webPosts,
  };

  const outDir = join(ROOT, "web", "public", "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "latest.json");
  writeFileSync(outPath, JSON.stringify(digest, null, 2));
  console.log(`✓ Web digest → ${outPath} (${webPosts.length} posts)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
