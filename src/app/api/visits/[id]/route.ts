import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        client: true,
        services: {
          include: {
            service: true,
            materials: {
              include: {
                material: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    
    return NextResponse.json(visit)
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
    const { note, totalPrice } = await request.json()
    
    const visit = await prisma.visit.update({
      where: { id },
      data: {
        note,
        totalPrice,
      },
    })
    
    return NextResponse.json(visit)
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
    
    // Smazat návštěvu - cascade smaže i visit_services a visit_materials
    // Sklad materiálů se nedotýká - materiály byly buď odepsané (closed) nebo nebyly (saved)
    await prisma.visit.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting visit:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
