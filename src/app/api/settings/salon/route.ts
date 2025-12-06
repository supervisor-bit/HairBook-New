import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first (and only) salon settings record
    let settings = await prisma.salonSettings.findFirst()
    
    // Create if doesn't exist
    if (!settings) {
      settings = await prisma.salonSettings.create({
        data: {},
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching salon settings:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Get existing settings
    let settings = await prisma.salonSettings.findFirst()
    
    if (settings) {
      // Update existing
      settings = await prisma.salonSettings.update({
        where: { id: settings.id },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          ico: data.ico,
          dic: data.dic,
        },
      })
    } else {
      // Create new
      settings = await prisma.salonSettings.create({
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          ico: data.ico,
          dic: data.dic,
        },
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error saving salon settings:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
