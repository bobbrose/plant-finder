# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install --cache /tmp/npm-cache-temp   # install (npm cache has root-ownership issues on this machine)
npm run dev       # Vite dev server (port 5173) + Express (port 3000) concurrently
npm run build     # Vite production build → dist/
npm start         # Express only on port 3000 (serves dist/)
```

Requires a `.env` file with `ANTHROPIC_API_KEY` — copy from `.env.example`.

## Architecture

Single repo, two processes in development:

- **`server.js`** — Express server for local dev. Serves `dist/` as static files and exposes all `/api/*` routes. Calls `claude-opus-4-6` via `@anthropic-ai/sdk`.
- **`api/index.js`** — Identical API logic as a standalone Express app for Vercel serverless. No `app.listen` or static serving.
- **`src/`** — React/Vite frontend. Vite proxies `/api` to Express on port 3000 during dev. In production, Vercel serves `dist/` from CDN and routes `/api/*` to `api/index.js`.

### API endpoints

- `GET /api/health` — validates Anthropic API key
- `GET /api/location` — proxies IP geolocation via `freeipapi.com` (avoids browser CORS issues); returns `{ city, region, country, zip }`
- `POST /api/plants` — builds a Claude prompt from quiz answers + location, returns JSON array of 5 plants

### Data flow

Quiz answers (`plantTypes[]`, `sunExposure`, `soilType`, `terrain`, `goals[]`, `irrigation`, `concerns[]`) → `POST /api/plants` → Claude prompt → JSON array of 5 plants → `Results` → `PlantCard` × 5.

Each plant object: `commonName`, `scientificName`, `whyItFits`, `companionPlants[]`, `fireSafetyRating` (Low/Medium/High), `fireSafetyNote`, `waterNeeds`, `sunExposure`, `bloomTime`, `height`, `localNurseries[{name, url}]`.

All quiz questions are optional; unanswered questions default to "Any" in the prompt.

## Vercel Deployment

`vercel.json` routes `/api/*` to `api/index.js` and serves `dist/` as static output. Vercel runs `npm run build` before deploying.

Set `ANTHROPIC_API_KEY` in Vercel project → Settings → Environment Variables.
