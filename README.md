# Colorado Native Plant Finder

A quiz-based plant recommendation tool for Front Range and foothills gardeners in the Boulder/Loveland area (Zone 5b–6a). Answer 6 questions about your yard and get 5 tailored native plant recommendations powered by Claude AI.

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example and add your Anthropic API key
cp .env.example .env

# 3. Start both the Express server (port 3000) and Vite dev server (port 5173)
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` requests to the Express server on port 3000.

## Production Build

```bash
npm run build   # builds React into dist/
npm start       # serves everything on port 3000
```

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo in [vercel.com](https://vercel.com) → Add New Project.
3. Add `ANTHROPIC_API_KEY` as an environment variable in the Vercel project settings.
4. Deploy — Vercel runs `npm run build`, then serves everything through Express.

> The `vercel.json` uses `@vercel/node` to run Express as a serverless function and bundles the `dist/` static files alongside it.

## Stack

- **Frontend**: React 18 + Vite (no CSS framework — custom CSS with Colorado-themed design)
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude (`claude-opus-4-6`) via `@anthropic-ai/sdk`
- **Deployment**: Vercel

## Quiz Flow

1. Sun exposure
2. Soil type
3. Terrain
4. Planting goals *(multi-select)*
5. Irrigation preference
6. Special concerns — deer, fire zone, pet-safe, wind, etc. *(multi-select, optional)*

Each result includes: why it fits your specific yard, companion plants, fire safety rating (Low / Medium / High), bloom time, water needs, height, and links to local Front Range nurseries.
