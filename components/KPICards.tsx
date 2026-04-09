'use client'

interface KPI {
  energy: number
  water: number
  carbon: number
}

interface KPICardsProps {
  kpi: KPI | null
  loading: boolean
}

const cards = [
  {
    key: 'energy' as const,
    label: 'TOTAL ENERGY USAGE',
    unit: 'kWh',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M11 1L3 12h6l-2 7 8-11h-6l2-7z" stroke="#16a34a" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    bgGradient: 'from-eco-green-50 to-eco-green-100/50',
    iconBg: 'bg-eco-green-100',
    accentColor: 'text-eco-green-600',
  },
  {
    key: 'water' as const,
    label: 'TOTAL WATER USAGE',
    unit: 'm³',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2s-5 6-5 10a5 5 0 0 0 10 0C15 8 10 2 10 2z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    bgGradient: 'from-eco-blue-50 to-eco-blue-100/50',
    iconBg: 'bg-eco-blue-100',
    accentColor: 'text-eco-blue-600',
  },
  {
    key: 'carbon' as const,
    label: 'TOTAL CARBON USAGE',
    unit: 'tCO2e',
    icon: (
      <span className="text-xs font-bold text-amber-700">CO₂</span>
    ),
    bgGradient: 'from-eco-amber-50 to-eco-amber-100/50',
    iconBg: 'bg-eco-amber-100',
    accentColor: 'text-eco-amber-600',
  },
]

function formatNumber(value: number): string {
  if (value >= 10000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  if (value >= 100) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export default function KPICards({ kpi, loading }: KPICardsProps) {
  return (
    <div className="grid grid-cols-3 gap-5 px-8">
      {cards.map((card) => (
        <div
          key={card.key}
          id={`kpi-${card.key}`}
          className="relative bg-eco-surface rounded-2xl shadow-sm border border-eco-border/50 p-5 overflow-hidden transition-shadow hover:shadow-md"
        >
          {/* Gradient accent in top-right */}
          <div
            className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.bgGradient} rounded-bl-[80px] opacity-60`}
          />

          <div className="relative">
            {/* Icon + Change indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
              <span className={`text-xs font-medium ${card.accentColor} flex items-center gap-0.5`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-70">
                  <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Placeholder change % */}
                <span>—</span>
              </span>
            </div>

            {/* Label */}
            <p className="text-[10px] font-semibold tracking-widest text-eco-muted uppercase mb-1">
              {card.label}
            </p>

            {/* Value */}
            {loading ? (
              <div className="h-9 w-32 bg-eco-bg rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-eco-text">
                  {kpi ? formatNumber(kpi[card.key]) : '—'}
                </span>
                <span className="text-sm text-eco-muted font-medium">{card.unit}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
