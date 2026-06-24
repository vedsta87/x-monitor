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

interface Exclusions {
  text_patterns: string[];
  min_likes: number;
}

interface Rubric {
  dimensions: Record<string, { weight: number; signals: string[] }>;
  threshold: number;
  top_n: number;
}

function scoreText(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  return signals.filter((s) => lower.includes(s.toLowerCase())).length > 0 ? 1 : 0;
}

function hasEvidence(post: RawPost): number {
  const evidenceSignals = ["github.com", "youtu.be", "youtube.com", "loom.com", "zenn.dev", "note.com", "notion.so", "スクリーンショット", "スクショ", "動画", "demo"];
  const combined = post.text + " " + post.urls.join(" ");
  return evidenceSignals.filter((s) => combined.toLowerCase().includes(s.toLowerCase())).length > 0 ? 1 : 0;
}

function categorize(post: RawPost): ScoredPost["category"] {
  const t = post.text.toLowerCase();
  if (t.includes("リリース") || t.includes("公開") || t.includes("launch") || t.includes("beta") || t.includes("ベータ")) return "new_tool";
  if (t.includes("作った") || t.includes("構築") || t.includes("フロー") || t.includes("workflow") || t.includes("デモ") || t.includes("demo")) return "workflow_demo";
  if (t.includes("プロンプト") || t.includes("prompt") || t.includes("テンプレ") || t.includes("template")) return "prompt_template";
  if (t.includes("創業") || t.includes("スタートアップ") || t.includes("サービス開始") || t.includes("founder")) return "founder_announcement";
  if (t.includes("試した") || t.includes("検証") || t.includes("実験") || t.includes("experiment")) return "experiment";
  return "other";
}

function extractTags(post: RawPost): string[] {
  const tags: string[] = [];
  const t = post.text;
  const tagMap: [string, string][] = [
    ["MCP", "MCP"], ["Claude", "Claude"], ["GPT", "GPT"], ["Dify", "Dify"],
    ["n8n", "n8n"], ["Make", "Make"], ["Notion", "Notion"], ["RAG", "RAG"],
    ["ノーコード", "no-code"], ["no-code", "no-code"], ["エージェント", "agent"],
    ["自動化", "automation"], ["業務改善", "ops"], ["Slack", "Slack"],
    ["Zapier", "Zapier"], ["Cursor", "Cursor"],
  ];
  for (const [signal, tag] of tagMap) {
    if (t.includes(signal) && !tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

function filterPost(post: RawPost, exclusions: Exclusions): { pass: boolean; reason?: string } {
  if (post.is_retweet) return { pass: false, reason: "retweet" };
  if (post.metrics.likes < exclusions.min_likes) return { pass: false, reason: "low_engagement" };
  for (const pattern of exclusions.text_patterns) {
    if (post.text.toLowerCase().includes(pattern.toLowerCase())) {
      return { pass: false, reason: `exclusion_pattern: ${pattern}` };
    }
  }
  return { pass: true };
}

function scorePost(post: RawPost, rubric: Rubric): ScoredPost["scores"] {
  const dims = rubric.dimensions;
  const novelty = Math.min(dims.novelty.weight, scoreText(post.text, dims.novelty.signals) * dims.novelty.weight);
  const practicality = Math.min(dims.practicality.weight, scoreText(post.text, dims.practicality.signals) * dims.practicality.weight);
  const evidence = Math.min(dims.evidence.weight, hasEvidence(post) * dims.evidence.weight);
  const relevance = Math.min(dims.relevance.weight, scoreText(post.text, dims.relevance.signals) * dims.relevance.weight);
  const japan_fit = Math.min(dims.japan_fit.weight, scoreText(post.text, dims.japan_fit.signals) * dims.japan_fit.weight);
  const total = novelty + practicality + evidence + relevance + japan_fit;
  return { novelty, practicality, evidence, relevance, japan_fit, total };
}

async function main() {
  const date = today();
  const rawPath = join(ROOT, "data", "raw", `${date}.json`);
  const posts: RawPost[] = JSON.parse(readFileSync(rawPath, "utf-8"));
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
    const tags = extractTags(post);

    scored.push({
      ...post,
      scores,
      category,
      tags,
      passed_filter: pass && scores.total >= rubric.threshold,
      filter_reason: pass ? undefined : reason,
    });
  }

  scored.sort((a, b) => b.scores.total - a.scores.total);

  const outPath = join(ROOT, "data", "processed", `${date}.json`);
  writeFileSync(outPath, JSON.stringify(scored, null, 2));

  const passed = scored.filter((p) => p.passed_filter).length;
  console.log(`✓ Scored ${posts.length} posts, ${passed} passed threshold → ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
