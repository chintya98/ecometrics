'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import KPICards from './KPICards'
import TrendChart from './TrendChart'
import DistributionChart from './DistributionChart'

interface DashboardData {
  kpi: { energy: number; water: number; carbon: number }
  trend: { date: string; value: number | null }[]
  distribution: { type: string; value: number }[]
  hasOverlap: boolean
}

export default function DashboardContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const metric = searchParams.get('metric') || 'energy'
  const granularity = searchParams.get('granularity') || 'weekly'
  const site = searchParams.get('site') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('metric', metric)
      params.set('granularity', granularity)
      if (site) params.set('site', site)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/v1/metrics-data?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [metric, granularity, site, startDate, endDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6 pb-8">
      {/* Overlap warning */}
      {data?.hasOverlap && (
        <div className="mx-8 px-4 py-2.5 bg-eco-amber-50 border border-eco-amber-200 rounded-lg flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-eco-amber-500 shrink-0">
            <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-eco-amber-600">
            Overlapping measurement periods detected. Values shown include all recorded data.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <KPICards kpi={data?.kpi || null} loading={loading} />

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-5 px-8">
        <div className="col-span-3">
          <TrendChart
            data={data?.trend || []}
            metric={metric}
            granularity={granularity}
            loading={loading}
          />
        </div>
        <div className="col-span-2">
          <DistributionChart
            data={data?.distribution || []}
            metric={metric}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
