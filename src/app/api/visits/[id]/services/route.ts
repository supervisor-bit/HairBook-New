import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { serviceId } = await request.json()
    
    // Get max order
    const maxOrder = await prisma.visitService.findFirst({
      where: { visitId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    
    const visitService = await prisma.visitService.create({
      data: {
        visitId: id,
        serviceId,
        order: (maxOrder?.order ?? 0) + 1,
      },
      include: {
        service: true,
        materials: {
          include: {
            material: true,
          },
        },
      },
    })
    
    return NextResponse.json(visitService)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
