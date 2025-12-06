import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { groups, materials } = body

    // Vytvoření skupin
    const createdGroups = await Promise.all(
      groups.map((group: { name: string; order: number }) =>
        prisma.materialGroup.create({
          data: {
            name: group.name,
            order: group.order,
          },
        })
      )
    )

    // Vytvoření materiálů
    if (materials && materials.length > 0) {
      await Promise.all(
        materials.map((material: { name: string; groupId: string; unit: string; stock: number; price: number; minStock: number }) =>
          prisma.material.create({
            data: {
              name: material.name,
              groupId: material.groupId,
              unit: material.unit,
              stock: material.stock,
              price: material.price,
              minStock: material.minStock,
            },
          })
        )
      )
    }

    return NextResponse.json({ success: true, groups: createdGroups })
  } catch (error) {
    console.error('Error in bulk create:', error)
    return NextResponse.json({ error: 'Failed to create materials' }, { status: 500 })
  }
}
