import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get('groupId')
    
    const where = groupId && groupId !== 'all' ? { groupId } : {}
    
    const clients = await prisma.client.findMany({
      where,
      include: {
        group: true,
        _count: {
          select: { visits: true },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    })
    
    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, phone, groupId, avatar } = await request.json()
    
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        phone,
        groupId: groupId || null,
        avatar: avatar || `${firstName[0]}${lastName[0]}`.toUpperCase(),
      },
      include: {
        group: true,
      },
    })
    
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
