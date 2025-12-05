import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        group: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    
    return NextResponse.json(material)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, groupId, unit, packageSize, stockQuantity } = await request.json()
    
    const material = await prisma.material.update({
      where: { id },
      data: {
        name,
        groupId,
        unit,
        packageSize: parseFloat(packageSize),
        stockQuantity: parseFloat(stockQuantity),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, groupId, unit, packageSize, minStock, isRetailProduct } = await request.json()
    
    const material = await prisma.material.update({
      where: { id },
      data: {
        name,
        groupId,
        unit,
        packageSize: parseFloat(packageSize),
        minStock: parseFloat(minStock) || 0,
        isRetailProduct,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id} = await params
    
    // Check if material has movements
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        _count: {
          select: { movements: true },
        },
      },
    })
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }
    
    if (material._count.movements > 0) {
      return NextResponse.json({ 
        error: `Nelze smazat produkt s ${material._count.movements} pohyby. Nejprve smažte všechny pohyby.` 
      }, { status: 400 })
    }
    
    await prisma.material.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
