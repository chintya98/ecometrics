'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect, useRef } from 'react'

interface SiteSearchProps {
  className?: string
}

interface SiteSuggestion {
  id: string
  name: string
  type: string
}

export default function SiteSearch({ className = '' }: SiteSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('site') || '')
  const [suggestions, setSuggestions] = useState<SiteSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateURL = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('site', value)
      } else {
        params.delete('site')
      }
      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search.trim()) {
      setSuggestions([])
      return
    }
    try {
      const res = await fetch(`/api/v1/site?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(true)

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateURL(value)
      fetchSuggestions(value)
    }, 300)
  }

  const handleSelect = (site: SiteSuggestion) => {
    setQuery(site.name)
    setShowSuggestions(false)
    updateURL(site.name)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    updateURL('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-muted"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          id="site-search"
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Search site name..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-eco-bg border border-eco-border rounded-lg
                    placeholder:text-eco-muted focus:outline-none focus:ring-2 focus:ring-eco-green-500/30
                    focus:border-eco-green-500 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-eco-muted hover:text-eco-text"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-eco-surface shadow-lg border border-eco-border rounded-lg z-50 py-1 max-h-48 overflow-y-auto">
          {suggestions.map((site) => (
            <button
              key={site.id}
              onClick={() => handleSelect(site)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-eco-green-50 flex items-center justify-between transition-colors"
            >
              <span className="text-eco-text">{site.name}</span>
              <span className="text-xs text-eco-muted uppercase">{site.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
