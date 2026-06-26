# /refresh — Pull fresh articles and regenerate the digest

Run the full x-monitor pipeline from the project root:

```bash
cd /Users/vedkamat/Documents/x-monitor && npm run pipeline
```

This runs (in order):
1. **collect** — Fetches Zenn RSS, Qiita API, and Note.com creator feeds → `data/raw/YYYY-MM-DD.json`
2. **score** — Filters and scores posts against `config/scoring-rubric.json` → `data/processed/YYYY-MM-DD.json`
3. **summarize** — Generates English summaries via Claude Haiku (skipped if `ANTHROPIC_API_KEY` not in `.env`)
4. **render digest** — Writes `data/digests/YYYY-MM-DD.md`
5. **render web** — Writes `web/public/data/latest.json`

After the pipeline finishes, commit and push the updated `latest.json` so Netlify redeploys automatically:

```bash
cd /Users/vedkamat/Documents/x-monitor && git add web/public/data/latest.json && git commit -m "chore: refresh digest $(date +%Y-%m-%d)" && git push
```
