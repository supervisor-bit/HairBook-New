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
    const { products, totalPrice, note } = body // products = array of {materialId, quantity}

    console.log('📦 API received:', { products, totalPrice, note, totalPriceType: typeof totalPrice })

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No products provided' },
        { status: 400 }
      )
    }

    // Validate all materials and stock
    for (const item of products) {
      const material = await prisma.material.findUnique({
        where: { id: item.materialId },
      })

      if (!material) {
        return NextResponse.json(
          { error: `Material not found: ${item.materialId}` },
          { status: 404 }
        )
      }

      if (material.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${material.name}` },
          { status: 400 }
        )
      }
    }

    // Generate unique purchaseId for this purchase
    const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create all products and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdProducts: any[] = []
      
      // Store totalPrice in first item for display purposes
      const parsedTotalPrice = totalPrice ? parseFloat(totalPrice) : null

      for (let i = 0; i < products.length; i++) {
        const item = products[i]
        
        // Get material info to store in HomeProduct
        const material = await tx.material.findUnique({
          where: { id: item.materialId },
        })
        
        if (!material) continue
        
        // Create home product with stored data (not relation)
        // Store totalPrice and note only on FIRST created product (not i===0 because order may vary)
        const product = await tx.homeProduct.create({
          data: {
            clientId: id,
            name: material.name,
            quantity: parseInt(item.quantity),
            packageSize: material.packageSize,
            originalUnit: material.unit,
            note: createdProducts.length === 0 ? (note || null) : null, // first created product
            purchaseId,
            totalPrice: createdProducts.length === 0 ? parsedTotalPrice : null, // first created product
          },
        })

        createdProducts.push(product)

        // Deduct from stock
        await tx.material.update({
          where: { id: item.materialId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        })

        // Create material movement record
        await tx.materialMovement.create({
          data: {
            materialId: item.materialId,
            type: 'SALE',
            quantity: -item.quantity,
            note: `Prodáno klientovi - ${item.quantity} ks`,
            clientId: id,
            totalPrice: i === 0 && totalPrice ? parseFloat(totalPrice) : null,
          },
        })
      }

      return createdProducts
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating home products:', error)
    return NextResponse.json(
      { error: 'Failed to create products' },
      { status: 500 }
    )
  }
}
