import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name } = await request.json()
    
    const group = await prisma.clientGroup.update({
      where: { id },
      data: { name },
    })
    
    return NextResponse.json(group)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if group is system group
    const group = await prisma.clientGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    })
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }
    
    if (group.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system group' }, { status: 400 })
    }
    
    if (group._count.clients > 0) {
      return NextResponse.json({ error: 'Cannot delete group with clients' }, { status: 400 })
    }
    
    await prisma.clientGroup.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
