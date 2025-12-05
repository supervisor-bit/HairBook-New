import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { productId } = await context.params

    // First, get the product to find its purchaseId
    const product = await prisma.homeProduct.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete all products with the same purchaseId (or just this one if no purchaseId)
    if (product.purchaseId) {
      await prisma.homeProduct.deleteMany({
        where: { purchaseId: product.purchaseId },
      })
    } else {
      await prisma.homeProduct.delete({
        where: { id: productId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting home product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
