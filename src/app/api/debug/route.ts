import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const dbExists = fs.existsSync(dbPath)
    
    let userCount = 0
    let users = []
    let error = null
    
    try {
      userCount = await prisma.user.count()
      users = await prisma.user.findMany({
        select: {
          id: true,
          createdAt: true,
        }
      })
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    }
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      databasePath: dbPath,
      databaseExists: dbExists,
      databaseUrl: process.env.DATABASE_URL,
      userCount,
      users,
      error,
      cwd: process.cwd(),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
    }, { status: 500 })
  }
}
