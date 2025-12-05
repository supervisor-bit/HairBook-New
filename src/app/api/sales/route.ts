import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, clientId, note, type = 'SALE', totalPrice } = body

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['SALE', 'USAGE'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

    // Process all items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const movements: any[] = []
      const homeProducts: any[] = []
      
      // Generate unique purchaseId for grouping products
      const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        const { materialId, quantity } = item

        // Get material
        const material = await tx.material.findUnique({
          where: { id: materialId }
        })

        if (!material) {
          throw new Error(`Material ${materialId} not found`)
        }

        // Check stock
        if (material.stockQuantity < quantity) {
          throw new Error(`Insufficient stock for ${material.name}`)
        }

        // Update stock
        await tx.material.update({
          where: { id: materialId },
          data: {
            stockQuantity: material.stockQuantity - quantity
          }
        })

        // Create movement
        const movement = await tx.materialMovement.create({
          data: {
            materialId,
            type,
            quantity: -quantity,
            note: note || null,
            totalPrice: type === 'SALE' && totalPrice ? parseFloat(totalPrice) : null,
            clientId: clientId || null
          }
        })
        movements.push(movement)

        // If client is registered AND it's a SALE, create HomeProduct record
        if (clientId && type === 'SALE') {
          const homeProduct = await tx.homeProduct.create({
            data: {
              clientId,
              name: material.name,
              quantity, // Quantity in pieces (ks)
              packageSize: material.packageSize,
              originalUnit: material.unit,
              note: homeProducts.length === 0 ? (note || null) : null, // Only first created product
              purchaseId,
              // Only store totalPrice on the first created product
              totalPrice: homeProducts.length === 0 && totalPrice ? parseFloat(totalPrice) : null
            }
          })
          homeProducts.push(homeProduct)
        }
      }

      return { movements, homeProducts }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Sale error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process sale' },
      { status: 500 }
    )
  }
}

// Get sales history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const where: any = {
      type: {
        in: ['SALE', 'USAGE']
      }
    }

    if (clientId) {
      where.clientId = clientId
    }

    const sales = await prisma.materialMovement.findMany({
      where,
      include: {
        material: {
          include: {
            group: true
          }
        },
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}
