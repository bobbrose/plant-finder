import { useState } from 'react'
import Quiz from './components/Quiz.jsx'
import Results from './components/Results.jsx'
import './App.css'

export default function App() {
  const [phase, setPhase] = useState('quiz') // 'quiz' | 'loading' | 'results' | 'error'
  const [plants, setPlants] = useState([])
  const [error, setError] = useState('')

  const handleSubmit = async (answers) => {
    setPhase('loading')
    setError('')

    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
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
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-icon">🌿</span>
          <div>
            <h1>Colorado Native Plant Finder</h1>
            <p className="header-subtitle">Tailored recommendations for Front Range &amp; foothills gardens · Zone 5b–6a</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {phase === 'quiz' && <Quiz onSubmit={handleSubmit} />}
        {(phase === 'loading' || phase === 'results' || phase === 'error') && (
          <Results
            phase={phase}
            plants={plants}
            error={error}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Native plant recommendations powered by AI · Boulder / Loveland area</p>
        <p>Nursery links are suggestions — availability varies by season. Call ahead before visiting.</p>
      </footer>
    </div>
  )
}
