export type Platform = "zenn" | "qiita" | "note" | "mock";

export interface RawPost {
  id: string;
  platform: Platform;
  title: string;
  text: string; // excerpt / body preview
  created_at: string;
  author_id: string;
  author_handle?: string;
  author_name?: string;
  article_url: string;
  source_url?: string; // external link (GitHub, demo, etc.) if found in body
  metrics: {
    likes: number;
    comments?: number;
    views?: number;
  };
  tags: string[];
  // AI-generated fields (populated by summarize step or mock data)
  english_summary?: string;
  japanese_summary?: string;
  why_it_matters?: string;
}

export interface ScoredPost extends RawPost {
  scores: {
    novelty: number;
    practicality: number;
    evidence: number;
    relevance: number;
    japan_fit: number;
    total: number;
  };
  category: "new_tool" | "workflow_demo" | "prompt_template" | "founder_announcement" | "experiment" | "other";
  inferred_tags: string[];
  passed_filter: boolean;
  filter_reason?: string;
  rank?: number;
}

export interface WebPost extends ScoredPost {
  rank: number;
  platform_label: string;
  platform_color: string;
  english_summary: string;
  japanese_summary: string;
  why_it_matters: string;
}

export interface WebDigest {
  date: string;
  generated_at: string;
  is_mock: boolean;
  sources: Platform[];
  total_scanned: number;
  passed_filter: number;
  posts: WebPost[];
}
