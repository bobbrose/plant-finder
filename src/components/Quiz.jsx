import { useState } from 'react'

const QUESTIONS = [
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
      { value: 'Heavy clay (typical Front Range soil)', label: 'Heavy Clay', desc: 'Dense, slow-draining — very common on the Front Range' },
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
      { value: 'Ground cover', label: 'Ground Cover' },
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
    ],
  },
]

export default function Quiz({ onSubmit }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    sunExposure: '',
    soilType: '',
    terrain: '',
    goals: [],
    irrigation: '',
    concerns: [],
  })

  const question = QUESTIONS[step]
  const isLast = step === QUESTIONS.length - 1
  const progress = ((step + 1) / QUESTIONS.length) * 100
  const current = answers[question.id]

  const isAnswered = question.optional
    ? true
    : question.type === 'radio'
      ? current !== ''
      : current.length > 0

  const handleRadio = (value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  const handleCheckbox = (value) => {
    setAnswers((prev) => {
      const existing = prev[question.id]
      return {
        ...prev,
        [question.id]: existing.includes(value)
          ? existing.filter((v) => v !== value)
          : [...existing, value],
      }
    })
  }

  return (
    <div className="quiz">
      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">
          {step + 1} / {QUESTIONS.length}
        </span>
      </div>

      <div className="quiz-card">
        <div className="question-header">
          <span className="question-icon">{question.icon}</span>
          <div>
            <h2 className="question-title">{question.title}</h2>
            <p className="question-subtitle">{question.subtitle}</p>
          </div>
        </div>

        <div className="options-grid">
          {question.options.map((opt) => {
            const selected =
              question.type === 'radio'
                ? current === opt.value
                : current.includes(opt.value)

            return (
              <button
                key={opt.value}
                className={`option-btn${selected ? ' selected' : ''}`}
                onClick={() =>
                  question.type === 'radio'
                    ? handleRadio(opt.value)
                    : handleCheckbox(opt.value)
                }
              >
                <span className="option-check">{selected ? '✓' : ''}</span>
                <div className="option-text">
                  <span className="option-label">{opt.label}</span>
                  {opt.desc && <span className="option-desc">{opt.desc}</span>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="quiz-nav">
          <button
            className="btn btn-secondary"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            ← Back
          </button>

          {isLast ? (
            <button
              className="btn btn-primary"
              onClick={() => onSubmit(answers)}
              disabled={!isAnswered}
            >
              Find My Plants 🌱
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!isAnswered}
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {question.optional && (
        <p className="optional-note">This step is optional — click "Find My Plants" to skip</p>
      )}
    </div>
  )
}
