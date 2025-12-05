import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Načíst původní návštěvu
    const originalVisit = await prisma.visit.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            materials: true,
          },
        },
      },
    })
    
    if (!originalVisit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    
    // Vytvořit duplikát návštěvy jako uložená (saved), ne uzavřená
    const duplicatedVisit = await prisma.visit.create({
      data: {
        clientId: originalVisit.clientId,
        note: originalVisit.note,
        status: 'saved', // Vždy saved, i když originál byl closed
        services: {
          create: originalVisit.services.map((service: any) => ({
            serviceId: service.serviceId,
            materials: {
              create: service.materials.map((material: any) => ({
                materialId: material.materialId,
                quantity: material.quantity,
              })),
            },
          })),
        },
      },
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
    })
    
    return NextResponse.json(duplicatedVisit)
  } catch (error) {
    console.error('Error duplicating visit:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
