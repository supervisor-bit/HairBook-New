import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, clientId, note } = body

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      )
    }

    // Process sale in transaction
    const result = await prisma.$transaction(async (tx) => {
      const movements = []
      const homeProducts = []

      for (const item of items) {
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
            type: 'SALE',
            quantity: -quantity,
            note: note || null,
            clientId: clientId || null
          }
        })
        movements.push(movement)

        // If client is registered, create HomeProduct record
        if (clientId) {
          const homeProduct = await tx.homeProduct.create({
            data: {
              clientId,
              name: material.name,
              quantity,
              unit: material.unit,
              note: note || null
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
      type: 'SALE'
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
