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
  const { sunExposure, soilType, terrain, goals, irrigation, concerns, location } = req.body

  if (!sunExposure || !soilType || !terrain || !Array.isArray(goals) || goals.length === 0 || !irrigation) {
    return res.status(400).json({ error: 'Please answer all required quiz questions.' })
  }

  if (MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 1200)) // simulate API delay
    return res.json({ plants: getRandomMockPlants(3), mock: true })
  }

  let locationStr = 'an unspecified location'
  if (location) {
    if (location.city && location.region) {
      locationStr = `${location.city}, ${location.region}${location.country && location.country !== 'United States' ? `, ${location.country}` : ''}`
    } else if (location.zip) {
      locationStr = `the area around ZIP code ${location.zip}`
    }
  }

  const prompt = `You are an expert horticulturalist helping a gardener in ${locationStr}.

A gardener described their yard:
- Sun exposure: ${sunExposure}
- Soil type: ${soilType}
- Terrain: ${terrain}
- Planting goals: ${goals.join(', ')}
- Irrigation preference: ${irrigation}
- Special concerns: ${concerns && concerns.length > 0 ? concerns.join(', ') : 'None specified'}

Recommend exactly 5 plants perfectly suited to the local climate of ${locationStr} and these yard conditions. Consider the regional hardiness zone, typical rainfall patterns, and locally available species.

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

For localNurseries, suggest 2-3 real nurseries near ${locationStr} that would likely stock this specific plant. Include real URLs if you know them. If you are not confident about specific nurseries in the area, use an empty array.`

  if (process.env.VITE_DEBUG === 'true') {
    console.log('[DEBUG] AI prompt:\n' + prompt)
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].text.trim()
    const plants = JSON.parse(text)

    if (!Array.isArray(plants) || plants.length === 0) {
      throw new Error('Invalid response format')
    }

    res.json({ plants })
  } catch (err) {
    console.error('Error getting plant recommendations:', err.message)
    if (err instanceof SyntaxError) {
      res.status(500).json({ error: 'Received an unexpected response format. Please try again.' })
    } else if (err.status === 401) {
      res.status(500).json({ error: 'API key is invalid. Please check server configuration.' })
    } else {
      res.status(500).json({ error: 'Failed to get plant recommendations. Please try again.' })
    }
  }
})

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Plant Finder running at http://localhost:${PORT}`)
})

export default app
