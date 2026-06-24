# /scan

Run the full x-monitor pipeline.

```bash
npm run pipeline
```

If no X API token is set, run in demo mode:

```bash
npm run demo
```

Then read the digest:

```bash
cat data/digests/$(date +%Y-%m-%d).md
```
