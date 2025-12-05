import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const groups = await prisma.clientGroup.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    })
    return NextResponse.json(groups)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()
    
    const maxOrder = await prisma.clientGroup.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    
    const group = await prisma.clientGroup.create({
      data: {
        name,
        order: (maxOrder?.order ?? 0) + 1,
      },
    })
    
    return NextResponse.json(group)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
