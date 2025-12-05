import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { quantity, type, note } = await request.json()
    
    // Update stock
    await prisma.material.update({
      where: { id },
      data: {
        stockQuantity: {
          [type === 'in' ? 'increment' : 'decrement']: parseFloat(quantity),
        },
      },
    })
    
    // Create movement
    const movement = await prisma.materialMovement.create({
      data: {
        materialId: id,
        type,
        quantity: parseFloat(quantity),
        note,
      },
    })
    
    return NextResponse.json(movement)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
