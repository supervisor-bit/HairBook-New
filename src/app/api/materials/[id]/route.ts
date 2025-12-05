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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.material.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
