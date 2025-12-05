import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        group: true,
        visits: {
          orderBy: { createdAt: 'desc' },
          include: {
            services: {
              include: {
                service: true,
                materials: {
                  include: {
                    material: true,
                  },
                },
              },
            },
          },
        },
        homeProducts: {
          orderBy: { createdAt: 'desc' },
          include: {
            material: {
              include: {
                group: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { visits: true },
        },
      },
    })
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { firstName, lastName, phone, groupId } = await request.json()
    
    const client = await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        groupId: groupId || null,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.client.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
