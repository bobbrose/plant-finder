import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import './App.css'

function locationLabel(loc) {
  if (!loc) return ''
  if (loc.freeText) return loc.freeText
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
  const [resetKey, setResetKey] = useState(0)
  const [location, setLocation] = useState(null)
  const [locationPhase, setLocationPhase] = useState('detecting') // 'detecting' | 'detected' | 'needs-zip'
  const [zipInput, setZipInput] = useState('')
  const [hardinessZone, setHardinessZone] = useState('')
  const [editingLocation, setEditingLocation] = useState(false)
  const [editInput, setEditInput] = useState('')
  const [showAbout, setShowAbout] = useState(false)

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
    fetch('https://freeipapi.com/api/json')
      .then((r) => r.json())
      .then((data) => {
        if (data.cityName && data.cityName !== '-') {
          const loc = { city: data.cityName, region: data.regionName, country: data.countryName, zip: data.zipCode }
          setLocation(loc)
          setLocationPhase('detected')
          fetchZone(loc.zip)
          if (import.meta.env.VITE_DEBUG === 'true') {
            console.log('[DEBUG] Inferred location from IP:', loc)
          }
        } else {
          setLocationPhase('needs-zip')
          if (import.meta.env.VITE_DEBUG === 'true') {
            console.log('[DEBUG] IP location lookup failed. Raw response:', data)
          }
        }
      })
      .catch((err) => {
        setLocationPhase('needs-zip')
        if (import.meta.env.VITE_DEBUG === 'true') {
          console.log('[DEBUG] IP location lookup failed. Error:', err)
        }
      })
  }, [])

  const applyLocationInput = async (input) => {
    setHardinessZone('')
    if (/^\d{5}(-\d{4})?$/.test(input)) {
      setLocation({ zip: input })
      fetchZone(input)
      return
    }

    // Geocode city/state via Nominatim
    try {
      const params = new URLSearchParams({ q: input, format: 'json', limit: 1, addressdetails: 1 })
      const r = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'PlantPicker/1.0' },
      })
      const data = await r.json()
      if (data.length > 0) {
        const { lat, lon, address } = data[0]
        const city = address?.city || address?.town || address?.village || address?.hamlet
        const region = address?.state
        setLocation(city && region ? { city, region } : { freeText: input })
        fetchZoneByCoords(lat, lon)
      } else {
        setLocation({ freeText: input })
      }
    } catch {
      setLocation({ freeText: input })
    }
  }

  const handleLocationEdit = async (e) => {
    e.preventDefault()
    const input = editInput.trim()
    if (!input) return
    setEditingLocation(false)
    await applyLocationInput(input)
  }

  const fetchZone = (zip) => {
    if (!zip) return
    fetch(`https://phzmapi.org/${zip}.json`)
      .then((r) => r.json())
      .then((data) => { if (data.zone) setHardinessZone(data.zone) })
      .catch(() => {})
  }

  const fetchZoneByCoords = (lat, lon) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`, {
      headers: { 'User-Agent': 'PlantPicker/1.0' },
    })
      .then((r) => r.json())
      .then((data) => {
        const zip = data.address?.postcode?.slice(0, 5)
        if (zip) fetchZone(zip)
      })
      .catch(() => {})
  }

  const handleZipSubmit = async (e) => {
    e.preventDefault()
    const input = zipInput.trim()
    if (!input) return
    setLocationPhase('detected')
    await applyLocationInput(input)
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('[DEBUG] Location set from initial input:', input)
    }
  }

  const handleSubmit = async (answers) => {
    setSubmittedAnswers(answers)
    setPhase('loading')
    setError('')
    if (import.meta.env.VITE_DEBUG === 'true') {
      console.log('[DEBUG] Quiz answers:', answers)
    }

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
      console.error('Plant recommendations request failed:', err)
      setError(err.message)
      setPhase('error')
    }
  }

  const handleReset = () => {
    setPhase('quiz')
    setPlants([])
    setError('')
    setSubmittedAnswers(null)
    setResetKey((k) => k + 1)
  }

  const label = locationLabel(location)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-icon">🌿</span>
          <div>
            <h1 className="header-title" onClick={handleReset}>Plant Picker</h1>
            {label && (
              <p className="header-subtitle">
                {editingLocation ? (
                  <form onSubmit={handleLocationEdit} className="location-edit-form">
                    <input
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      className="location-edit-input"
                      placeholder="City, State or ZIP"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Escape' && setEditingLocation(false)}
                    />
                    <button type="submit" className="location-edit-confirm">✓</button>
                    <button type="button" className="location-edit-cancel" onClick={() => setEditingLocation(false)}>✕</button>
                  </form>
                ) : (
                  <>
                    Personalized recommendations for {label}{hardinessZone ? ` · Zone ${hardinessZone}` : ''}
                    <button
                      className="location-edit-btn"
                      onClick={() => { setEditInput(label); setEditingLocation(true) }}
                      title="Change location"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5e6c8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </>
                )}
              </p>
            )}
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
            <p>Enter your city and state or ZIP code so we can recommend the best plants for your area.</p>
            <form onSubmit={handleZipSubmit} className="zip-form">
              <input
                type="text"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="City, State or ZIP"
                maxLength={100}
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
          <Quiz key={resetKey} onSubmit={handleSubmit} />
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
        <p>
          <button className="about-link" onClick={() => setShowAbout(true)}>
            Plant Picker · AI-powered recommendations
          </button>
        </p>

      </footer>

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="about-close" onClick={() => setShowAbout(false)}>✕</button>
            <div className="about-logo">🌿</div>
            <h2 className="about-title">Plant Picker</h2>
            <p className="about-line">
              Created by <a href="https://bobbrose.com" target="_blank" rel="noopener noreferrer">Bob Rose</a>
            </p>
            <p className="about-line">
              Coding and plant recommendations powered by Claude (Anthropic)
            </p>
            <p className="about-line">
              <a href="https://github.com/bobbrose/plant-finder" target="_blank" rel="noopener noreferrer" className="about-github">
                <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor" aria-label="GitHub">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  )
}
