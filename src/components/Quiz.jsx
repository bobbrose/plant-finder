import { useState } from 'react'
import { QUESTIONS, getAnswerLabel } from '../questions.js'

export default function Quiz({ onSubmit }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    plantTypes: [],
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

  const hasSelection = question.type === 'radio' ? current !== '' : current.length > 0

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

  const previousSteps = QUESTIONS.slice(0, step)

  return (
    <div className="quiz">
      {previousSteps.length > 0 && (
        <div className="quiz-history">
          {previousSteps.map((q) => (
            <div key={q.id} className="history-item">
              <span className="history-icon">{q.icon}</span>
              <span className="history-label">{q.title}:</span>
              <span className="history-value">{
                (() => { const val = answers[q.id]; return (Array.isArray(val) ? val.length > 0 : val !== '') ? getAnswerLabel(q, val) : 'No preference'})()
              }</span>
            </div>
          ))}
        </div>
      )}
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
            >
              {hasSelection ? 'Pick My Plants 🌱' : 'Skip & Pick 🌱'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
            >
              {hasSelection ? 'Next →' : 'Skip →'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
