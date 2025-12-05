import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { serviceId } = await params
    const { materialId, quantity, unit } = await request.json()
    
    const visitMaterial = await prisma.visitMaterial.create({
      data: {
        visitServiceId: serviceId,
        materialId,
        quantity,
        unit,
      },
      include: {
        material: {
          include: {
            group: true,
          },
        },
      },
    })
    
    return NextResponse.json(visitMaterial)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
