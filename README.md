# Plant Picker

A quiz-based plant recommendation tool. Answer 7 questions about your yard and get 5 tailored plant recommendations powered by Claude AI. Your location is detected automatically from your IP, or you can enter a city/state or ZIP code — recommendations are specific to your local climate and region.

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

## Mock API Mode

To develop without consuming Anthropic API credits, set `MOCK_API=true` in your `.env`:

```
MOCK_API=true
```

The server will return sample plant data from `mockPlants.js` instead of calling Claude. The health check will also pass immediately without validating the API key.

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

> `vercel.json` routes all `/api/*` requests to `api/index.js` (a standalone Express serverless function). Static assets are served directly from `dist/` by Vercel's CDN.

## Stack

- **Frontend**: React 18 + Vite (no CSS framework — custom CSS)
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude (`claude-opus-4-6`) via `@anthropic-ai/sdk`
- **Deployment**: Vercel

## Quiz Flow

All questions are optional — skipped questions default to "no preference".

1. Plant type — trees, shrubs, flowering plants, perennials, grasses, ground cover *(multi-select, optional)*
2. Sun exposure
3. Soil type
4. Terrain
5. Planting goals *(multi-select)*
6. Irrigation preference
7. Special concerns — deer, fire zone, pet-safe, wind, allergens, etc. *(multi-select, optional)*

Each result includes: why it fits your specific yard, companion plants, fire safety rating (Low / Medium / High), bloom time, water needs, height, and links to local nurseries.
