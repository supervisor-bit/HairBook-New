import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Delete all data in correct order (respecting foreign key constraints)
    await prisma.visitMaterial.deleteMany()
    await prisma.visitProduct.deleteMany()
    await prisma.visitService.deleteMany()
    await prisma.visit.deleteMany()
    await prisma.clientNote.deleteMany()
    await prisma.homeProduct.deleteMany()
    await prisma.client.deleteMany()
    await prisma.clientGroup.deleteMany()
    await prisma.materialMovement.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.material.deleteMany()
    await prisma.materialGroup.deleteMany()
    await prisma.service.deleteMany()
    await prisma.serviceGroup.deleteMany()
    await prisma.salonSettings.deleteMany()
    
    // Reset user password to default
    const defaultPassword = await bcrypt.hash('admin', 10)
    await prisma.user.deleteMany()
    await prisma.user.create({
      data: {
        password: defaultPassword,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
