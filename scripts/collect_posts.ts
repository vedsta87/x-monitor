import "dotenv/config";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { XMLParser } from "fast-xml-parser";
import type { RawPost, Platform } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MOCK_DATA = process.env.MOCK_DATA === "true";
const QIITA_TOKEN = process.env.QIITA_TOKEN; // optional, increases rate limit

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function extractExternalUrl(text: string): string | undefined {
  const patterns = [
    /https?:\/\/github\.com\/[^\s\)\"]+/,
    /https?:\/\/youtu\.be\/[^\s\)\"]+/,
    /https?:\/\/youtube\.com\/[^\s\)\"]+/,
    /https?:\/\/loom\.com\/[^\s\)\"]+/,
    /https?:\/\/[^\s\)\"]+\.vercel\.app[^\s\)\""]*/,
    /https?:\/\/[^\s\)\"]+\.pages\.dev[^\s\)\""]*/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return undefined;
}

// ─── Zenn ────────────────────────────────────────────────────────────────────

async function fetchZenn(): Promise<RawPost[]> {
  const topics = ["生成ai", "llm", "aiagent", "mcp", "rag", "dify", "langchain"];
  // Zenn serves RSS 2.0 (not Atom), so we parse rss.channel.item
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", cdataPropName: "__cdata" });
  const posts: RawPost[] = [];
  const seen = new Set<string>();

  for (const topic of topics) {
    try {
      const res = await fetch(`https://zenn.dev/topics/${encodeURIComponent(topic)}/feed`, {
        headers: { "User-Agent": "x-monitor/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const data = parser.parse(xml) as { rss?: { channel?: { item?: unknown[] | unknown } } };
      const rawItems = data?.rss?.channel?.item ?? [];
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];

      for (const e of items) {
        const item = e as Record<string, unknown>;
        const url = String(item["link"] ?? item["guid"] ?? "");
        if (!url || !url.startsWith("http") || seen.has(url)) continue;
        seen.add(url);

        // CDATA fields come back as { __cdata: "..." }
        const cdata = (v: unknown): string =>
          v && typeof v === "object" && "__cdata" in (v as object)
            ? String((v as Record<string, unknown>)["__cdata"])
            : String(v ?? "");

        const body = cdata(item["description"]);
        const author = cdata(item["dc:creator"]);
        const slug = url.split("/").pop() ?? String(Date.now());

        posts.push({
          id: `zenn_${slug}`,
          platform: "zenn" as Platform,
          title: cdata(item["title"]),
          text: body.replace(/<[^>]+>/g, "").slice(0, 500),
          created_at: String(item["pubDate"] ?? new Date().toISOString()),
          author_id: author,
          author_handle: author,
          author_name: author,
          article_url: url,
          source_url: extractExternalUrl(body),
          metrics: { likes: 0, comments: 0 },
          tags: [topic],
        });
      }
    } catch (err) {
      console.warn(`Zenn fetch failed for topic ${topic}:`, (err as Error).message);
    }
  }

  return posts;
}

// ─── Qiita ───────────────────────────────────────────────────────────────────

async function fetchQiita(): Promise<RawPost[]> {
  const searchTerms = ["生成AI", "LLM", "AIエージェント", "MCP", "RAG", "Dify", "n8n"];
  const posts: RawPost[] = [];
  const seen = new Set<string>();
  const headers: Record<string, string> = { "User-Agent": "x-monitor/1.0" };
  if (QIITA_TOKEN) headers["Authorization"] = `Bearer ${QIITA_TOKEN}`;

  for (const term of searchTerms) {
    try {
      const params = new URLSearchParams({ query: `tag:${term}`, per_page: "15", sort: "created" });
      const res = await fetch(`https://qiita.com/api/v2/items?${params}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const items = await res.json() as Array<{
        id: string; title: string; url: string; body: string;
        likes_count: number; created_at: string;
        user: { id: string; name: string };
        tags: Array<{ name: string }>;
      }>;

      for (const item of items) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        posts.push({
          id: `qiita_${item.id}`,
          platform: "qiita" as Platform,
          title: item.title,
          text: item.body.slice(0, 500),
          created_at: item.created_at,
          author_id: item.user.id,
          author_handle: item.user.id,
          author_name: item.user.name,
          article_url: item.url,
          source_url: extractExternalUrl(item.body),
          metrics: { likes: item.likes_count },
          tags: item.tags.map((t) => t.name),
        });
      }
    } catch (err) {
      console.warn(`Qiita fetch failed for term ${term}:`, (err as Error).message);
    }
  }

  return posts;
}

// ─── Note.com ────────────────────────────────────────────────────────────────
// Note.com has no stable public API as of mid-2026. Keeping the function
// as a no-op so adding support later is easy.

async function fetchNote(): Promise<RawPost[]> {
  console.warn("Note.com: no stable public API available — skipping.");
  return [];
}

// ─── Mock data ───────────────────────────────────────────────────────────────

function generateMockPosts(): RawPost[] {
  return [
    {
      id: "zenn_mcp_notion_agent",
      platform: "zenn",
      title: "Claude MCPでNotionを操作するAIエージェントを100行で作る",
      text: "MCP（Model Context Protocol）を使ってClaude DesktopからNotionデータベースを直接操作するエージェントを構築しました。セットアップから動作確認まで全手順を解説します。GitHubリポジトリも公開中: https://github.com/example/mcp-notion-agent",
      created_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
      author_id: "yuki_builder",
      author_handle: "yuki_builder",
      author_name: "Yuki / AIビルダー",
      article_url: "https://zenn.dev/yuki_builder/articles/mcp-notion-agent",
      source_url: "https://github.com/example/mcp-notion-agent",
      metrics: { likes: 312, comments: 24 },
      tags: ["MCP", "Claude", "Notion", "AIエージェント"],
      english_summary: "Step-by-step guide to building a Claude MCP agent that directly operates Notion databases in under 100 lines of code.",
      japanese_summary: "Claude MCPでNotionを操作するエージェントを100行以下で構築する全手順を解説。",
      why_it_matters: "MCP integration patterns are becoming the standard for AI-to-SaaS automation — this is a directly reusable pattern for Seranova client workflows.",
    },
    {
      id: "qiita_n8n_slack_notion_cal",
      platform: "qiita",
      title: "n8nでSlack→Notion→Googleカレンダーの3-way自動同期を構築した全記録",
      text: "会議メモをSlackで受け取り、Notionにタスクとして保存し、Googleカレンダーに自動登録するn8nワークフローを本番稼働させました。ワークフローのJSONもGitHubで公開します。https://github.com/example/n8n-3way-sync",
      created_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
      author_id: "masato_automate",
      author_handle: "masato_automate",
      author_name: "Masato | 自動化エンジニア",
      article_url: "https://qiita.com/masato_automate/items/n8n-3way-sync",
      source_url: "https://github.com/example/n8n-3way-sync",
      metrics: { likes: 189, comments: 18 },
      tags: ["n8n", "Notion", "Slack", "GoogleCalendar", "自動化"],
      english_summary: "Complete walkthrough of an n8n workflow that syncs Slack meeting notes → Notion tasks → Google Calendar events automatically.",
      japanese_summary: "Slack会議メモをNotionタスク化しGoogleカレンダーへ自動連携するn8nワークフローの全記録。",
      why_it_matters: "This 3-way sync pattern solves a real pain point in Japanese SMB ops — good template for a Crossteria-style client pitch.",
    },
    {
      id: "note_dify_rag_social",
      platform: "note",
      title: "DifyでSNS投稿を自動生成するRAGシステムを作った話",
      text: "自社の過去コンテンツ200本をDifyにベクトル化して、新しいSNS投稿を自動生成するRAGシステムを構築しました。精度と実際の使用感についてレポートします。",
      created_at: new Date(Date.now() - 8 * 3600_000).toISOString(),
      author_id: "rie_content_ai",
      author_handle: "rie_content_ai",
      author_name: "Rie | コンテンツAI",
      article_url: "https://note.com/rie_content_ai/n/dify-rag-social",
      source_url: undefined,
      metrics: { likes: 245 },
      tags: ["Dify", "RAG", "SNS", "生成AI"],
      english_summary: "A content creator vectorized 200 past posts in Dify and built a RAG system to auto-generate new social content, with a candid assessment of accuracy.",
      japanese_summary: "過去コンテンツ200本をDifyでベクトル化しSNS投稿を自動生成するRAGシステムの構築レポート。",
      why_it_matters: "RAG on owned content is a recurring SMB AI use case — this shows a practical non-technical implementation path using Dify.",
    },
    {
      id: "zenn_claude_api_jp_prompt",
      platform: "zenn",
      title: "Claude APIで日本語出力品質を上げる7つのプロンプトパターン",
      text: "Claude APIを使って日本語ビジネス文書を生成する際に効果的だったプロンプトパターンをまとめました。敬語モード、箇条書き強制、出力長コントロールなど実務で使えるテクニックを網羅。",
      created_at: new Date(Date.now() - 12 * 3600_000).toISOString(),
      author_id: "prompt_lab_jp",
      author_handle: "prompt_lab_jp",
      author_name: "Prompt Lab JP",
      article_url: "https://zenn.dev/prompt_lab_jp/articles/claude-jp-prompt-patterns",
      source_url: undefined,
      metrics: { likes: 567, comments: 41 },
      tags: ["Claude", "プロンプト", "日本語", "LLM"],
      english_summary: "Seven battle-tested prompt patterns for getting Claude to produce high-quality Japanese business documents, covering honorifics mode, formatting control, and output length.",
      japanese_summary: "Claude APIで日本語ビジネス文書を生成するための実務プロンプトパターン7選。",
      why_it_matters: "Directly applicable to Seranova's client-facing deliverables and blog — saves real prompt engineering time.",
    },
    {
      id: "qiita_make_inquiry_classifier",
      platform: "qiita",
      title: "Make.com + Claude APIで問い合わせを自動分類・担当者振り分けするフローを構築",
      text: "月200件超の問い合わせメールをMake.comとClaude APIで自動分類し、担当者に自動振り分けするフローを実装しました。精度95%、月3時間の削減効果を確認済みです。",
      created_at: new Date(Date.now() - 18 * 3600_000).toISOString(),
      author_id: "ops_hacker_jp",
      author_handle: "ops_hacker_jp",
      author_name: "OpsHacker JP",
      article_url: "https://qiita.com/ops_hacker_jp/items/make-claude-inquiry",
      source_url: undefined,
      metrics: { likes: 134, comments: 9 },
      tags: ["Make", "Claude", "自動化", "業務改善"],
      english_summary: "Automated inquiry email classification and routing using Make.com + Claude API, achieving 95% accuracy and saving 3 hours/month at 200+ monthly inquiries.",
      japanese_summary: "Make.com+Claude APIで月200件の問い合わせを自動分類・振り分け。精度95%、月3時間削減を実現。",
      why_it_matters: "Concrete ROI numbers (95% accuracy, 3hr/mo saved) make this usable as a benchmark in Seranova's SMB AI audit pitches.",
    },
    {
      id: "note_ai_startup_smb",
      platform: "note",
      title: "資金調達なしで日本のSMB向けAI導入支援を始めた理由",
      text: "AIスタートアップを創業して3ヶ月が経ちました。資金調達せず、最初から収益化を目指した理由と、中小企業へのAI導入支援で学んだことをまとめます。",
      created_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
      author_id: "kenji_ai_founder",
      author_handle: "kenji_ai_founder",
      author_name: "Kenji | AI startup",
      article_url: "https://note.com/kenji_ai_founder/n/ai-startup-smb-japan",
      source_url: "https://example-startup.jp",
      metrics: { likes: 178 },
      tags: ["AIスタートアップ", "中小企業", "AI導入", "起業"],
      english_summary: "A founder shares 3 months of learnings building a bootstrapped AI adoption consultancy for Japanese SMBs, with candid notes on what actually works.",
      japanese_summary: "資金調達なしでSMB向けAI導入支援スタートアップを3ヶ月運営した学びを公開。",
      why_it_matters: "A direct competitor/peer in the JP AI consulting space — good to watch their positioning and pricing signals.",
    },
    {
      id: "zenn_cursor_claude_mvp",
      platform: "zenn",
      title: "Cursor + Claude Opus 4でMVPを1週間で作った開発プロセス全公開",
      text: "CursorとClaude Opus 4を組み合わせてSaaSのMVPを1週間で開発した全プロセスを公開します。要件定義→設計→実装→テストの流れ、使ったプロンプト、詰まったポイントをすべて書きました。",
      created_at: new Date(Date.now() - 30 * 3600_000).toISOString(),
      author_id: "dev_tanaka_ai",
      author_handle: "dev_tanaka_ai",
      author_name: "Tanaka | フルスタックAI",
      article_url: "https://zenn.dev/dev_tanaka_ai/articles/cursor-claude-mvp-1week",
      source_url: undefined,
      metrics: { likes: 423, comments: 35 },
      tags: ["Cursor", "Claude", "MVP", "SaaS開発"],
      english_summary: "Full transparent write-up of shipping a SaaS MVP in 1 week using Cursor + Claude Opus 4, covering the entire process from spec to deployment with actual prompts used.",
      japanese_summary: "Cursor+Claude Opus 4でSaaS MVPを1週間で開発した全プロセスを使用プロンプト付きで公開。",
      why_it_matters: "Directly relevant to Seranova's AI micro-ventures work — this is the fastest current benchmark for solo AI-assisted SaaS development.",
    },
    {
      id: "qiita_rag_eval_japanese",
      platform: "qiita",
      title: "日本語RAGの精度評価指標と改善手法まとめ2026",
      text: "日本語でRAGシステムを構築する際の精度評価方法と、よく起きる問題（チャンク分割、ベクトル化、リランキング）への対処法をまとめました。実験結果のデータも公開します。",
      created_at: new Date(Date.now() - 36 * 3600_000).toISOString(),
      author_id: "llm_researcher_jp",
      author_handle: "llm_researcher_jp",
      author_name: "LLM Researcher JP",
      article_url: "https://qiita.com/llm_researcher_jp/items/rag-eval-japanese-2026",
      source_url: undefined,
      metrics: { likes: 298, comments: 22 },
      tags: ["RAG", "LLM", "日本語", "評価"],
      english_summary: "A 2026 benchmark of evaluation metrics and improvement techniques for Japanese-language RAG systems, with published experimental data on chunking, vectorization, and reranking.",
      japanese_summary: "日本語RAGの精度評価指標と改善手法（チャンク・ベクトル化・リランキング）の2026年まとめ。",
      why_it_matters: "Essential reference if any Seranova client projects involve Japanese document RAG — saves weeks of trial and error.",
    },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let posts: RawPost[];

  if (MOCK_DATA) {
    posts = generateMockPosts();
    console.log(`✓ Generated ${posts.length} mock posts`);
  } else {
    console.log("Fetching from Zenn, Qiita, Note...");
    const [zenn, qiita, note] = await Promise.all([fetchZenn(), fetchQiita(), fetchNote()]);
    posts = [...zenn, ...qiita, ...note];
    console.log(`✓ Zenn: ${zenn.length}  Qiita: ${qiita.length}  Note: ${note.length}  Total: ${posts.length}`);
  }

  const outPath = join(ROOT, "data", "raw", `${today()}.json`);
  writeFileSync(outPath, JSON.stringify(posts, null, 2));
  console.log(`✓ Saved → ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
