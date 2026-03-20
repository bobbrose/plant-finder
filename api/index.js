import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { rateLimit } from 'express-rate-limit'
import { getRandomMockPlants } from '../mockPlants.js'

const app = express()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.set('trust proxy', 1)
app.use(express.json())

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
    // 405 = HEAD not allowed but site is up; treat as reachable
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
    // Only filter if at least one passed — don't leave the list empty if all fail
    if (valid.length > 0) plant.localNurseries = valid
  }))
}

const CACHE_MAX = 500
const cache = new Map()

function cacheGet(key) {
  if (!cache.has(key)) return null
  // Move to end (most recently used)
  const value = cache.get(key)
  cache.delete(key)
  cache.set(key, value)
  return value
}

function cacheSet(key, value) {
  if (cache.has(key)) cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_MAX) {
    // Evict least recently used (first entry)
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

const locationCache = new Map()
const LOCATION_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const LOCATION_CACHE_MAX = 1000

function locationCacheGet(ip) {
  const entry = locationCache.get(ip)
  if (!entry) return null
  if (Date.now() - entry.ts > LOCATION_CACHE_TTL) {
    locationCache.delete(ip)
    return null
  }
  return entry.result
}

function locationCacheSet(ip, result) {
  locationCache.set(ip, { result, ts: Date.now() })
  if (locationCache.size > LOCATION_CACHE_MAX) {
    locationCache.delete(locationCache.keys().next().value)
  }
}

async function fetchLocation(ip) {
  const isLocal = !ip || ip === '::1' || ip === '127.0.0.1'

  // Primary: freeipapi.com
  try {
    const url = isLocal ? 'https://freeipapi.com/api/json' : `https://freeipapi.com/api/json/${ip}`
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (r.ok) {
      const data = await r.json()
      if (data.cityName && data.cityName !== '-') {
        return { city: data.cityName, region: data.regionName, country: data.countryName, zip: data.zipCode }
      }
    }
  } catch { /* fall through to fallback */ }

  // Fallback: ip-api.com
  try {
    const url = isLocal ? 'https://ip-api.com/json' : `https://ip-api.com/json/${ip}`
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (r.ok) {
      const data = await r.json()
      if (data.status === 'success' && data.city) {
        return { city: data.city, region: data.regionName, country: data.country, zip: data.zip }
      }
    }
  } catch { /* fall through */ }

  return null
}

app.get('/api/location', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()

  const cached = locationCacheGet(ip)
  if (cached) return res.json({ ...cached, cached: true })

  try {
    const result = await fetchLocation(ip)
    if (result) {
      locationCacheSet(ip, result)
      return res.json(result)
    }
  } catch { /* fall through */ }

  res.json({})
})

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

const plantsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
})

app.post('/api/plants', plantsRateLimit, async (req, res) => {
  const { plantTypes, sunExposure, soilType, terrain, goals, irrigation, concerns, location } = req.body


  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200))
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
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    rawText = message.content[0].text.trim()
    // Strip markdown code fences if Claude included them
    let text = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    // Extract the JSON array in case there's surrounding text
    const arrayStart = text.indexOf('[')
    const arrayEnd = text.lastIndexOf(']')
    if (arrayStart !== -1 && arrayEnd !== -1) {
      text = text.slice(arrayStart, arrayEnd + 1)
    }
    const plants = JSON.parse(text)

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

export default app
