import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { quantity, type, note } = await request.json()
    
    // Determine if this is an increment or decrement
    const isIncrement = type === 'DELIVERY' || type === 'PURCHASE'
    const parsedQuantity = parseFloat(quantity)
    
    // Update stock
    await prisma.material.update({
      where: { id },
      data: {
        stockQuantity: {
          [isIncrement ? 'increment' : 'decrement']: parsedQuantity,
        },
      },
    })
    
    // Create movement (store negative quantity for decrements)
    const movement = await prisma.materialMovement.create({
      data: {
        materialId: id,
        type,
        quantity: isIncrement ? parsedQuantity : -parsedQuantity,
        note,
      },
    })
    
    return NextResponse.json(movement)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
