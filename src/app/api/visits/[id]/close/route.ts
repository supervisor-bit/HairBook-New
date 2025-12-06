import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { totalPrice, note } = await request.json()
    
    // Get visit with all materials
    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            materials: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    })
    
    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
    }
    
    // Update visit status
    const updatedVisit = await prisma.visit.update({
      where: { id },
      data: {
        status: 'closed',
        totalPrice,
        note,
        closedAt: new Date(),
      },
    })
    
    // Deduct materials from stock
    for (const service of visit.services) {
      for (const visitMaterial of service.materials) {
        const material = visitMaterial.material
        
        // Calculate packages to deduct
        let packagesToDeduct = 0
        
        if (material.unit === 'ks') {
          packagesToDeduct = visitMaterial.quantity
        } else {
          // For g or ml, calculate based on package size
          packagesToDeduct = visitMaterial.quantity / material.packageSize
        }
        
        // Update stock
        await prisma.material.update({
          where: { id: material.id },
          data: {
            stockQuantity: {
              decrement: packagesToDeduct,
            },
          },
        })
        
        // Create movement record
        await prisma.materialMovement.create({
          data: {
            materialId: material.id,
            type: 'VISIT',
            quantity: packagesToDeduct,
            visitId: visit.id,
            note: `Použito v návštěvě`,
          },
        })
      }
    }
    
    return NextResponse.json(updatedVisit)
  } catch (error) {
    console.error('Close visit error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
