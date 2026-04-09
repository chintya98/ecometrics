import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search')

  const sites = await prisma.site.findMany({
    where: search
      ? {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        }
      : undefined,
    orderBy: { name: 'asc' },
  })

  return Response.json(sites)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type } = body

    if (!name || !type) {
      return Response.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    const validTypes = ['OFFICE', 'FACTORY', 'STORAGE', 'OTHER']
    if (!validTypes.includes(type)) {
      return Response.json(
        { error: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const site = await prisma.site.create({
      data: { name, type },
    })

    return Response.json(site, { status: 201 })
  } catch (error) {
    console.error('Error creating site:', error)
    return Response.json(
      { error: 'Failed to create site' },
      { status: 500 }
    )
  }
}
