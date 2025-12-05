import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { productId } = await context.params

    await prisma.homeProduct.delete({
      where: { id: productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting home product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
