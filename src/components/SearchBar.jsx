import { useEffect, useRef, useState } from 'react'
import { searchCities, isCancelled } from '../services/weatherApi'

function SearchBar({ onSelectCity, onUseLocation, isLocating }) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [searchFailed, setSearchFailed] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    // Debounce: wait until typing pauses, and cancel the request that is already
    // in flight so an older response cannot arrive last.
    useEffect(() => {
        const trimmed = query.trim()
        if (trimmed.length < 2) {
            setSuggestions([])
            setNotFound(false)
            setSearchFailed(false)
            setIsSearching(false)
            return
        }

        const controller = new AbortController()
        setIsSearching(true)

        const timer = setTimeout(() => {
            searchCities(trimmed, controller.signal)
                .then((cities) => {
                    setSuggestions(cities)
                    setNotFound(cities.length === 0)
                    setSearchFailed(false)
                    setIsSearching(false)
                    setIsOpen(true)
                })
                .catch((error) => {
                    if (isCancelled(error)) return
                    setSuggestions([])
                    setNotFound(false)
                    setSearchFailed(true)
                    setIsSearching(false)
                    setIsOpen(true)
                })
        }, 400)

        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [query])

    // Close the suggestion list when clicking outside of it.
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function handleSelect(city) {
        setQuery('')
        setSuggestions([])
        setIsOpen(false)
        onSelectCity(city)
    }

    const showPanel =
        isOpen && (isSearching || suggestions.length > 0 || notFound || searchFailed)

    return (
        <div className="search-bar" ref={containerRef}>
            <div className="search-row">
                <input
                    className="search-input"
                    type="text"
                    value={query}
                    placeholder="Search for a city"
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <button
                    className="location-button"
                    type="button"
                    onClick={onUseLocation}
                    disabled={isLocating}
                >
                    {isLocating ? 'Locating…' : 'Use my location'}
                </button>
            </div>

            {showPanel && (
                <ul className="suggestions">
                    {isSearching && <li className="suggestion-note">Searching…</li>}

                    {!isSearching &&
                        suggestions.map((city) => (
                            <li key={city.id}>
                                <button
                                    type="button"
                                    className="suggestion"
                                    onClick={() => handleSelect(city)}
                                >
                                    <span className="suggestion-name">{city.name}</span>
                                    <span className="suggestion-meta">
                                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                                    </span>
                                </button>
                            </li>
                        ))}

                    {!isSearching && notFound && (
                        <li className="suggestion-note">
                            No city matches “{query.trim()}”. Check the spelling and try again.
                        </li>
                    )}

                    {!isSearching && searchFailed && (
                        <li className="suggestion-note">
                            City search is unavailable right now. Try again in a moment.
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}

export default SearchBar