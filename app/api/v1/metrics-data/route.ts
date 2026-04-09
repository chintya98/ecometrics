import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  computeKPI,
  computeTrend,
  computeDistribution,
  detectOverlaps,
} from '@/lib/aggregation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Parse query params
  const metric = searchParams.get('metric') || 'energy'
  const granularity =
    (searchParams.get('granularity') as 'daily' | 'weekly' | 'monthly') || 'weekly'
  const siteSearch = searchParams.get('site') || ''

  // Date range defaults: last 12 months
  const now = new Date()
  const defaultStart = new Date(now)
  defaultStart.setUTCMonth(defaultStart.getUTCMonth() - 12)

  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : defaultStart
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : now

  try {
    // Build site filter for fuzzy match
    const siteFilter = siteSearch
      ? {
          site: {
            name: {
              contains: siteSearch,
              mode: 'insensitive' as const,
            },
          },
        }
      : {}

    // Fetch all usage metric records that overlap the query range
    // A record overlaps if: record.measurementStart < endDate AND record.measurementEnd > startDate
    const records = await prisma.usageMetric.findMany({
      where: {
        ...siteFilter,
        measurementStart: { lt: endDate },
        measurementEnd: { gt: startDate },
      },
      include: {
        site: true,
      },
      orderBy: {
        measurementStart: 'asc',
      },
    })

    // Compute all aggregations
    const kpi = computeKPI(records, startDate, endDate)
    const trend = computeTrend(records, metric, granularity, startDate, endDate)
    const distribution = computeDistribution(records, metric, startDate, endDate)
    const hasOverlap = detectOverlaps(records)

    return Response.json({
      kpi,
      trend,
      distribution,
      hasOverlap,
    })
  } catch (error) {
    console.error('Error fetching metrics data:', error)
    return Response.json(
      { error: 'Failed to fetch metrics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      siteId,
      waterUse,
      energyUse,
      carbonUse,
      measurementStart,
      measurementEnd,
      metadata,
    } = body

    if (
      !siteId ||
      waterUse === undefined ||
      energyUse === undefined ||
      carbonUse === undefined ||
      !measurementStart ||
      !measurementEnd
    ) {
      return Response.json(
        {
          error:
            'siteId, waterUse, energyUse, carbonUse, measurementStart, and measurementEnd are required',
        },
        { status: 400 }
      )
    }

    // Verify site exists
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site) {
      return Response.json({ error: 'Site not found' }, { status: 404 })
    }

    const record = await prisma.usageMetric.create({
      data: {
        siteId,
        waterUse: parseFloat(waterUse),
        energyUse: parseFloat(energyUse),
        carbonUse: parseFloat(carbonUse),
        measurementStart: new Date(measurementStart),
        measurementEnd: new Date(measurementEnd),
        metadata: metadata || undefined,
      },
    })

    return Response.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating metrics data:', error)
    return Response.json(
      { error: 'Failed to create metrics data' },
      { status: 500 }
    )
  }
}
