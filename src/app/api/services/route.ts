import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const groups = await prisma.serviceGroup.findMany({
      orderBy: { order: 'asc' },
      include: {
        services: {
          orderBy: { order: 'asc' },
        },
      },
    })
    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
