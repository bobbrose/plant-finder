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

const CONTEXT_WINDOW = 200_000

function TokenUsageBar({ usage }) {
  if (!usage) return null
  const { input_tokens, output_tokens } = usage
  const total = input_tokens + output_tokens
  const remaining = CONTEXT_WINDOW - total
  const pctUsed = Math.min((total / CONTEXT_WINDOW) * 100, 100)

  return (
    <div className="token-usage">
      <div className="token-usage-bar-wrap">
        <div className="token-usage-bar" style={{ width: `${pctUsed}%` }} />
      </div>
      <div className="token-usage-stats">
        <span>{input_tokens.toLocaleString()} in · {output_tokens.toLocaleString()} out</span>
        <span>{remaining.toLocaleString()} tokens left of {CONTEXT_WINDOW.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function Results({ phase, plants, error, onReset, location, answers, tokenUsage }) {
  if (phase === 'loading') {
    return (
      <div className="results-loading">
        <span className="loading-spinner">🌿</span>
        <h2>Picking your perfect plants…</h2>
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
        <h2>Your Plant Picks</h2>
        <p className="results-subtitle">
          {location ? `${plants.length} plants picked for your yard in ${location}` : `${plants.length} plants picked for your yard conditions`}
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
        <TokenUsageBar usage={tokenUsage} />
        <button className="btn btn-secondary" onClick={onReset}>
          ← Start Over
        </button>
      </div>
    </div>
  )
}
