'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DistributionPoint {
  type: string
  value: number
}

interface DistributionChartProps {
  data: DistributionPoint[]
  metric: string
  loading: boolean
}

const TYPE_COLORS: Record<string, string> = {
  OFFICE: '#16a34a',
  FACTORY: '#2563eb',
  STORAGE: '#d97706',
  OTHER: '#60a5fa',
}

const TYPE_LABELS: Record<string, string> = {
  OFFICE: 'Office Complex',
  FACTORY: 'Manufacturing',
  STORAGE: 'Storage',
  OTHER: 'Others',
}

export default function DistributionChart({ data, metric, loading }: DistributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const chartData = {
    labels: data.map((d) => TYPE_LABELS[d.type] || d.type),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => TYPE_COLORS[d.type] || '#94a3b8'),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverOffset: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
      },
    },
  }

  const capitalizedMetric = metric.charAt(0).toUpperCase() + metric.slice(1)

  return (
    <div className="bg-eco-surface rounded-2xl shadow-sm border border-eco-border/50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-eco-text">Usage by Site Type</h3>
        <p className="text-sm text-eco-muted">{capitalizedMetric} distribution by Site type</p>
      </div>

      {loading ? (
        <div className="h-52 bg-eco-bg rounded-lg animate-pulse" />
      ) : (
        <>
          {/* Chart with center label */}
          <div className="relative h-52 flex items-center justify-center">
            <Doughnut data={chartData} options={options} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-eco-text">
                {total > 0 ? '84%' : '—'}
              </span>
              <span className="text-[10px] tracking-widest text-eco-green-600 uppercase font-semibold">
                Efficiency
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2.5">
            {data.map((d) => {
              const percentage = total > 0 ? Math.round((d.value / total) * 100) : 0
              return (
                <div key={d.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[d.type] || '#94a3b8' }}
                    />
                    <span className="text-eco-text">{TYPE_LABELS[d.type] || d.type}</span>
                  </div>
                  <span className="font-semibold text-eco-text">{percentage}%</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
