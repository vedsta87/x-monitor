import "dotenv/config";
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { ScoredPost } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as T;
}

const CATEGORY_LABELS: Record<string, string> = {
  new_tool: "New tools",
  workflow_demo: "Workflow demos",
  prompt_template: "Prompts & templates",
  founder_announcement: "Founder & product announcements",
  experiment: "Interesting experiments",
  other: "Other",
};

function formatPost(post: ScoredPost, rank?: number): string {
  const handle = post.author_handle ? `@${post.author_handle}` : `User ${post.author_id}`;
  const link = post.urls[0] ?? `https://x.com/i/web/status/${post.id}`;
  const tags = post.tags.length ? `\`${post.tags.join("` `")}\`` : "";
  const scoreStr = `${post.scores.total}/25 (N:${post.scores.novelty} P:${post.scores.practicality} E:${post.scores.evidence} R:${post.scores.relevance} JP:${post.scores.japan_fit})`;
  const prefix = rank !== undefined ? `**${rank}.**` : "-";

  return [
    `${prefix} **${handle}** ${tags}`,
    `   > ${post.text.slice(0, 180)}${post.text.length > 180 ? "…" : ""}`,
    `   🔗 ${link}`,
    `   Score: ${scoreStr}`,
  ].join("\n");
}

function suggestKeywords(posts: ScoredPost[]): string[] {
  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  return [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

function suggestWatchlist(posts: ScoredPost[]): string[] {
  return posts
    .filter((p) => p.passed_filter && p.scores.total >= 18 && p.author_handle)
    .slice(0, 3)
    .map((p) => `@${p.author_handle}`)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

async function main() {
  const date = today();
  const posts: ScoredPost[] = readJson<ScoredPost[]>(`data/processed/${date}.json`);
  const top = posts.filter((p) => p.passed_filter).slice(0, 10);

  if (top.length === 0) {
    const digest = `# Daily Japanese AI Tool Digest — ${date}\n\n**No strong signals found in this run.**\n\n## Suggested next keywords\n- Try expanding: ノーコード SaaS, Claude API Japan, LLM比較\n\n## Watchlist suggestions\n- Search for active accounts in: AIエージェント, MCP, Dify\n`;
    const outPath = join(ROOT, "data", "digests", `${date}.md`);
    writeFileSync(outPath, digest);
    console.log(`✓ No strong items — empty digest written → ${outPath}`);
    return;
  }

  const byCategory = new Map<string, ScoredPost[]>();
  for (const post of top) {
    const arr = byCategory.get(post.category) ?? [];
    arr.push(post);
    byCategory.set(post.category, arr);
  }

  const topPicks = top.slice(0, 3);
  const actionable = top.slice(0, 3).map((p) => `@${p.author_handle ?? p.author_id}: ${p.text.slice(0, 80)}…`);
  const nextKeywords = suggestKeywords(top);
  const watchlist = suggestWatchlist(top);

  const sections: string[] = [];

  sections.push(`# Daily Japanese AI Tool Digest — ${date}`);
  sections.push(`\n> ${top.length} items passed filter from ${posts.length} total posts scanned.\n`);

  sections.push("## Top picks");
  topPicks.forEach((p, i) => sections.push(formatPost(p, i + 1)));

  for (const [cat, catPosts] of byCategory.entries()) {
    const label = CATEGORY_LABELS[cat] ?? cat;
    sections.push(`\n## ${label}`);
    for (const p of catPosts) sections.push(formatPost(p));
  }

  sections.push("\n## Most actionable items");
  actionable.forEach((a, i) => sections.push(`${i + 1}. ${a}`));

  sections.push("\n## Next scan keywords");
  nextKeywords.forEach((k) => sections.push(`- ${k}`));

  sections.push("\n## Watchlist additions");
  if (watchlist.length) {
    watchlist.forEach((w) => sections.push(`- ${w}`));
  } else {
    sections.push("- No new high-signal accounts found this run.");
  }

  const digest = sections.join("\n");
  const outPath = join(ROOT, "data", "digests", `${date}.md`);
  writeFileSync(outPath, digest);
  console.log(`✓ Digest written → ${outPath}`);
  console.log(digest);
}

main().catch((e) => { console.error(e); process.exit(1); });
