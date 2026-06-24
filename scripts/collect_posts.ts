import "dotenv/config";
import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { RawPost } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const BEARER_TOKEN = process.env.X_BEARER_TOKEN;
const MOCK_DATA = process.env.MOCK_DATA === "true";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as T;
}

// --- Mock data for demo runs without X API ---
function generateMockPosts(): RawPost[] {
  return [
    {
      id: "mock_001",
      text: "Claude MCPを使って自分のNotionデータベースをAIエージェントから直接更新する仕組みを作った。コード100行以下で動く。デモ動画: https://youtu.be/example1",
      created_at: new Date().toISOString(),
      author_id: "u_001",
      author_handle: "yuki_builder",
      author_name: "Yuki / AIビルダー",
      metrics: { retweets: 45, replies: 12, likes: 230, quotes: 8 },
      urls: ["https://youtu.be/example1"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "MCP AIエージェント",
    },
    {
      id: "mock_002",
      text: "n8nでSlack→Notion→Googleカレンダーの3-way自動同期を作ったので手順を公開。会議メモを自動でタスク化してカレンダーに入れてくれる。GitHubはこちら: https://github.com/example/n8n-3way-sync",
      created_at: new Date().toISOString(),
      author_id: "u_002",
      author_handle: "masato_automate",
      author_name: "Masato | 自動化エンジニア",
      metrics: { retweets: 89, replies: 23, likes: 412, quotes: 15 },
      urls: ["https://github.com/example/n8n-3way-sync"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "n8n 自動化",
    },
    {
      id: "mock_003",
      text: "DifyでRAGシステムを構築してみた。社内ドキュメント2000ページをベクトル化して質問応答できるようにするまでの全工程をZennに書きました。https://zenn.dev/example/rag-dify",
      created_at: new Date().toISOString(),
      author_id: "u_003",
      author_handle: "rie_llmdev",
      author_name: "Rie | LLMエンジニア",
      metrics: { retweets: 67, replies: 18, likes: 321, quotes: 11 },
      urls: ["https://zenn.dev/example/rag-dify"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "RAG Dify",
    },
    {
      id: "mock_004",
      text: "Claude + Make.comで新規問い合わせを自動分類→担当者振り分けするフローを構築。SMB向けにテンプレ化したのでDMください。スクリーンショット貼ります。",
      created_at: new Date().toISOString(),
      author_id: "u_004",
      author_handle: "taro_nocode",
      author_name: "Taro | ノーコードビルダー",
      metrics: { retweets: 31, replies: 9, likes: 178, quotes: 6 },
      urls: [],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "Make.com Claude",
    },
    {
      id: "mock_005",
      text: "生成AIで業務改善してる会社の事例を100社まとめた。製造業・小売・金融・医療で何がどう変わったかを整理。noteに全文公開: https://note.com/example/ai-cases-100",
      created_at: new Date().toISOString(),
      author_id: "u_005",
      author_handle: "ai_cases_jp",
      author_name: "AI事例まとめ",
      metrics: { retweets: 134, replies: 41, likes: 678, quotes: 29 },
      urls: ["https://note.com/example/ai-cases-100"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "生成AI 業務改善",
    },
    {
      id: "mock_006",
      text: "Cursor + Claude Opus 4でコード書いてみたら、要件定義→設計→実装まで一気通貫でできた。特にMCP連携のところが秀逸。動画で解説してます: https://youtu.be/example2",
      created_at: new Date().toISOString(),
      author_id: "u_006",
      author_handle: "dev_watanabe",
      author_name: "Watanabe | フルスタックAI",
      metrics: { retweets: 52, replies: 14, likes: 289, quotes: 9 },
      urls: ["https://youtu.be/example2"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "Cursor Claude",
    },
    {
      id: "mock_007",
      text: "日本語向けプロンプトのコツをまとめた。敬語モード・箇条書き強制・出力形式固定の3パターンが特に効果的。Notionテンプレで配布: https://notion.so/example/jp-prompts",
      created_at: new Date().toISOString(),
      author_id: "u_007",
      author_handle: "prompt_sensei",
      author_name: "プロンプト先生",
      metrics: { retweets: 98, replies: 22, likes: 445, quotes: 18 },
      urls: ["https://notion.so/example/jp-prompts"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "プロンプト 日本語",
    },
    {
      id: "mock_008",
      text: "AIスタートアップ創業しました。日本の中小企業向けにAI導入支援を3ヶ月POCで提供します。資金調達なし、収益重視で走ります。詳細→ https://example-startup.jp",
      created_at: new Date().toISOString(),
      author_id: "u_008",
      author_handle: "ai_founder_jp",
      author_name: "Kenji | AI startup",
      metrics: { retweets: 23, replies: 31, likes: 156, quotes: 7 },
      urls: ["https://example-startup.jp"],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "AIスタートアップ",
    },
    {
      id: "mock_009",
      text: "AIツールをいっぱい使ったら稼げるよ！無料プレゼントあり、RTしてね！",
      created_at: new Date().toISOString(),
      author_id: "u_009",
      author_handle: "spam_account",
      author_name: "副業AIくん",
      metrics: { retweets: 5, replies: 2, likes: 12, quotes: 1 },
      urls: [],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "AIツール",
    },
    {
      id: "mock_010",
      text: "Zapier AIでメール→タスク自動生成のフローを試した。日本語メールでも精度が出るか検証。結果は微妙だったが改善策も考えた。スレッドで詳しく↓",
      created_at: new Date().toISOString(),
      author_id: "u_010",
      author_handle: "hina_ops",
      author_name: "Hina | オペレーション改善",
      metrics: { retweets: 14, replies: 8, likes: 67, quotes: 3 },
      urls: [],
      is_retweet: false,
      is_quote: false,
      source: "mock",
      source_query: "Zapier AI",
    },
  ];
}

// --- Real X API v2 search ---
async function fetchFromXApi(): Promise<RawPost[]> {
  if (!BEARER_TOKEN) {
    throw new Error("X_BEARER_TOKEN is not set. Copy .env.example to .env and add your token.");
  }

  const keywords = readJson<{ search_query_template: string }>("config/keywords.json");
  const query = keywords.search_query_template;

  const params = new URLSearchParams({
    query,
    max_results: "100",
    "tweet.fields": "created_at,author_id,public_metrics,entities,referenced_tweets",
    expansions: "author_id,referenced_tweets.id",
    "user.fields": "username,name",
  });

  const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    data?: Array<{
      id: string;
      text: string;
      created_at: string;
      author_id: string;
      public_metrics: { retweet_count: number; reply_count: number; like_count: number; quote_count: number };
      entities?: { urls?: Array<{ expanded_url: string }> };
      referenced_tweets?: Array<{ type: string }>;
    }>;
    includes?: { users?: Array<{ id: string; username: string; name: string }> };
  };

  const users = new Map((data.includes?.users ?? []).map((u) => [u.id, u]));

  return (data.data ?? []).map((t) => {
    const user = users.get(t.author_id);
    const refs = t.referenced_tweets ?? [];
    return {
      id: t.id,
      text: t.text,
      created_at: t.created_at,
      author_id: t.author_id,
      author_handle: user?.username,
      author_name: user?.name,
      metrics: {
        retweets: t.public_metrics.retweet_count,
        replies: t.public_metrics.reply_count,
        likes: t.public_metrics.like_count,
        quotes: t.public_metrics.quote_count,
      },
      urls: (t.entities?.urls ?? []).map((u) => u.expanded_url),
      is_retweet: refs.some((r) => r.type === "retweeted"),
      is_quote: refs.some((r) => r.type === "quoted"),
      source: "x_api" as const,
      source_query: query,
    };
  });
}

async function main() {
  const posts = MOCK_DATA ? generateMockPosts() : await fetchFromXApi();
  const outPath = join(ROOT, "data", "raw", `${today()}.json`);
  writeFileSync(outPath, JSON.stringify(posts, null, 2));
  console.log(`✓ Collected ${posts.length} posts → ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
