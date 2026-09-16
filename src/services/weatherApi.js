import axios from 'axios'

// Open-Meteo is free and needs no API key. Base URLs live in .env so they are
// easy to change, with fallbacks if .env is missing.
const GEOCODING_URL =
    import.meta.env.VITE_GEOCODING_URL || 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL =
    import.meta.env.VITE_FORECAST_URL || 'https://api.open-meteo.com/v1/forecast'
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

// WMO weather codes used by Open-Meteo, mapped to a label, icons and a theme
// name that drives the dashboard background.
const WEATHER_CODES = {
    0: { label: 'Clear sky', day: 'sun', night: 'moon', theme: 'clear' },
    1: { label: 'Mainly clear', day: 'sun-cloud', night: 'moon', theme: 'clear' },
    2: { label: 'Partly cloudy', day: 'sun-cloud', night: 'cloud', theme: 'cloudy' },
    3: { label: 'Overcast', day: 'cloud', night: 'cloud', theme: 'cloudy' },
    45: { label: 'Fog', day: 'fog', night: 'fog', theme: 'fog' },
    48: { label: 'Freezing fog', day: 'fog', night: 'fog', theme: 'fog' },
    51: { label: 'Light drizzle', day: 'showers', night: 'rain', theme: 'rain' },
    53: { label: 'Drizzle', day: 'showers', night: 'rain', theme: 'rain' },
    55: { label: 'Heavy drizzle', day: 'rain', night: 'rain', theme: 'rain' },
    56: { label: 'Freezing drizzle', day: 'rain', night: 'rain', theme: 'rain' },
    57: { label: 'Freezing drizzle', day: 'rain', night: 'rain', theme: 'rain' },
    61: { label: 'Light rain', day: 'showers', night: 'rain', theme: 'rain' },
    63: { label: 'Rain', day: 'rain', night: 'rain', theme: 'rain' },
    65: { label: 'Heavy rain', day: 'rain', night: 'rain', theme: 'rain' },
    66: { label: 'Freezing rain', day: 'rain', night: 'rain', theme: 'rain' },
    67: { label: 'Freezing rain', day: 'rain', night: 'rain', theme: 'rain' },
    71: { label: 'Light snow', day: 'snow', night: 'snow', theme: 'snow' },
    73: { label: 'Snow', day: 'snow', night: 'snow', theme: 'snow' },
    75: { label: 'Heavy snow', day: 'snow', night: 'snow', theme: 'snow' },
    77: { label: 'Snow grains', day: 'snow', night: 'snow', theme: 'snow' },
    80: { label: 'Rain showers', day: 'showers', night: 'rain', theme: 'rain' },
    81: { label: 'Rain showers', day: 'rain', night: 'rain', theme: 'rain' },
    82: { label: 'Heavy rain showers', day: 'storm', night: 'storm', theme: 'storm' },
    85: { label: 'Snow showers', day: 'snow', night: 'snow', theme: 'snow' },
    86: { label: 'Heavy snow showers', day: 'snow', night: 'snow', theme: 'snow' },
    95: { label: 'Thunderstorm', day: 'storm', night: 'storm', theme: 'storm' },
    96: { label: 'Thunderstorm with hail', day: 'storm', night: 'storm', theme: 'storm' },
    99: { label: 'Thunderstorm with hail', day: 'storm', night: 'storm', theme: 'storm' },
}

const UNKNOWN_WEATHER = { label: 'Unknown', day: 'cloud', night: 'cloud', theme: 'cloudy' }

const ICONS = {
    sun: '\u2600\uFE0F',
    moon: '\uD83C\uDF19',
    'sun-cloud': '\u26C5',
    cloud: '\u2601\uFE0F',
    fog: '\uD83C\uDF2B\uFE0F',
    showers: '\uD83C\uDF26\uFE0F',
    rain: '\uD83C\uDF27\uFE0F',
    snow: '\u2744\uFE0F',
    storm: '\u26C8\uFE0F',
}

export function describeWeather(code, isDay = true) {
    const info = WEATHER_CODES[code] || UNKNOWN_WEATHER
    return {
        label: info.label,
        icon: ICONS[isDay ? info.day : info.night],
        theme: info.theme,
    }
}

// Temperatures are always requested in Celsius and converted here, so the
// degrees toggle never triggers another API request.
export function toDisplayTemperature(celsius, unit) {
    if (celsius === null || celsius === undefined) return null
    return unit === 'F' ? celsius * 1.8 + 32 : celsius
}

export function formatTemperature(celsius, unit) {
    const value = toDisplayTemperature(celsius, unit)
    if (value === null) return '--'
    return Math.round(value) + '\u00B0'
}

export function isCancelled(error) {
    return axios.isCancel(error) || error.code === 'ERR_CANCELED'
}

// Search cities by name. Returns an empty array when nothing matches.
export async function searchCities(query, signal) {
    const response = await axios.get(GEOCODING_URL, {
        params: { name: query, count: 6, language: 'en', format: 'json' },
        signal,
    })
    const results = response.data.results || []
    return results.map((city) => ({
        id: city.id,
        name: city.name,
        country: city.country || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude,
    }))
}

export async function fetchWeather(latitude, longitude, signal, forecastDays = 5) {
    const response = await axios.get(FORECAST_URL, {
        params: {
            latitude,
            longitude,
            current:
                'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,is_day',
            hourly: 'temperature_2m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
            timezone: 'auto',
            forecast_days: forecastDays,
        },
        signal,
    })

    const data = response.data
    const current = data.current

    const hourly = data.hourly.time.map((time, index) => ({
        time,
        temperature: data.hourly.temperature_2m[index],
    }))

    const daily = data.daily.time.map((date, index) => ({
        date,
        code: data.daily.weather_code[index],
        max: data.daily.temperature_2m_max[index],
        min: data.daily.temperature_2m_min[index],
    }))

    return {
        current: {
            temperature: current.temperature_2m,
            feelsLike: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            pressure: current.surface_pressure,
            code: current.weather_code,
            isDay: current.is_day === 1,
        },
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0],
        hourly,
        daily,
    }
}

// Open-Meteo has no reverse geocoding, so this turns the coordinates from the
// Geolocation API into a readable place name. Failing here is not fatal.
export async function reverseGeocode(latitude, longitude, signal) {
    try {
        const response = await axios.get(REVERSE_GEOCODING_URL, {
            params: { latitude, longitude, localityLanguage: 'en' },
            signal,
        })
        const data = response.data
        return {
            name: data.city || data.locality || data.principalSubdivision || 'Your location',
            country: data.countryName || '',
            admin1: data.principalSubdivision || '',
        }
    } catch (error) {
        if (isCancelled(error)) throw error
        return { name: 'Your location', country: '', admin1: '' }
    }
}