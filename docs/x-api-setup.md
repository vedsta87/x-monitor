# X API Setup Guide

## Step 1 — Create a developer account

1. Go to https://developer.twitter.com/en/portal/petition/essential/basic-info
2. Sign in with your X account.
3. Fill out the use-case form. Use something like: "I'm building a personal tool to monitor Japanese-language posts about AI tools for research and content curation purposes."
4. Accept the terms.

## Step 2 — Create a project and app

1. In the Developer Portal, click **Add Project**.
2. Name it `x-monitor`.
3. Select **Read** permissions only (we don't post).
4. Click through to create the app.

## Step 3 — Get your Bearer Token

1. In your app, go to **Keys and Tokens**.
2. Under **Bearer Token**, click **Generate**.
3. Copy it — you won't see it again.

## Step 4 — Add to .env

```bash
cp .env.example .env
# Edit .env and paste:
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxx...
```

## Step 5 — Test

```bash
npm run collect
cat data/raw/$(date +%Y-%m-%d).json | head -50
```

## Tier guidance

| Tier | Monthly cost | Posts/month | Right for |
|------|-------------|-------------|-----------|
| Free | $0 | 1,500 read | Weekly digest, fine |
| Basic | $100/mo | 10,000 read | Daily runs |

For weekly runs, Free tier is enough.

## Search limits

- Recent search covers the last 7 days only.
- Max 100 results per request.
- Query operators: `-is:retweet`, `-is:reply`, `lang:ja` are all supported on Free tier.
