export const MOCK_PLANTS = [
  {
    commonName: 'Blue Grama Grass',
    scientificName: 'Bouteloua gracilis',
    whyItFits: 'Blue Grama is the quintessential Front Range native grass, perfectly adapted to heavy clay soils and the boom-and-bust moisture cycles of the Boulder/Loveland area. Its deep root system stabilizes slopes while requiring virtually no supplemental irrigation once established, making it ideal for xeric landscapes.',
    companionPlants: ['Rocky Mountain Penstemon', 'Prairie Smoke', 'Pasque Flower'],
    fireSafetyRating: 'Low',
    fireSafetyNote: 'Short stature and high moisture content make it one of the most fire-resistant grasses for WUI zones.',
    waterNeeds: 'Very low — drought tolerant once established',
    sunExposure: 'Full sun',
    bloomTime: 'July – August (distinctive eyelash-shaped seed heads)',
    height: '6–12 inches',
    localNurseries: [
      { name: "Harlequin's Gardens (Boulder)", url: 'https://harlequinsgardens.com' },
      { name: 'Fossil Creek Nursery (Fort Collins)', url: 'https://fossilcreeknursery.com' },
    ],
  },
  {
    commonName: 'Rocky Mountain Penstemon',
    scientificName: 'Penstemon strictus',
    whyItFits: 'One of the most reliable bloomers on the Front Range, Rocky Mountain Penstemon thrives in the rocky, clay-heavy soils typical of the Boulder foothills. Its vivid blue-purple spikes draw hummingbirds and native bees from June through July, and it requires almost no care once established in a sunny spot.',
    companionPlants: ['Blue Grama Grass', 'Golden Banner', 'Prairie Zinnia'],
    fireSafetyRating: 'Low',
    fireSafetyNote: 'Low-growing herbaceous perennial with minimal dry fuel accumulation — well-suited for planting near structures in fire zones.',
    waterNeeds: 'Low — occasional deep watering in prolonged dry spells',
    sunExposure: 'Full sun to partial shade',
    bloomTime: 'June – July',
    height: '18–24 inches',
    localNurseries: [
      { name: "Harlequin's Gardens (Boulder)", url: 'https://harlequinsgardens.com' },
      { name: "Bath Garden Center (Fort Collins)", url: 'https://www.bathgardencenter.com' },
    ],
  },
  {
    commonName: 'Prairie Smoke',
    scientificName: 'Geum triflorum',
    whyItFits: 'Prairie Smoke is a stunning early-season native that excels in the poor, rocky soils of the Front Range foothills. Its feathery pink seed plumes — the source of its name — provide months of visual interest after the spring blooms fade. Extremely cold-hardy through Zone 5 winters and unfazed by late-season snow.',
    companionPlants: ['Pasque Flower', 'Blue Grama Grass', 'Rocky Mountain Penstemon'],
    fireSafetyRating: 'Low',
    fireSafetyNote: 'Low-growing ground-level perennial; stays green and close to the soil, posing minimal fire risk.',
    waterNeeds: 'Very low — fully xeric once established',
    sunExposure: 'Full sun to partial shade',
    bloomTime: 'April – June (seed plumes persist through summer)',
    height: '6–16 inches',
    localNurseries: [
      { name: 'High Plains Environmental Center (Loveland)', url: 'https://www.hpec.org' },
      { name: "Harlequin's Gardens (Boulder)", url: 'https://harlequinsgardens.com' },
    ],
  },
  {
    commonName: 'Golden Banner',
    scientificName: 'Thermopsis divaricarpa',
    whyItFits: 'Golden Banner is a tough, deep-rooted native legume that fixes nitrogen in poor clay soils — common throughout the Boulder and Loveland area. Its bright yellow flower spikes in May and June provide early-season color while its spreading root system makes it excellent for erosion control on slopes.',
    companionPlants: ['Rocky Mountain Penstemon', 'Blue Grama Grass', 'Sulfur Buckwheat'],
    fireSafetyRating: 'Medium',
    fireSafetyNote: 'Moderate fuel load when dry in late summer; space plantings away from structures and maintain a defensible zone.',
    waterNeeds: 'Low — established plants need no supplemental water',
    sunExposure: 'Full sun',
    bloomTime: 'May – June',
    height: '2–3 feet',
    localNurseries: [
      { name: 'Fossil Creek Nursery (Fort Collins)', url: 'https://fossilcreeknursery.com' },
      { name: "Echter's Nursery & Garden Center (Arvada)", url: 'https://www.echters.com' },
    ],
  },
  {
    commonName: 'Pasque Flower',
    scientificName: 'Pulsatilla patens',
    whyItFits: 'Pasque Flower is one of the first wildflowers to bloom on the Colorado Front Range, often pushing through snow in March. Its silky purple blooms and feathery seed heads are iconic in the foothills, and it thrives in the well-drained, gravelly soils found on slopes above Boulder and Loveland. Naturally deer resistant due to its mild toxicity.',
    companionPlants: ['Prairie Smoke', 'Blue Grama Grass', 'Rocky Mountain Iris'],
    fireSafetyRating: 'Low',
    fireSafetyNote: 'Small herbaceous perennial that dies back cleanly — minimal dry fuel and excellent for fire-conscious landscapes.',
    waterNeeds: 'Very low — requires excellent drainage, no summer water',
    sunExposure: 'Full sun to light shade',
    bloomTime: 'March – May (seed plumes through June)',
    height: '6–10 inches',
    localNurseries: [
      { name: 'High Plains Environmental Center (Loveland)', url: 'https://www.hpec.org' },
      { name: "Harlequin's Gardens (Boulder)", url: 'https://harlequinsgardens.com' },
    ],
  },
]

export function getRandomMockPlants(count = 3) {
  const shuffled = [...MOCK_PLANTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
