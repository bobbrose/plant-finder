import { useState, useEffect } from 'react'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import './App.css'

function locationLabel(loc) {
  if (!loc) return ''
  if (loc.zip && !loc.city) return `ZIP ${loc.zip}`
  return loc.region ? `${loc.city}, ${loc.region}` : loc.city
}

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking') // 'checking' | 'ok' | 'error'
  const [apiError, setApiError] = useState('')
  const [phase, setPhase] = useState('quiz') // 'quiz' | 'loading' | 'results' | 'error'
  const [plants, setPlants] = useState([])
  const [error, setError] = useState('')
  const [submittedAnswers, setSubmittedAnswers] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationPhase, setLocationPhase] = useState('detecting') // 'detecting' | 'detected' | 'needs-zip'
  const [zipInput, setZipInput] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setApiStatus('ok')
        } else {
          setApiError(data.error || 'Could not connect to the API.')
          setApiStatus('error')
        }
      })
      .catch(() => {
        setApiError('Could not reach the server.')
        setApiStatus('error')
      })
  }, [])

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        if (data.city && !data.error) {
          setLocation({ city: data.city, region: data.region, country: data.country_name, zip: data.postal })
          setLocationPhase('detected')
        } else {
          setLocationPhase('needs-zip')
        }
      })
      .catch(() => setLocationPhase('needs-zip'))
  }, [])

  const handleZipSubmit = (e) => {
    e.preventDefault()
    if (zipInput.trim()) {
      setLocation({ zip: zipInput.trim() })
      setLocationPhase('detected')
    }
  }

  const handleSubmit = async (answers) => {
    setSubmittedAnswers(answers)
    setPhase('loading')
    setError('')

    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, location }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get recommendations')
      }

      setPlants(data.plants)
      setPhase('results')
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  const handleReset = () => {
    setPhase('quiz')
    setPlants([])
    setError('')
    setSubmittedAnswers(null)
  }

  const label = locationLabel(location)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-icon">🌿</span>
          <div>
            <h1>Plant Finder</h1>
            {label && <p className="header-subtitle">Personalized recommendations for {label}</p>}
          </div>
        </div>
      </header>

      <main className="app-main">
        {apiStatus === 'checking' && (
          <div className="results-loading">
            <span className="loading-spinner">🌿</span>
            <h2>Connecting…</h2>
            <p>Checking API connection</p>
          </div>
        )}
        {apiStatus === 'error' && (
          <div className="results-error">
            <div className="error-icon">⚠️</div>
            <h2>Cannot connect to Claude</h2>
            <p>{apiError}</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              Make sure <code>.env</code> contains a valid <code>ANTHROPIC_API_KEY</code> and restart the server.
            </p>
          </div>
        )}
        {apiStatus === 'ok' && locationPhase === 'detecting' && (
          <div className="results-loading">
            <span className="loading-spinner">🌿</span>
            <h2>Detecting your location…</h2>
          </div>
        )}
        {apiStatus === 'ok' && locationPhase === 'needs-zip' && (
          <div className="location-prompt">
            <div className="location-icon">📍</div>
            <h2>Where are you gardening?</h2>
            <p>Enter your ZIP code so we can recommend the best plants for your area.</p>
            <form onSubmit={handleZipSubmit} className="zip-form">
              <input
                type="text"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="e.g. 80301"
                maxLength={10}
                className="zip-input"
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={!zipInput.trim()}>
                Continue →
              </button>
            </form>
          </div>
        )}
        {apiStatus === 'ok' && locationPhase === 'detected' && phase === 'quiz' && (
          <Quiz onSubmit={handleSubmit} />
        )}
        {apiStatus === 'ok' && locationPhase === 'detected' && (phase === 'loading' || phase === 'results' || phase === 'error') && (
          <Results
            phase={phase}
            plants={plants}
            error={error}
            onReset={handleReset}
            location={label}
            answers={submittedAnswers}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Plant recommendations powered by AI{label ? ` · ${label}` : ''}</p>
        <p>Nursery links are suggestions — availability varies by season. Call ahead before visiting.</p>
      </footer>
    </div>
  )
}
