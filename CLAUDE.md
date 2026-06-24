# x-monitor

Purpose: Monitor Japanese X posts about AI tools, automations, agent workflows, no-code builds, and practical product launches. Produce a concise bilingual digest for a solo PM/builder running Seranova KK.

## Operating rules

- Prefer signal over volume.
- Focus on practical, real tools with evidence (links, demos, repos, screenshots).
- Avoid hype, reposts, and duplicate content.
- Always preserve source links exactly.
- Keep summaries concise and bilingual when possible.
- Write outputs to data/digests/ in markdown.
- Never invent details not present in the source post.

## Repo map

- `config/` — keywords.json, accounts.json, exclusions.json, scoring-rubric.json
- `scripts/` — collect_posts.ts → score_posts.ts → render_digest.ts → sync_to_notion.ts
- `scripts/run_all.ts` — full pipeline orchestrator
- `data/raw/` — raw post captures (YYYY-MM-DD.json)
- `data/processed/` — cleaned and ranked results (YYYY-MM-DD.json)
- `data/digests/` — final markdown reports (YYYY-MM-DD.md)
- `prompts/` — versioned routine prompt
- `docs/` — architecture, watchlist, X API setup guide

## Running the pipeline

```bash
# Demo mode (no API keys needed)
npm run demo

# Real mode (requires X_BEARER_TOKEN in .env)
npm run pipeline

# Individual steps
npm run collect   # X API → data/raw/
npm run score     # data/raw/ → data/processed/
npm run render    # data/processed/ → data/digests/
npm run sync      # data/digests/ → Notion
```

## Output rules

- One digest per run, saved to data/digests/YYYY-MM-DD.md.
- Rank top 5–10 items only.
- Each item: English summary, Japanese summary, why it matters, link, score.
- If nothing good is found, say so and suggest next keywords + 3 watchlist accounts.

## Quality rules

- Deduplicate by tweet ID.
- Prefer posts with demos, screenshots, repos, or product links.
- Treat reposts and quote-post noise as low priority.
- Score threshold: 14/25 minimum to appear in digest.

## See also

- `docs/architecture.md` — full pipeline design
- `docs/x-api-setup.md` — getting X API credentials
- `prompts/routine-prompt.md` — cloud routine prompt (copy this into Claude schedule)
