import type { Site, UsageMetric } from '../generated/prisma'

// ---------- Types ----------

export type MetricKey = 'energyUse' | 'waterUse' | 'carbonUse'

export interface KPI {
  energy: number
  water: number
  carbon: number
}

export interface TrendPoint {
  date: string // ISO date string (bucket start)
  value: number | null
}

export interface DistributionPoint {
  type: string
  value: number
}

// ---------- Helpers ----------

/** Get midnight UTC for a given date */
function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** Days between two dates (fractional) */
function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)
}

/** Generate time bucket boundaries between start and end */
function generateBuckets(
  startDate: Date,
  endDate: Date,
  granularity: 'daily' | 'weekly' | 'monthly'
): { start: Date; end: Date }[] {
  const buckets: { start: Date; end: Date }[] = []
  let current = startOfDay(startDate)
  const finalEnd = startOfDay(endDate)

  while (current < finalEnd) {
    let next: Date

    if (granularity === 'daily') {
      next = new Date(current)
      next.setUTCDate(next.getUTCDate() + 1)
    } else if (granularity === 'weekly') {
      next = new Date(current)
      next.setUTCDate(next.getUTCDate() + 7)
    } else {
      // monthly
      next = new Date(current)
      next.setUTCMonth(next.getUTCMonth() + 1)
    }

    // Clamp to query end
    const bucketEnd = next > finalEnd ? finalEnd : next

    buckets.push({ start: new Date(current), end: bucketEnd })
    current = next
  }

  return buckets
}

/** Map frontend metric name to database column */
export function metricToColumn(metric: string): MetricKey {
  switch (metric.toLowerCase()) {
    case 'energy':
      return 'energyUse'
    case 'water':
      return 'waterUse'
    case 'carbon':
      return 'carbonUse'
    default:
      return 'energyUse'
  }
}

// ---------- Core Aggregation ----------

/**
 * Computes how much of a record's value falls within a given time window,
 * using proportional (linear) distribution.
 *
 * The record's value is spread evenly over its measurement period.
 * We compute the overlap between the record's period and the target window,
 * then return the proportional share.
 */
function proportionalValue(
  record: UsageMetric,
  column: MetricKey,
  windowStart: Date,
  windowEnd: Date
): number {
  const recStart = new Date(record.measurementStart)
  const recEnd = new Date(record.measurementEnd)

  // Total span of the measurement record (in days)
  const totalDays = daysBetween(recStart, recEnd)
  if (totalDays <= 0) return 0

  // Effective overlap with the target window
  const effectiveStart = recStart > windowStart ? recStart : windowStart
  const effectiveEnd = recEnd < windowEnd ? recEnd : windowEnd

  const overlapDays = daysBetween(effectiveStart, effectiveEnd)
  if (overlapDays <= 0) return 0

  const dailyRate = (record[column] as number) / totalDays
  return dailyRate * overlapDays
}

// ---------- Exported Functions ----------

/**
 * Computes KPI totals for all three metrics within the query range.
 * Uses proportional distribution so measurements that partially overlap
 * the query range contribute only their proportional share.
 */
export function computeKPI(
  records: UsageMetric[],
  startDate: Date,
  endDate: Date
): KPI {
  const kpi: KPI = { energy: 0, water: 0, carbon: 0 }

  for (const record of records) {
    kpi.energy += proportionalValue(record, 'energyUse', startDate, endDate)
    kpi.water += proportionalValue(record, 'waterUse', startDate, endDate)
    kpi.carbon += proportionalValue(record, 'carbonUse', startDate, endDate)
  }

  // Round to 1 decimal place
  kpi.energy = Math.round(kpi.energy * 10) / 10
  kpi.water = Math.round(kpi.water * 10) / 10
  kpi.carbon = Math.round(kpi.carbon * 10) / 10

  return kpi
}

/**
 * Distributes a single metric into time buckets using proportional distribution.
 * Buckets with no contributions return null (shown as line breaks in the chart).
 */
export function computeTrend(
  records: UsageMetric[],
  metric: string,
  granularity: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date
): TrendPoint[] {
  const column = metricToColumn(metric)
  const buckets = generateBuckets(startDate, endDate, granularity)

  return buckets.map((bucket) => {
    let totalValue = 0
    let hasContribution = false

    for (const record of records) {
      const recStart = new Date(record.measurementStart)
      const recEnd = new Date(record.measurementEnd)

      // Skip records that don't overlap this bucket at all
      if (recEnd <= bucket.start || recStart >= bucket.end) continue

      const contribution = proportionalValue(record, column, bucket.start, bucket.end)
      if (contribution > 0) {
        totalValue += contribution
        hasContribution = true
      }
    }

    return {
      date: bucket.start.toISOString().split('T')[0],
      value: hasContribution ? Math.round(totalValue * 10) / 10 : null,
    }
  })
}

/**
 * Groups a single metric by site type, using proportional distribution
 * to account for partial overlap with the query range.
 */
export function computeDistribution(
  records: (UsageMetric & { site: Site })[],
  metric: string,
  startDate: Date,
  endDate: Date
): DistributionPoint[] {
  const column = metricToColumn(metric)
  const groups: Record<string, number> = {}

  for (const record of records) {
    const siteType = record.site.type
    const value = proportionalValue(record, column, startDate, endDate)
    groups[siteType] = (groups[siteType] || 0) + value
  }

  return Object.entries(groups)
    .map(([type, value]) => ({
      type,
      value: Math.round(value * 10) / 10,
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Detects if any measurement records overlap for the same site.
 * Two records overlap if they share the same siteId and their
 * measurement periods intersect.
 *
 * Returns true if any overlaps are found.
 */
export function detectOverlaps(records: UsageMetric[]): boolean {
  // Group records by siteId
  const bySite: Record<string, UsageMetric[]> = {}
  for (const record of records) {
    if (!bySite[record.siteId]) bySite[record.siteId] = []
    bySite[record.siteId].push(record)
  }

  // For each site, check all pairs for overlap
  for (const siteRecords of Object.values(bySite)) {
    // Sort by measurementStart
    const sorted = [...siteRecords].sort(
      (a, b) =>
        new Date(a.measurementStart).getTime() -
        new Date(b.measurementStart).getTime()
    )

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = new Date(sorted[i].measurementEnd)
      const nextStart = new Date(sorted[i + 1].measurementStart)

      // Overlap: current record ends after the next one starts
      if (currentEnd > nextStart) {
        return true
      }
    }
  }

  return false
}
