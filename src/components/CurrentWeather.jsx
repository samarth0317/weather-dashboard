import { describeWeather, formatTemperature } from '../services/weatherApi'

function formatTime(isoTime) {
    if (!isoTime) return '--'
    return new Date(isoTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Position of the sun marker along an elliptical arc from sunrise (left) to
// sunset (right). Progress is clamped so it never overshoots the arc.
function sunArcPosition(sunrise, sunset) {
    const cx = 100
    const cy = 92
    const rx = 88
    const ry = 78

    const sunriseMs = new Date(sunrise).getTime()
    const sunsetMs = new Date(sunset).getTime()
    const nowMs = Date.now()

    let progress = 0.5
    if (Number.isFinite(sunriseMs) && Number.isFinite(sunsetMs) && sunsetMs > sunriseMs) {
        progress = (nowMs - sunriseMs) / (sunsetMs - sunriseMs)
    }
    progress = Math.min(1, Math.max(0, progress))

    const theta = Math.PI - progress * Math.PI
    const x = cx + rx * Math.cos(theta)
    const y = cy - ry * Math.sin(theta)

    return { x, y, isUp: progress > 0 && progress < 1 }
}

function CurrentWeather({ place, weather, unit, isFavorite, onToggleFavorite }) {
    const { current, sunrise, sunset } = weather
    const condition = describeWeather(current.code, current.isDay)
    const placeLine = [place.admin1, place.country].filter(Boolean).join(', ')
    const sunPos = sunArcPosition(sunrise, sunset)

    const details = [
        { label: 'Feels like', value: formatTemperature(current.feelsLike, unit) },
        { label: 'Humidity', value: `${Math.round(current.humidity)}%` },
        { label: 'Wind', value: `${Math.round(current.windSpeed)} km/h` },
        { label: 'Pressure', value: `${Math.round(current.pressure)} hPa` },
    ]

    return (
        <section className="card current-weather">
            <div className="current-head">
                <div>
                    <p className="current-eyebrow">Current weather</p>
                    <h2 className="city-name">{place.name}</h2>
                    {placeLine && <p className="city-region">{placeLine}</p>}
                </div>
                <div className="current-head-actions">
                    <button
                        type="button"
                        className={isFavorite ? 'favorite-button active' : 'favorite-button'}
                        onClick={onToggleFavorite}
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {isFavorite ? '★' : '☆'}
                    </button>
                    <span className="current-icon" role="img" aria-label={condition.label}>
                        {condition.icon}
                    </span>
                </div>
            </div>

            <p className="current-temp">
                {formatTemperature(current.temperature, unit)}
                <span className="unit-suffix">{unit}</span>
            </p>
            <p className="current-condition">{condition.label}</p>

            <dl className="detail-grid">
                {details.map((item) => (
                    <div className="detail" key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                    </div>
                ))}
            </dl>

            <div className="sun-arc">
                <svg viewBox="0 0 200 100" className="sun-arc-svg">
                    <path d="M10,92 A88,78 0 0 1 190,92" className="sun-arc-path" />
                    {sunPos.isUp && <circle cx={sunPos.x} cy={sunPos.y} r="6" className="sun-arc-dot" />}
                </svg>
                <div className="sun-arc-labels">
                    <div className="sun-arc-label">
                        <span className="sun-arc-icon">🌅</span>
                        <span>{formatTime(sunrise)}</span>
                    </div>
                    <div className="sun-arc-label">
                        <span className="sun-arc-icon">🌇</span>
                        <span>{formatTime(sunset)}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CurrentWeather