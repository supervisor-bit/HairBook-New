import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt received')
    const { password } = await request.json()
    
    if (!password) {
      console.log('Login failed: No password provided')
      return NextResponse.json(
        { error: 'Zadejte heslo' },
        { status: 400 }
      )
    }
    
    // Get the user
    console.log('Looking for user in database...')
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('Login failed: No user found in database')
      return NextResponse.json(
        { error: 'Uživatel neexistuje. Přejděte na /setup pro vytvoření účtu.' },
        { status: 404 }
      )
    }
    
    console.log('User found, verifying password...')
    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    
    if (!isValid) {
      console.log('Login failed: Invalid password')
      return NextResponse.json(
        { error: 'Nesprávné heslo' },
        { status: 401 }
      )
    }
    
    console.log('Password valid, setting cookie...')
    
    // Create response with auth cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: true, // Always use secure on Railway (HTTPS)
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    console.log('Login successful! Cookie set.')
    return response
  } catch (error) {
    console.error('Login error (full):', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { error: `Chyba při přihlašování: ${error instanceof Error ? error.message : 'Neznámá chyba'}` },
      { status: 500 }
    )
  }
}
