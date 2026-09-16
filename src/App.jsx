import { useEffect, useRef, useState } from 'react'
import SearchBar from './components/SearchBar'
import CurrentWeather from './components/CurrentWeather'
import Forecast from './components/Forecast'
import WeatherChart from './components/WeatherChart'
import WeatherParticles from './components/WeatherParticles'
import {
  describeWeather,
  fetchWeather,
  isCancelled,
  reverseGeocode,
} from './services/weatherApi'
import './App.css'

const RECENT_KEY = 'weather-dashboard-recent'
const FAVORITES_KEY = 'weather-dashboard-favorites'
const MAX_RECENT = 5
const MAX_FAVORITES = 8

function loadFromStorage(key) {
  try {
    const stored = JSON.parse(localStorage.getItem(key))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function isSameCity(a, b) {
  return a.latitude === b.latitude && a.longitude === b.longitude
}

function WeatherSkeleton() {
  return (
    <div className="dashboard">
      <div className="card skeleton-card skeleton-current">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-big" />
        <div className="skeleton-grid">
          {[0, 1, 2, 3].map((index) => (
            <div className="skeleton-line" key={index} />
          ))}
        </div>
      </div>
      <div className="card skeleton-card skeleton-side">
        <div className="skeleton-line skeleton-title" />
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="skeleton-line" key={index} />
        ))}
      </div>
      <div className="card skeleton-card skeleton-chart">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-block" />
      </div>
    </div>
  )
}

function App() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('')
  const [place, setPlace] = useState(null)
  const [weather, setWeather] = useState(null)
  const [unit, setUnit] = useState('C')
  const [isLocating, setIsLocating] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => loadFromStorage(RECENT_KEY))
  const [favorites, setFavorites] = useState(() => loadFromStorage(FAVORITES_KEY))
  const [forecastDays, setForecastDays] = useState(5)

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches))
  }, [recentSearches])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  function rememberCity(city) {
    setRecentSearches((previous) => {
      const withoutDuplicate = previous.filter((item) => !isSameCity(item, city))
      return [city, ...withoutDuplicate].slice(0, MAX_RECENT)
    })
  }

  function handleToggleFavorite() {
    if (!place) return
    setFavorites((previous) => {
      const exists = previous.some((item) => isSameCity(item, place))
      if (exists) return previous.filter((item) => !isSameCity(item, place))
      return [place, ...previous].slice(0, MAX_FAVORITES)
    })
  }

  async function loadWeatherFor(city, options = {}) {
    // Cancel whatever is still in flight, then tag this request so a slower
    // older response can never overwrite a newer one.
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    requestIdRef.current += 1
    const currentRequestId = requestIdRef.current
    const days = options.days ?? forecastDays

    setStatus('loading')
    setErrorMessage('')
    setPlace(city)

    try {
      let resolvedCity = city
      if (options.resolveName) {
        const found = await reverseGeocode(city.latitude, city.longitude, controller.signal)
        resolvedCity = { ...city, ...found }
      }

      const data = await fetchWeather(city.latitude, city.longitude, controller.signal, days)

      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return

      setPlace(resolvedCity)
      setWeather(data)
      setForecastDays(days)
      setStatus('success')
      rememberCity(resolvedCity)
    } catch (error) {
      if (isCancelled(error)) return
      if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return
      setStatus('error')
      setErrorMessage(
        'Could not load the weather. Check your connection and try again.'
      )
    }
  }

  function handleForecastDaysChange(days) {
    if (days === forecastDays) return
    if (place && status === 'success') {
      loadWeatherFor(place, { days })
    } else {
      setForecastDays(days)
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('This browser does not support location access. Search for a city instead.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return
        setIsLocating(false)
        loadWeatherFor(
          {
            id: 'my-location',
            name: 'Your location',
            country: '',
            admin1: '',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          { resolveName: true }
        )
      },
      (error) => {
        if (!isMountedRef.current) return
        setIsLocating(false)
        setStatus('error')
        setErrorMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location access was blocked. Allow it in your browser settings, or search for a city.'
            : 'Could not get your location. Search for a city instead.'
        )
      },
      { timeout: 10000 }
    )
  }

  const condition =
    status === 'success' && weather
      ? describeWeather(weather.current.code, weather.current.isDay)
      : null
  const theme = condition ? `${condition.theme}-${weather.current.isDay ? 'day' : 'night'}` : 'default'
  const isFavorite = place ? favorites.some((item) => isSameCity(item, place)) : false

  return (
    <div className={`app theme-${theme}`}>
      {condition && (
        <WeatherParticles theme={condition.theme} isDay={weather.current.isDay} />
      )}

      <div className="container">
        <header className="header">
          <h1 className="brand">
            <span className="brand-icon" aria-hidden="true">⛅</span>
            Weather Dashboard
          </h1>
          <div className="unit-toggle">
            <button
              type="button"
              className={unit === 'C' ? 'unit active' : 'unit'}
              onClick={() => setUnit('C')}
            >
              °C
            </button>
            <button
              type="button"
              className={unit === 'F' ? 'unit active' : 'unit'}
              onClick={() => setUnit('F')}
            >
              °F
            </button>
          </div>
        </header>

        {status === 'idle' && (
          <div className="hero">
            <div className="hero-decor" aria-hidden="true">
              <span className="hero-icon hero-icon-sun">☀️</span>
              <span className="hero-icon hero-icon-cloud">☁️</span>
              <span className="hero-icon hero-icon-rain">🌧️</span>
            </div>
            <p className="hero-eyebrow">Real-time forecasts, anywhere</p>
            <h2 className="hero-title">Know the sky before you step outside</h2>
            <p className="hero-subtitle">
              Search any city or use your current location to see live
              conditions, a 5-day outlook, and an hourly temperature curve.
            </p>
          </div>
        )}

        <SearchBar
          onSelectCity={(city) => loadWeatherFor(city)}
          onUseLocation={handleUseLocation}
          isLocating={isLocating}
        />

        {favorites.length > 0 && (
          <div className="recent favorites-row">
            <span className="recent-label">★ Favorites</span>
            {favorites.map((city) => (
              <button
                type="button"
                className="recent-chip"
                key={`${city.latitude},${city.longitude}`}
                onClick={() => loadWeatherFor(city)}
              >
                {city.name}
              </button>
            ))}
          </div>
        )}

        {recentSearches.length > 0 && (
          <div className="recent">
            <span className="recent-label">Recent</span>
            {recentSearches.map((city) => (
              <button
                type="button"
                className="recent-chip"
                key={`${city.latitude},${city.longitude}`}
                onClick={() => loadWeatherFor(city)}
              >
                {city.name}
              </button>
            ))}
            <button
              type="button"
              className="recent-clear"
              onClick={() => setRecentSearches([])}
            >
              Clear
            </button>
          </div>
        )}

        {status === 'loading' && <WeatherSkeleton />}

        {status === 'error' && (
          <div className="card message-card error-card">
            <h2>Something went wrong</h2>
            <p>{errorMessage}</p>
            {place && (
              <button
                type="button"
                className="retry-button"
                onClick={() => loadWeatherFor(place)}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {status === 'success' && weather && place && (
          <div className="dashboard">
            <CurrentWeather
              place={place}
              weather={weather}
              unit={unit}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
            <Forecast
              days={weather.daily}
              unit={unit}
              forecastDays={forecastDays}
              onChangeDays={handleForecastDaysChange}
            />
            <WeatherChart hourly={weather.hourly} unit={unit} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App