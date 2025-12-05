import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({ needsSetup: userCount === 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: 'Heslo musí mít alespoň 4 znaky' },
        { status: 400 }
      )
    }
    
    // Check if setup is already done
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Aplikace je již nastavena' },
        { status: 400 }
      )
    }
    
    // Create user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        password: hashedPassword,
      },
    })
    
    // Create default client groups
    await prisma.clientGroup.createMany({
      data: [
        { name: 'Všichni', isSystem: true, order: 0 },
        { name: 'VIP', isSystem: true, order: 1 },
        { name: 'Noví', isSystem: true, order: 2 },
        { name: 'Stálí', isSystem: true, order: 3 },
      ],
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Chyba při vytváření uživatele' },
      { status: 500 }
    )
  }
}
