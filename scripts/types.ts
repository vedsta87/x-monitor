export interface RawPost {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author_handle?: string;
  author_name?: string;
  metrics: {
    retweets: number;
    replies: number;
    likes: number;
    quotes: number;
  };
  urls: string[];
  is_retweet: boolean;
  is_quote: boolean;
  source: "x_api" | "mock";
  source_query?: string;
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
  tags: string[];
  passed_filter: boolean;
  filter_reason?: string;
}
