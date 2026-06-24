# Architecture

## Pipeline

```
X API recent search
      ↓
collect_posts.ts  →  data/raw/YYYY-MM-DD.json
      ↓
score_posts.ts    →  data/processed/YYYY-MM-DD.json
      ↓
render_digest.ts  →  data/digests/YYYY-MM-DD.md
      ↓
sync_to_notion.ts →  Notion page
```

## Scoring

Each post is scored 0–5 on five dimensions (max 25):

| Dimension | What it measures |
|-----------|-----------------|
| novelty | New tool/release signals |
| practicality | Can a builder use this this week? |
| evidence | Links to demo, repo, screenshot |
| relevance | AI/automation/no-code topic match |
| japan_fit | Japanese-market relevance |

Threshold: **14/25** to appear in digest.

## Cloud routine

Set up in Claude Code via `/schedule`. Runs weekly (or more often as needed). Needs three secrets:
- `X_BEARER_TOKEN`
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`

## Mock mode

Set `MOCK_DATA=true` or run `npm run demo` to test the full pipeline without API credentials. Uses 10 realistic sample posts.
