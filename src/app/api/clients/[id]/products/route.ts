import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const products = await prisma.homeProduct.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching home products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { productName, quantity, unit, note } = body

    const product = await prisma.homeProduct.create({
      data: {
        clientId: id,
        productName,
        quantity: parseFloat(quantity),
        unit,
        note: note || null,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating home product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
