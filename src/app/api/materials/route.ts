import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get('groupId')
    
    const where = groupId && groupId !== 'all' ? { groupId } : {}
    
    const materials = await prisma.material.findMany({
      where,
      include: {
        group: true,
        _count: {
          select: { movements: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(materials)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, groupId, unit, packageSize, stockQuantity, minStock, isRetailProduct } = await request.json()
    
    const material = await prisma.material.create({
      data: {
        name,
        groupId,
        unit,
        packageSize: parseFloat(packageSize),
        stockQuantity: parseFloat(stockQuantity) || 0,
        minStock: parseFloat(minStock) || 0,
        isRetailProduct: isRetailProduct || false,
      },
      include: {
        group: true,
      },
    })
    
    return NextResponse.json(material)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
