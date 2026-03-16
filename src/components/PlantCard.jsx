import { useState, useEffect } from 'react'

const FIRE_STYLES = {
  Low: {
    bg: '#d4edda',
    text: '#1d6033',
    border: '#a8d5b5',
    label: 'Low Fire Risk',
    noteBg: '#f0faf3',
  },
  Medium: {
    bg: '#fff3cd',
    text: '#856404',
    border: '#ffd47a',
    label: 'Medium Fire Risk',
    noteBg: '#fffdf0',
  },
  High: {
    bg: '#f8d7da',
    text: '#842029',
    border: '#f5b8bb',
    label: 'High Fire Risk',
    noteBg: '#fff5f5',
  },
}

export default function PlantCard({ plant, index }) {
  const fire = FIRE_STYLES[plant.fireSafetyRating] ?? FIRE_STYLES.Medium
  const [images, setImages] = useState([])

  useEffect(() => {
    const seen = new Set()
    const tryFetch = (name) =>
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
        .then((r) => r.json())
        .then((data) => { if (data.thumbnail?.source) seen.add(data.thumbnail.source) })
        .catch(() => {})

    Promise.all([tryFetch(plant.scientificName), tryFetch(plant.commonName)]).then(() => {
      setImages([...seen].slice(0, 2))
    })
  }, [plant.scientificName, plant.commonName])

  return (
    <div className="plant-card">
      <div className="plant-card-header">
        <div className="plant-number">#{index + 1}</div>

        <div className="plant-names">
          <h3 className="plant-common">{plant.commonName}</h3>
          <p className="plant-scientific">{plant.scientificName}</p>
        </div>

        <div
          className="fire-badge"
          style={{
            backgroundColor: fire.bg,
            color: fire.text,
            borderColor: fire.border,
          }}
        >
          🔥 {fire.label}
        </div>
      </div>

      {images.length > 0 && (
        <div className="plant-images">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={i === 0 ? plant.commonName : plant.scientificName}
              className="plant-image"
            />
          ))}
        </div>
      )}

      <p className="plant-why">{plant.whyItFits}</p>

      <div className="plant-specs">
        <div className="spec-item">
          <span className="spec-icon">💧</span>
          <div>
            <span className="spec-label">Water</span>
            <span className="spec-value">{plant.waterNeeds}</span>
          </div>
        </div>
        <div className="spec-item">
          <span className="spec-icon">☀️</span>
          <div>
            <span className="spec-label">Sun</span>
            <span className="spec-value">{plant.sunExposure}</span>
          </div>
        </div>
        <div className="spec-item">
          <span className="spec-icon">🌸</span>
          <div>
            <span className="spec-label">Blooms</span>
            <span className="spec-value">{plant.bloomTime}</span>
          </div>
        </div>
        <div className="spec-item">
          <span className="spec-icon">📏</span>
          <div>
            <span className="spec-label">Height</span>
            <span className="spec-value">{plant.height}</span>
          </div>
        </div>
      </div>

      {plant.fireSafetyNote && (
        <div
          className="fire-note"
          style={{ borderColor: fire.border, backgroundColor: fire.noteBg }}
        >
          🔥 {plant.fireSafetyNote}
        </div>
      )}

      {plant.companionPlants?.length > 0 && (
        <div>
          <p className="card-section-label">Companion Plants</p>
          <div className="companion-chips">
            {plant.companionPlants.map((name, i) => (
              <span key={i} className="chip">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {plant.localNurseries?.length > 0 && (
        <div>
          <p className="card-section-label">Find it locally</p>
          <div className="nursery-links">
            {plant.localNurseries.map((n, i) => (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="nursery-link"
              >
                🏪 {n.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
