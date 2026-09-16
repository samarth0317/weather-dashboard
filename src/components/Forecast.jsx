import { describeWeather, formatTemperature, toDisplayTemperature } from '../services/weatherApi'

function formatDay(dateString, index) {
    if (index === 0) return 'Today'
    const date = new Date(`${dateString}T00:00:00`)
    return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

function Forecast({ days, unit, forecastDays, onChangeDays }) {
    // Normalize each day's min/max against the range across all visible days,
    // so the bars are comparative rather than arbitrary.
    const displayDays = days.map((day) => ({
        ...day,
        displayMax: toDisplayTemperature(day.max, unit),
        displayMin: toDisplayTemperature(day.min, unit),
    }))

    const overallMin = Math.min(...displayDays.map((day) => day.displayMin))
    const overallMax = Math.max(...displayDays.map((day) => day.displayMax))
    const range = overallMax - overallMin || 1

    return (
        <section className="card forecast">
            <div className="forecast-head">
                <h3 className="section-title">Forecast</h3>
                <div className="days-toggle">
                    <button
                        type="button"
                        className={forecastDays === 5 ? 'unit active' : 'unit'}
                        onClick={() => onChangeDays(5)}
                    >
                        5-day
                    </button>
                    <button
                        type="button"
                        className={forecastDays === 7 ? 'unit active' : 'unit'}
                        onClick={() => onChangeDays(7)}
                    >
                        7-day
                    </button>
                </div>
            </div>

            <ul className="forecast-list">
                {displayDays.map((day, index) => {
                    const condition = describeWeather(day.code, true)
                    const leftPct = ((day.displayMin - overallMin) / range) * 100
                    const widthPct = ((day.displayMax - day.displayMin) / range) * 100

                    return (
                        <li className="forecast-day" key={day.date}>
                            <span className="forecast-date">{formatDay(day.date, index)}</span>
                            <span className="forecast-icon" role="img" aria-label={condition.label}>
                                {condition.icon}
                            </span>

                            <span className="forecast-bar-value forecast-bar-min">
                                {formatTemperature(day.min, unit)}
                            </span>
                            <span className="forecast-bar-track">
                                <span
                                    className="forecast-bar-fill"
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                />
                            </span>
                            <span className="forecast-bar-value forecast-bar-max">
                                {formatTemperature(day.max, unit)}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

export default Forecast