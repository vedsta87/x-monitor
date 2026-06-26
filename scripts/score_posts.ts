import "dotenv/config";
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { RawPost, ScoredPost } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as T;
}

interface Exclusions { text_patterns: string[]; min_likes: number; }
interface Rubric {
  dimensions: Record<string, { weight: number; signals: string[] }>;
  threshold: number;
  top_n: number;
}

function hits(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s.toLowerCase()));
}

function scorePost(post: RawPost, rubric: Rubric): ScoredPost["scores"] {
  const body = `${post.title} ${post.text} ${post.tags.join(" ")}`;
  const dims = rubric.dimensions;

  const novelty     = hits(body, dims.novelty.signals)     ? dims.novelty.weight     : 0;
  const practicality = hits(body, dims.practicality.signals) ? dims.practicality.weight : 0;
  // Evidence: explicit external link in source_url OR evidence signals in body
  const hasLink = !!post.source_url;
  const evidence    = (hasLink || hits(body, dims.evidence.signals)) ? dims.evidence.weight : 0;
  const content_value = hits(body, dims.content_value.signals) ? dims.content_value.weight : 0;
  const japan_fit     = hits(body, dims.japan_fit.signals)     ? dims.japan_fit.weight     : 0;

  return { novelty, practicality, evidence, content_value, japan_fit, total: novelty + practicality + evidence + content_value + japan_fit };
}

function categorize(post: RawPost): ScoredPost["category"] {
  const t = `${post.title} ${post.text}`.toLowerCase();
  if (t.includes("リリース") || t.includes("公開") || t.includes("launch") || t.includes("発表") || t.includes("ベータ")) return "new_tool";
  if (t.includes("作った") || t.includes("構築") || t.includes("フロー") || t.includes("workflow") || t.includes("デモ") || t.includes("demo") || t.includes("自動")) return "workflow_demo";
  if (t.includes("プロンプト") || t.includes("prompt") || t.includes("テンプレ") || t.includes("template")) return "prompt_template";
  if (t.includes("創業") || t.includes("スタートアップ") || t.includes("サービス開始") || t.includes("起業")) return "founder_announcement";
  if (t.includes("試した") || t.includes("検証") || t.includes("実験") || t.includes("比較") || t.includes("まとめ")) return "experiment";
  return "other";
}

function inferTags(post: RawPost): string[] {
  const tags: string[] = [...post.tags];
  const body = `${post.title} ${post.text}`;
  const tagMap: [string, string][] = [
    ["MCP", "MCP"], ["Claude", "Claude"], ["GPT", "GPT"], ["Dify", "Dify"],
    ["n8n", "n8n"], ["Make", "Make"], ["Notion", "Notion"], ["RAG", "RAG"],
    ["ノーコード", "no-code"], ["no-code", "no-code"], ["エージェント", "agent"],
    ["自動化", "automation"], ["業務改善", "ops"], ["Slack", "Slack"],
    ["Zapier", "Zapier"], ["Cursor", "Cursor"], ["Qiita", "Qiita"], ["Zenn", "Zenn"],
    ["SaaS", "SaaS"], ["MVP", "MVP"], ["プロンプト", "prompt"],
  ];
  for (const [signal, tag] of tagMap) {
    if (body.includes(signal) && !tags.includes(tag)) tags.push(tag);
  }
  return [...new Set(tags)];
}

function filterPost(post: RawPost, exclusions: Exclusions): { pass: boolean; reason?: string } {
  if (post.metrics.likes < exclusions.min_likes) return { pass: false, reason: "low_engagement" };
  const body = `${post.title} ${post.text}`.toLowerCase();
  for (const pattern of exclusions.text_patterns) {
    if (body.includes(pattern.toLowerCase())) return { pass: false, reason: `exclusion: ${pattern}` };
  }
  return { pass: true };
}

async function main() {
  const date = today();
  const posts: RawPost[] = JSON.parse(readFileSync(join(ROOT, "data", "raw", `${date}.json`), "utf-8"));
  const exclusions = readJson<Exclusions>("config/exclusions.json");
  const rubric = readJson<Rubric>("config/scoring-rubric.json");

  const seen = new Set<string>();
  const scored: ScoredPost[] = [];

  for (const post of posts) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);

    const { pass, reason } = filterPost(post, exclusions);
    const scores = scorePost(post, rubric);
    const category = categorize(post);
    const inferred_tags = inferTags(post);

    scored.push({
      ...post,
      scores,
      category,
      inferred_tags,
      passed_filter: pass && scores.total >= rubric.threshold,
      filter_reason: pass ? undefined : reason,
    });
  }

  scored.sort((a, b) => b.scores.total - a.scores.total);

  let rank = 1;
  for (const p of scored) {
    if (p.passed_filter) p.rank = rank++;
  }

  const outPath = join(ROOT, "data", "processed", `${date}.json`);
  writeFileSync(outPath, JSON.stringify(scored, null, 2));

  const passed = scored.filter((p) => p.passed_filter).length;
  console.log(`✓ Scored ${posts.length} posts, ${passed} passed threshold → ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
