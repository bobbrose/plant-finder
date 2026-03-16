import PlantCard from './PlantCard.jsx'

export default function Results({ phase, plants, error, onReset }) {
  if (phase === 'loading') {
    return (
      <div className="results-loading">
        <span className="loading-spinner">🌿</span>
        <h2>Finding your perfect plants…</h2>
        <p>Searching Colorado's native plant database for your yard's conditions</p>
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
      <div className="results-header">
        <h2>Your Colorado Native Plant Matches</h2>
        <p className="results-subtitle">
          5 plants selected for your Front Range yard · Zone 5b–6a
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
