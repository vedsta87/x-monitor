# x-monitor

Japanese AI tool discovery via scheduled X post monitoring. Runs as a Claude Code cloud routine, produces a bilingual markdown digest, and posts to Notion.

## Quickstart

```bash
npm install
cp .env.example .env   # add your API keys
npm run demo           # test with mock data (no keys needed)
npm run pipeline       # real run
```

## API keys needed

| Key | Where | Purpose |
|-----|-------|---------|
| `X_BEARER_TOKEN` | [developer.twitter.com](https://developer.twitter.com) | Fetch posts |
| `NOTION_API_KEY` | [notion.so/my-integrations](https://notion.so/my-integrations) | Post digest |
| `NOTION_DATABASE_ID` | Your Notion page/DB URL | Where to post |

See `docs/x-api-setup.md` for step-by-step X API setup.

## Architecture

```
X API → collect_posts.ts → data/raw/
                         → score_posts.ts → data/processed/
                                          → render_digest.ts → data/digests/
                                                             → sync_to_notion.ts → Notion
```

## Claude routine

Copy `prompts/routine-prompt.md` into a Claude Code scheduled routine. See `docs/architecture.md`.
