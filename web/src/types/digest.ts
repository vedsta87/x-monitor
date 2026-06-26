export type Platform = "zenn" | "qiita" | "note" | "mock";

export interface PostScores {
  novelty: number;
  practicality: number;
  evidence: number;
  relevance: number;
  japan_fit: number;
  total: number;
}

export interface WebPost {
  id: string;
  rank: number;
  platform: Platform;
  platform_label: string;
  platform_color: string;
  title: string;
  text: string;
  created_at: string;
  author_handle: string;
  author_name: string;
  article_url: string;
  source_url?: string;
  metrics: { likes: number; comments?: number };
  scores: PostScores;
  category: string;
  inferred_tags: string[];
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
