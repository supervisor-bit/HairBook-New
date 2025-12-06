import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()
    
    // Get user (there should be only one)
    const user = await prisma.user.findFirst()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Současné heslo je nesprávné' }, { status: 400 })
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
