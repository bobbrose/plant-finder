import PlantCard from './PlantCard.jsx'
import { QUESTIONS, getAnswerLabel } from '../questions.js'

function AnswerSummary({ answers }) {
  if (!answers) return null
  const filled = QUESTIONS.filter((q) => {
    const val = answers[q.id]
    return Array.isArray(val) ? val.length > 0 : val !== ''
  })
  return (
    <div className="quiz-history">
      {filled.map((q) => (
        <div key={q.id} className="history-item">
          <span className="history-icon">{q.icon}</span>
          <span className="history-label">{q.title}:</span>
          <span className="history-value">{getAnswerLabel(q, answers[q.id])}</span>
        </div>
      ))}
    </div>
  )
}

export default function Results({ phase, plants, error, onReset, location, answers }) {
  if (phase === 'loading') {
    return (
      <div className="results-loading">
        <span className="loading-spinner">🌿</span>
        <h2>Finding your perfect plants…</h2>
        <p>Searching for plants suited to your yard's conditions</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="results-error">
        <div className="error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={onReset}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="results">
      <AnswerSummary answers={answers} />
      <div className="results-header">
        <h2>Your Plant Matches</h2>
        <p className="results-subtitle">
          {location ? `5 plants selected for your yard in ${location}` : '5 plants selected for your yard conditions'}
        </p>
      </div>

      <div className="plants-grid">
        {plants.map((plant, i) => (
          <PlantCard key={i} plant={plant} index={i} />
        ))}
      </div>

      <div className="results-footer">
        <p className="nursery-disclaimer">
          💡 Nursery availability varies by season. Call ahead before visiting.
        </p>
        <button className="btn btn-secondary" onClick={onReset}>
          ← Start Over
        </button>
      </div>
    </div>
  )
}
