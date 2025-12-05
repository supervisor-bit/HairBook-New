import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'Zadejte heslo' },
        { status: 400 }
      )
    }
    
    // Get the user
    const user = await prisma.user.findFirst()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Uživatel neexistuje' },
        { status: 404 }
      )
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Nesprávné heslo' },
        { status: 401 }
      )
    }
    
    // Create response with auth cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Chyba při přihlašování' },
      { status: 500 }
    )
  }
}
