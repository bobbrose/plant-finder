export const QUESTIONS = [
  {
    id: 'plantTypes',
    title: 'Plant Type',
    subtitle: 'What kind of plants are you looking for? Select all that apply.',
    type: 'checkbox',
    optional: true,
    icon: '🌳',
    options: [
      { value: 'Trees', label: 'Trees' },
      { value: 'Shrubs', label: 'Shrubs' },
      { value: 'Flowering Plants', label: 'Flowering Plants' },
      { value: 'Perennials', label: 'Perennials' },
      { value: 'Grasses', label: 'Grasses' },
      { value: 'Ground Cover', label: 'Ground Cover' },
    ],
  },
  {
    id: 'sunExposure',
    title: 'Sun Exposure',
    subtitle: 'How much direct sunlight does this planting area receive?',
    type: 'radio',
    icon: '☀️',
    options: [
      { value: 'Full sun (6+ hours of direct sunlight)', label: 'Full Sun', desc: '6+ hours of direct sunlight per day' },
      { value: 'Partial sun / part shade (3–6 hours)', label: 'Partial Sun / Shade', desc: '3–6 hours of direct sunlight' },
      { value: 'Full shade (less than 3 hours)', label: 'Full Shade', desc: 'Less than 3 hours of direct sunlight' },
    ],
  },
  {
    id: 'soilType',
    title: 'Soil Type',
    subtitle: 'What best describes your soil?',
    type: 'radio',
    icon: '🪨',
    options: [
      { value: 'Heavy clay', label: 'Heavy Clay', desc: 'Dense, slow-draining, low in nutrients' },
      { value: 'Sandy / gravelly', label: 'Sandy / Gravelly', desc: 'Fast-draining, low nutrients' },
      { value: 'Loamy / average garden soil', label: 'Loamy / Average', desc: 'Well-balanced with moderate drainage' },
      { value: 'Rocky / caliche', label: 'Rocky / Caliche', desc: 'Rocky substrate or a hard caliche layer below' },
    ],
  },
  {
    id: 'terrain',
    title: 'Terrain',
    subtitle: 'How would you describe the planting area?',
    type: 'radio',
    icon: '⛰️',
    options: [
      { value: 'Flat lawn or garden bed', label: 'Flat Lawn or Bed', desc: 'Level ground or traditional garden beds' },
      { value: 'Gentle slope', label: 'Gentle Slope', desc: 'Mild grade with moderate drainage' },
      { value: 'Steep hillside or bank', label: 'Steep Hillside', desc: 'Erosion-prone slope needing anchoring roots' },
      { value: 'Raised bed', label: 'Raised Bed', desc: 'Elevated planting area, often with amended soil' },
    ],
  },
  {
    id: 'goals',
    title: 'Planting Goals',
    subtitle: 'What do you want from these plants? Select all that apply.',
    type: 'checkbox',
    icon: '🎯',
    options: [
      { value: 'Attract pollinators and bees', label: 'Attract Pollinators & Bees' },
      { value: 'Wildlife habitat and birds', label: 'Wildlife Habitat & Birds' },
      { value: 'Erosion control', label: 'Erosion Control' },
      { value: 'Low maintenance and water-wise', label: 'Low Maintenance / Water-wise' },
      { value: 'Colorful blooms', label: 'Colorful Blooms' },
      { value: 'Privacy screening', label: 'Privacy Screening' },
      { value: 'Cut flowers', label: 'Cut Flowers' },
    ],
  },
  {
    id: 'irrigation',
    title: 'Irrigation Preference',
    subtitle: 'How much are you willing to water once plants are established?',
    type: 'radio',
    icon: '💧',
    options: [
      { value: 'Fully xeric — no irrigation once established', label: 'Fully Xeric', desc: 'No supplemental water after establishment' },
      { value: 'Occasional deep watering (once a month when dry)', label: 'Occasional', desc: 'Once a month during dry spells' },
      { value: 'Regular watering (once or twice a week)', label: 'Regular', desc: '1–2× per week supplemental water' },
    ],
  },
  {
    id: 'concerns',
    title: 'Special Concerns',
    subtitle: 'Any specific challenges or requirements? Select all that apply.',
    type: 'checkbox',
    optional: true,
    icon: '⚠️',
    options: [
      { value: 'Must be deer resistant', label: 'Deer Resistant' },
      { value: 'Located in wildfire / WUI zone', label: 'Wildfire / WUI Zone' },
      { value: 'Safe for pets and children (no toxic plants)', label: 'Pet & Kid Safe' },
      { value: 'Tolerates high winds', label: 'Wind Tolerant' },
      { value: 'Susceptible to late spring freezes', label: 'Late Spring Freeze Risk' },
      { value: 'Adjacent to areas with lawn chemical spray drift', label: 'Near Lawn Chemicals' },
      { value: 'Must be rabbit resistant', label: 'Rabbit Resistant' },
    ],
  },
]

export function getAnswerLabel(question, value) {
  if (question.type === 'radio') {
    return question.options.find((o) => o.value === value)?.label ?? value
  }
  if (!value || value.length === 0) return 'None'
  return value.map((v) => question.options.find((o) => o.value === v)?.label ?? v).join(', ')
}
