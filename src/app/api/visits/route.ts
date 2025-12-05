import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }
    
    const visits = await prisma.visit.findMany({
      where: {
        clientId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json(visits)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId } = await request.json()
    
    const visit = await prisma.visit.create({
      data: {
        clientId,
        status: 'saved',
      },
    })
    
    return NextResponse.json(visit)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
