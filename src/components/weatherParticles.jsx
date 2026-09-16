import { useMemo } from 'react'

// Deterministic-ish random spread for particle positions/timings, generated
// once per theme so it doesn't reshuffle on every re-render.
function makeDrops(count, seedOffset) {
    return Array.from({ length: count }, (_, index) => {
        const seed = index + seedOffset
        return {
            left: (seed * 37) % 100,
            delay: (seed * 0.37) % 3,
            duration: 2.4 + ((seed * 0.53) % 1.8),
            drift: ((seed % 5) - 2) * 6,
        }
    })
}

function RainLayer({ heavy }) {
    const drops = useMemo(() => makeDrops(heavy ? 48 : 28, 3), [heavy])
    return (
        <div className="particles rain-layer">
            {drops.map((drop, index) => (
                <span
                    key={index}
                    className="raindrop"
                    style={{
                        left: `${drop.left}%`,
                        animationDelay: `${drop.delay}s`,
                        animationDuration: `${drop.duration * 0.6}s`,
                    }}
                />
            ))}
        </div>
    )
}

function SnowLayer() {
    const flakes = useMemo(() => makeDrops(30, 7), [])
    return (
        <div className="particles snow-layer">
            {flakes.map((flake, index) => (
                <span
                    key={index}
                    className="snowflake"
                    style={{
                        left: `${flake.left}%`,
                        animationDelay: `${flake.delay}s`,
                        animationDuration: `${flake.duration + 3}s`,
                        '--drift': `${flake.drift}px`,
                    }}
                />
            ))}
        </div>
    )
}

function CloudLayer({ dense }) {
    const clouds = useMemo(() => makeDrops(dense ? 5 : 3, 11), [dense])
    return (
        <div className="particles cloud-layer">
            {clouds.map((cloud, index) => (
                <span
                    key={index}
                    className="drift-cloud"
                    style={{
                        top: `${8 + ((index * 17) % 55)}%`,
                        animationDelay: `${cloud.delay * 6}s`,
                        animationDuration: `${28 + (index % 3) * 8}s`,
                        opacity: 0.3 + (index % 3) * 0.1,
                        fontSize: `${2.2 + (index % 3) * 0.8}rem`,
                    }}
                >
                    ☁️
                </span>
            ))}
        </div>
    )
}

function SunGlow() {
    return (
        <div className="particles sun-layer">
            <div className="sun-glow" />
        </div>
    )
}

function StarLayer() {
    const stars = useMemo(() => makeDrops(40, 19), [])
    return (
        <div className="particles star-layer">
            {stars.map((star, index) => (
                <span
                    key={index}
                    className="star"
                    style={{
                        left: `${star.left}%`,
                        top: `${(index * 23) % 70}%`,
                        animationDelay: `${star.delay}s`,
                    }}
                />
            ))}
        </div>
    )
}

function FogLayer() {
    return (
        <div className="particles fog-layer">
            <div className="fog-band fog-band-1" />
            <div className="fog-band fog-band-2" />
        </div>
    )
}

function WeatherParticles({ theme, isDay }) {
    return (
        <div className="weather-particles" aria-hidden="true">
            {theme === 'rain' && <RainLayer heavy={false} />}
            {theme === 'storm' && <RainLayer heavy />}
            {theme === 'snow' && <SnowLayer />}
            {theme === 'fog' && <FogLayer />}
            {theme === 'cloudy' && <CloudLayer dense={!isDay} />}
            {theme === 'clear' && isDay && <SunGlow />}
            {theme === 'clear' && !isDay && <StarLayer />}
        </div>
    )
}

export default WeatherParticles