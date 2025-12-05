import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()
    
    const updateData: {
      status: string
      orderedAt?: Date
      deliveredAt?: Date
    } = { status }
    
    // Set timestamps based on status
    if (status === 'ordered') {
      updateData.orderedAt = new Date()
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date()
      
      // Add materials to stock when order is delivered
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      })
      
      if (order) {
        for (const item of order.items) {
          // Update material stock
          await prisma.material.update({
            where: { id: item.materialId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          })
          
          // Create material movement
          await prisma.materialMovement.create({
            data: {
              materialId: item.materialId,
              type: 'in',
              quantity: item.quantity,
              note: `Objednávka doručena`,
            },
          })
        }
      }
    }
    
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            material: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    })
    
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.order.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
