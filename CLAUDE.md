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

- **`server.js`** — Express server. Serves `dist/` as static files and exposes `POST /api/plants`. Builds a prompt from quiz answers and calls `claude-opus-4-6` via `@anthropic-ai/sdk`. Expects Claude to return a raw JSON array (no markdown fences).
- **`src/`** — React/Vite frontend. Vite proxies `/api` to Express on port 3000 during dev. In production, Express serves the Vite build and handles the API from the same port.

### Data flow

Quiz answers (`sunExposure`, `soilType`, `terrain`, `goals[]`, `irrigation`, `concerns[]`) → `POST /api/plants` → Claude prompt → JSON array of 5 plants → `Results` → `PlantCard` × 5.

Each plant object: `commonName`, `scientificName`, `whyItFits`, `companionPlants[]`, `fireSafetyRating` (Low/Medium/High), `fireSafetyNote`, `waterNeeds`, `sunExposure`, `bloomTime`, `height`, `localNurseries[{name, url}]`.

## Vercel Deployment

`vercel.json` uses `@vercel/node` to run Express as a serverless function with `"includeFiles": ["dist/**"]` so the Vite build output is bundled alongside. All routes route to `server.js`. Vercel runs `npm run build` before deploying.

Set `ANTHROPIC_API_KEY` in Vercel project → Settings → Environment Variables.
