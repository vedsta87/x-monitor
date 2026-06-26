/**
 * Generates English summaries, Japanese one-liners, and "why it matters"
 * for the top scored posts using Claude Haiku. Enriches processed JSON in-place.
 */
import "dotenv/config";
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import type { ScoredPost } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TOP_N = 15; // only summarize what will appear in the digest

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function cleanText(raw: string): string {
  return raw
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

async function summarise(client: Anthropic, post: ScoredPost): Promise<{
  english_summary: string;
  japanese_summary: string;
  why_it_matters: string;
}> {
  const body = cleanText(post.text);
  const prompt = `You are a bilingual JP/EN assistant curating Japanese tech articles about AI tools, workflows, and product launches for a public digest.

Article (Japanese):
Title: ${post.title}
Platform: ${post.platform}
Preview: ${body}

Write three short outputs. Respond ONLY with JSON, no extra text:

{
  "english_summary": "1–2 sentence English description of what this article is about and what it demonstrates or teaches. Be specific. No personal names or company names.",
  "japanese_summary": "1文で内容を要約してください（日本語）。固有の社名・人名は含めないでください。",
  "why_it_matters": "1–2 sentence explanation of why this is practically useful for anyone building AI products or workflows. Be concrete. Do NOT mention specific companies, clients, or business names."
}`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Bad response: ${text.slice(0, 100)}`);
  return JSON.parse(match[0]) as { english_summary: string; japanese_summary: string; why_it_matters: string };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in .env");

  const client = new Anthropic({ apiKey });
  const date = today();
  const processedPath = join(ROOT, "data", "processed", `${date}.json`);
  const posts: ScoredPost[] = JSON.parse(readFileSync(processedPath, "utf-8"));

  const toSummarise = posts
    .filter((p) => p.passed_filter && !p.english_summary)
    .slice(0, TOP_N);

  console.log(`Summarising ${toSummarise.length} posts with Claude Haiku...`);

  for (const post of toSummarise) {
    try {
      const summaries = await summarise(client, post);
      post.english_summary = summaries.english_summary;
      post.japanese_summary = summaries.japanese_summary;
      post.why_it_matters = summaries.why_it_matters;
      process.stdout.write(".");
    } catch (err) {
      process.stdout.write("✗");
      console.warn(`\n  Failed for ${post.id}: ${(err as Error).message}`);
    }
  }

  writeFileSync(processedPath, JSON.stringify(posts, null, 2));
  console.log(`\n✓ Summaries written → ${processedPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
