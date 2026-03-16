import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Anthropic from '@anthropic-ai/sdk'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))

const NURSERIES = `- Harlequin's Gardens (Boulder): https://harlequinsgardens.com
- Fossil Creek Nursery (Fort Collins): https://fossilcreeknursery.com
- High Plains Environmental Center (Loveland): https://www.hpec.org
- Tagawa Gardens (Centennial): https://tagawagardens.com
- Echter's Nursery & Garden Center (Arvada): https://www.echters.com
- Bath Garden Center & Nursery (Fort Collins): https://www.bathgardencenter.com
- O'Toole's Garden Centers (Denver Metro): https://www.otooles.com`

app.post('/api/plants', async (req, res) => {
  const { sunExposure, soilType, terrain, goals, irrigation, concerns } = req.body

  if (!sunExposure || !soilType || !terrain || !Array.isArray(goals) || goals.length === 0 || !irrigation) {
    return res.status(400).json({ error: 'Please answer all required quiz questions.' })
  }

  const prompt = `You are a Colorado native plant expert for the Front Range and foothills (Boulder/Loveland/Fort Collins area, USDA Hardiness Zone 5b-6a).

A gardener described their yard:
- Sun exposure: ${sunExposure}
- Soil type: ${soilType}
- Terrain: ${terrain}
- Planting goals: ${goals.join(', ')}
- Irrigation preference: ${irrigation}
- Special concerns: ${concerns && concerns.length > 0 ? concerns.join(', ') : 'None specified'}

Recommend exactly 5 Colorado native plants perfectly suited to these conditions. Prioritize plants truly native to Colorado that thrive in Zone 5b-6a.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation before or after:
[
  {
    "commonName": "string",
    "scientificName": "string",
    "whyItFits": "2-3 sentences explaining why this specific plant matches their exact yard conditions",
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

For localNurseries, pick 2-3 from this list that would most likely stock this specific plant:
${NURSERIES}`

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
  console.log(`Colorado Native Plant Finder running at http://localhost:${PORT}`)
})

export default app
