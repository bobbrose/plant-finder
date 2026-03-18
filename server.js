import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { getRandomMockPlants } from './mockPlants.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))


const MOCK_MODE = process.env.MOCK_API === 'true'
if (MOCK_MODE) console.log('⚠️  MOCK_API mode enabled — Claude API will not be called')

async function isUrlReachable(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PlantPicker/1.0' },
    })
    clearTimeout(timeout)
    return res.ok || res.status === 405
  } catch {
    return false
  }
}

async function validateNurseries(plants) {
  await Promise.all(plants.map(async (plant) => {
    if (!plant.localNurseries?.length) return
    const results = await Promise.all(
      plant.localNurseries.map(async (n) => ({ ...n, ok: await isUrlReachable(n.url) }))
    )
    const valid = results.filter((n) => n.ok).map(({ ok, ...n }) => n)
    if (valid.length > 0) plant.localNurseries = valid
  }))
}

const CACHE_MAX = 500
const cache = new Map()

function cacheGet(key) {
  if (!cache.has(key)) return null
  const value = cache.get(key)
  cache.delete(key)
  cache.set(key, value)
  return value
}

function cacheSet(key, value) {
  if (cache.has(key)) cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_MAX) {
    cache.delete(cache.keys().next().value)
  }
}

function cacheKey({ plantTypes, sunExposure, soilType, terrain, goals, irrigation, concerns, location }) {
  return JSON.stringify({
    plantTypes: [...(plantTypes ?? [])].sort(),
    sunExposure,
    soilType,
    terrain,
    goals: [...(goals ?? [])].sort(),
    irrigation,
    concerns: [...(concerns ?? [])].sort(),
    location: location?.freeText ?? location?.zip ?? (location?.city && location?.region ? `${location.city},${location.region}` : null),
  })
}

app.get('/api/health', async (_req, res) => {
  if (MOCK_MODE) return res.json({ ok: true, mock: true })

  console.log('Health check — ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY)
  try {
    await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    })
    res.json({ ok: true })
  } catch (err) {
    console.error('Health check error:', err.status, err.message)
    const message = err.status === 401
      ? 'API key is missing or invalid.'
      : `Could not reach the Anthropic API. (${err.status ?? err.code ?? err.message})`
    res.status(503).json({ ok: false, error: message })
  }
})

app.post('/api/plants', async (req, res) => {
  const { plantTypes, sunExposure, soilType, terrain, goals, irrigation, concerns, location } = req.body


  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200)) // simulate API delay
    return res.json({ plants: getRandomMockPlants(3), mock: true })
  }

  let locationStr = 'an unspecified location'
  if (location) {
    if (location.freeText) {
      locationStr = location.freeText
    } else if (location.city && location.region) {
      locationStr = `${location.city}, ${location.region}${location.country && location.country !== 'United States' ? `, ${location.country}` : ''}`
    } else if (location.zip) {
      locationStr = `the area around ZIP code ${location.zip}`
    }
  }

  const prompt = `You are an expert horticulturalist helping a gardener in ${locationStr}.

A gardener described their yard:
- Desired plant types: ${plantTypes && plantTypes.length > 0 ? plantTypes.join(', ') : 'No preference'}
- Sun exposure: ${sunExposure || 'Any'}
- Soil type: ${soilType || 'Any'}
- Terrain: ${terrain || 'Any'}
- Planting goals: ${goals && goals.length > 0 ? goals.join(', ') : 'No preference'}
- Irrigation preference: ${irrigation || 'Any'}
- Special concerns: ${concerns && concerns.length > 0 ? concerns.join(', ') : 'None specified'}

${concerns && concerns.includes('Located in wildfire / WUI zone') ? 'IMPORTANT: The gardener is in a wildfire/WUI zone. Do NOT recommend any plants with a High or Medium fire safety rating. Only recommend plants rated Low fire risk.\n\n' : ''}Recommend exactly 5 plants perfectly suited to the local climate of ${locationStr} and these yard conditions. Consider the regional hardiness zone, typical rainfall patterns, and locally available species. Favor native species, but don't exclude non-native ones as well.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation before or after:
[
  {
    "commonName": "string",
    "scientificName": "string",
    "whyItFits": "2-3 sentences explaining why this specific plant matches their exact yard conditions and local climate",
    "companionPlants": ["Name 1", "Name 2", "Name 3"],
    "fireSafetyRating": "Low",
    "fireSafetyNote": "One sentence about fire safety characteristics",
    "waterNeeds": "string",
    "sunExposure": "string",
    "bloomTime": "string",
    "height": "string",
    "localNurseries": [{"name": "nursery name", "url": "https://..."}]
  }
]

fireSafetyRating must be exactly one of: "Low" (fire-resistant, good for WUI zones), "Medium" (moderate risk), or "High" (higher fuel load, avoid near structures in fire zones).

For localNurseries, suggest 5-7 real nurseries within 10 miles of ${locationStr} that might stock this specific plant. Only include nurseries you are confident are still open and operating. Include real URLs — try to deep link directly to the plant's page on the nursery website if you know it, otherwise use the nursery homepage. If you are not confident about specific nurseries in the area, use an empty array rather than guessing.`

  if (process.env.VITE_DEBUG === 'true') {
    console.log('[DEBUG] AI prompt:\n' + prompt)
  }

  const key = cacheKey(req.body)
  console.log(`Cache size: ${cache.size} | Key: ${key}`)
  const cached = cacheGet(key)
  if (cached) {
    console.log(`Cache HIT — returning cached result (cache size: ${cache.size})`)
    return res.json({ plants: cached, cached: true })
  }
  console.log('Cache MISS — calling Claude API')

  let rawText
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    rawText = message.content[0].text.trim()
    const plants = JSON.parse(rawText)

    if (!Array.isArray(plants) || plants.length === 0) {
      throw new Error('Invalid response format')
    }

    await validateNurseries(plants)
    cacheSet(key, plants)
    console.log(`Cache SET — cache size now: ${cache.size}`)
    res.json({ plants })
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('Plant recommendations: JSON parse error:', err.message)
      console.error('Raw Claude response was:', rawText)
      res.status(500).json({ error: 'Received an unexpected response format. Please try again.' })
    } else if (err.status === 401) {
      console.error('Plant recommendations: API auth error (401):', err.message)
      res.status(500).json({ error: 'API key is invalid. Please check server configuration.' })
    } else {
      console.error('Plant recommendations: unexpected error:', err.status ?? '', err.message)
      console.error(err.stack)
      res.status(500).json({ error: 'Failed to get plant recommendations. Please try again.' })
    }
  }
})

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Plant Picker running at http://localhost:${PORT}`)
})

export default app
