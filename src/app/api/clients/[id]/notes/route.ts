import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notes = await prisma.clientNote.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { note } = await request.json()
    
    const clientNote = await prisma.clientNote.create({
      data: {
        clientId: id,
        note,
      },
    })
    
    return NextResponse.json(clientNote)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
