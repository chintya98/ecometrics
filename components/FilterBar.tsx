'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const metrics = ['Energy', 'Water', 'Carbon'] as const
const granularities = ['Daily', 'Weekly', 'Monthly'] as const
const dateRanges = [
  { label: 'Last Month', value: 'last-month' },
  { label: 'Last Year', value: 'last-year' },
  { label: 'Custom', value: 'custom' },
] as const

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentMetric = searchParams.get('metric') || 'energy'
  const currentGranularity = searchParams.get('granularity') || 'weekly'
  const currentDateRange = searchParams.get('dateRange') || 'last-year'

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)

      // Calculate actual date range
      if (key === 'dateRange') {
        const now = new Date()
        if (value === 'last-month') {
          const start = new Date(now)
          start.setUTCMonth(start.getUTCMonth() - 1)
          params.set('startDate', start.toISOString().split('T')[0])
          params.set('endDate', now.toISOString().split('T')[0])
        } else if (value === 'last-year') {
          const start = new Date(now)
          start.setUTCFullYear(start.getUTCFullYear() - 1)
          params.set('startDate', start.toISOString().split('T')[0])
          params.set('endDate', now.toISOString().split('T')[0])
        }
        // For 'custom', user would need a date picker (deferred)
      }

      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex items-center gap-8 px-8 py-4">
      {/* Metric Focus */}
      <div>
        <label className="block text-[10px] font-semibold tracking-widest text-eco-muted uppercase mb-2">
          Metric Focus
        </label>
        <div className="flex bg-eco-bg rounded-lg p-0.5 border border-eco-border">
          {metrics.map((m) => {
            const isActive = currentMetric === m.toLowerCase()
            return (
              <button
                key={m}
                id={`metric-${m.toLowerCase()}`}
                onClick={() => updateParam('metric', m.toLowerCase())}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-eco-green-600 text-white shadow-sm'
                      : 'text-eco-muted hover:text-eco-text'
                  }
                `}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>

      {/* Granularity */}
      <div>
        <label className="block text-[10px] font-semibold tracking-widest text-eco-muted uppercase mb-2">
          Granularity
        </label>
        <select
          id="granularity-select"
          value={currentGranularity}
          onChange={(e) => updateParam('granularity', e.target.value)}
          className="px-3 py-1.5 text-sm bg-eco-surface border border-eco-border rounded-lg
                     text-eco-text focus:outline-none focus:ring-2 focus:ring-eco-green-500/30
                     focus:border-eco-green-500 cursor-pointer"
        >
          {granularities.map((g) => (
            <option key={g} value={g.toLowerCase()}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-[10px] font-semibold tracking-widest text-eco-muted uppercase mb-2">
          Date Range
        </label>
        <select
          id="date-range-select"
          value={currentDateRange}
          onChange={(e) => updateParam('dateRange', e.target.value)}
          className="px-3 py-1.5 text-sm bg-eco-surface border border-eco-border rounded-lg
                     text-eco-text focus:outline-none focus:ring-2 focus:ring-eco-green-500/30
                     focus:border-eco-green-500 cursor-pointer"
        >
          {dateRanges.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
