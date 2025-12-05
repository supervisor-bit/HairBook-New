import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json()
    
    const group = await prisma.clientGroup.update({
      where: { id: params.id },
      data: { name },
    })
    
    return NextResponse.json(group)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if group is system group
    const group = await prisma.clientGroup.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
