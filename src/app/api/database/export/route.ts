import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 })
    }

    // Read the database file
    const dbBuffer = fs.readFileSync(dbPath)
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const filename = `hairbook-backup-${timestamp}.db`

    // Return the file as download
    return new NextResponse(dbBuffer, {
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': dbBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
