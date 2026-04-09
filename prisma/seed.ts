import { PrismaClient, SiteType } from '../generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ---------- Config ----------

interface SiteConfig {
  name: string
  type: SiteType
  cadence: 'weekly' | 'monthly'
  startDay: number // day-of-month that measurements begin
  energyRange: [number, number]
  waterRange: [number, number]
  carbonRange: [number, number]
  skipMonths?: number[] // 0-indexed months to skip (simulate gaps)
  overlapMonth?: number // 0-indexed month to create an overlap
}

const sites: SiteConfig[] = [
  {
    name: 'Jakarta HQ',
    type: 'OFFICE',
    cadence: 'monthly',
    startDay: 1,
    energyRange: [300, 600],
    waterRange: [80, 150],
    carbonRange: [15, 35],
  },
  {
    name: 'Bandung Office',
    type: 'OFFICE',
    cadence: 'monthly',
    startDay: 5,
    energyRange: [200, 450],
    waterRange: [60, 120],
    carbonRange: [10, 25],
    skipMonths: [3], // Skip April (gap)
  },
  {
    name: 'Surabaya Office',
    type: 'OFFICE',
    cadence: 'weekly',
    startDay: 1,
    energyRange: [50, 120],
    waterRange: [15, 35],
    carbonRange: [3, 8],
  },
  {
    name: 'Cikarang Plant',
    type: 'FACTORY',
    cadence: 'monthly',
    startDay: 1,
    energyRange: [800, 2000],
    waterRange: [200, 500],
    carbonRange: [40, 100],
    overlapMonth: 7, // August has an overlap
  },
  {
    name: 'Karawang Plant',
    type: 'FACTORY',
    cadence: 'monthly',
    startDay: 10,
    energyRange: [600, 1500],
    waterRange: [150, 400],
    carbonRange: [30, 80],
    skipMonths: [5, 10], // Skip June and November (gaps)
  },
  {
    name: 'Cibitung Warehouse',
    type: 'STORAGE',
    cadence: 'monthly',
    startDay: 1,
    energyRange: [100, 300],
    waterRange: [20, 60],
    carbonRange: [5, 15],
  },
  {
    name: 'Bekasi Depot',
    type: 'STORAGE',
    cadence: 'weekly',
    startDay: 3,
    energyRange: [30, 80],
    waterRange: [8, 25],
    carbonRange: [2, 6],
  },
  {
    name: 'Semarang Hub',
    type: 'OTHER',
    cadence: 'monthly',
    startDay: 15,
    energyRange: [150, 400],
    waterRange: [40, 100],
    carbonRange: [8, 20],
  },
]

// ---------- Helpers ----------

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

// ---------- Seed ----------

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.usageMetric.deleteMany()
  await prisma.site.deleteMany()

  const dataStart = new Date(Date.UTC(2025, 3, 1))  // April 2025
  const dataEnd = new Date(Date.UTC(2026, 2, 31))   // March 2026

  for (const config of sites) {
    // Create site
    const site = await prisma.site.create({
      data: {
        name: config.name,
        type: config.type,
      },
    })

    console.log(`  📍 Created site: ${site.name} (${site.type})`)

    const metrics: {
      siteId: string
      waterUse: number
      energyUse: number
      carbonUse: number
      measurementStart: Date
      measurementEnd: Date
    }[] = []

    if (config.cadence === 'monthly') {
      // Generate monthly measurements
      let cursor = new Date(Date.UTC(2025, 3, config.startDay)) // April 2025

      while (cursor < dataEnd) {
        const month = cursor.getUTCMonth()
        const year = cursor.getUTCFullYear()

        // Skip months with gaps
        if (config.skipMonths?.includes(month)) {
          cursor = addMonths(cursor, 1)
          continue
        }

        // Calculate measurement end (approx one month later)
        const daysInCurrentMonth = daysInMonth(year, month)
        const remainingDays = daysInCurrentMonth - cursor.getUTCDate() + 1
        const measurementEnd = addDays(cursor, Math.min(remainingDays, daysInCurrentMonth))

        // Add slight seasonal variation (winter months use more energy)
        const seasonFactor = month >= 5 && month <= 8 ? 1.15 : 0.95 // Jun-Sep higher

        metrics.push({
          siteId: site.id,
          energyUse: rand(config.energyRange[0] * seasonFactor, config.energyRange[1] * seasonFactor),
          waterUse: rand(config.waterRange[0], config.waterRange[1]),
          carbonUse: rand(config.carbonRange[0] * seasonFactor, config.carbonRange[1] * seasonFactor),
          measurementStart: new Date(cursor),
          measurementEnd,
        })

        // Create overlap record for specific month
        if (config.overlapMonth === month) {
          const overlapStart = addDays(cursor, 10)
          const overlapEnd = addDays(cursor, 20)
          metrics.push({
            siteId: site.id,
            energyUse: rand(config.energyRange[0] * 0.3, config.energyRange[1] * 0.3),
            waterUse: rand(config.waterRange[0] * 0.3, config.waterRange[1] * 0.3),
            carbonUse: rand(config.carbonRange[0] * 0.3, config.carbonRange[1] * 0.3),
            measurementStart: overlapStart,
            measurementEnd: overlapEnd,
          })
          console.log(`    ⚠️  Added overlap record for ${config.name} in month ${month}`)
        }

        cursor = addMonths(cursor, 1)
      }
    } else {
      // Weekly measurements
      let cursor = new Date(Date.UTC(2025, 3, config.startDay))

      while (cursor < dataEnd) {
        const month = cursor.getUTCMonth()

        // Skip some weeks randomly (~5% chance) to simulate gaps
        if (Math.random() < 0.05) {
          cursor = addDays(cursor, 7)
          continue
        }

        const measurementEnd = addDays(cursor, 7)

        const seasonFactor = month >= 5 && month <= 8 ? 1.15 : 0.95

        metrics.push({
          siteId: site.id,
          energyUse: rand(config.energyRange[0] * seasonFactor, config.energyRange[1] * seasonFactor),
          waterUse: rand(config.waterRange[0], config.waterRange[1]),
          carbonUse: rand(config.carbonRange[0] * seasonFactor, config.carbonRange[1] * seasonFactor),
          measurementStart: new Date(cursor),
          measurementEnd,
        })

        cursor = addDays(cursor, 7)
      }
    }

    // Bulk insert metrics for this site
    if (metrics.length > 0) {
      await prisma.usageMetric.createMany({ data: metrics })
      console.log(`    📊 Inserted ${metrics.length} usage metric records`)
    }
  }

  // Summary
  const siteCount = await prisma.site.count()
  const metricCount = await prisma.usageMetric.count()
  console.log(`\n✅ Seeding complete: ${siteCount} sites, ${metricCount} metric records`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
