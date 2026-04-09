'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TrendPoint {
  date: string
  value: number | null
}

interface TrendChartProps {
  data: TrendPoint[]
  metric: string
  granularity: string
  loading: boolean
}

export default function TrendChart({ data, metric, granularity, loading }: TrendChartProps) {
  const labels = data.map((d) => {
    const date = new Date(d.date)
    if (granularity === 'daily') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (granularity === 'weekly') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  })

  const values = data.map((d) => d.value)

  const chartData = {
    labels,
    datasets: [
      {
        label: `${metric} Usage`,
        data: values,
        borderColor: '#16a34a',
        backgroundColor: (context: { chart: ChartJS }) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, context.chart.height)
          gradient.addColorStop(0, 'rgba(22, 163, 74, 0.15)')
          gradient.addColorStop(1, 'rgba(22, 163, 74, 0.01)')
          return gradient
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#16a34a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
        spanGaps: false, // Show line breaks for null values (gaps)
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      title: { display: false },
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          maxTicksLimit: 10,
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  }

  const capitalizedMetric = metric.charAt(0).toUpperCase() + metric.slice(1)
  const capitalizedGranularity = granularity.charAt(0).toUpperCase() + granularity.slice(1)

  return (
    <div className="bg-eco-surface rounded-2xl shadow-sm border border-eco-border/50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-eco-text">Consumption Trends</h3>
        <p className="text-sm text-eco-muted">{capitalizedGranularity} usage</p>
      </div>
      <div className="h-64">
        {loading ? (
          <div className="h-full bg-eco-bg rounded-lg animate-pulse" />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  )
}
