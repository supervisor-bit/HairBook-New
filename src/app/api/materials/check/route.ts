import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const materialsCount = await prisma.material.count()
    const groupsCount = await prisma.materialGroup.count()
    
    return NextResponse.json({
      hasMaterials: materialsCount > 0,
      hasGroups: groupsCount > 0,
      materialsCount,
      groupsCount,
    })
  } catch (error) {
    console.error('Error checking materials:', error)
    return NextResponse.json({ error: 'Failed to check materials' }, { status: 500 })
  }
}
