import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; serviceId: string; materialId: string }> }
) {
  try {
    const { materialId } = await context.params
    const body = await request.json()
    const { quantity, unit } = body

    await prisma.visitMaterial.update({
      where: { id: materialId },
      data: {
        quantity,
        unit,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating visit material:', error)
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; serviceId: string; materialId: string }> }
) {
  try {
    const { materialId } = await context.params

    await prisma.visitMaterial.delete({
      where: { id: materialId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting visit material:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
