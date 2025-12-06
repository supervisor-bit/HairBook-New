import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  try {
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ Žádný uživatel nenalezen')
      return
    }
    
    console.log('✅ Uživatel existuje')
    console.log('User ID:', user.id)
    console.log('Password hash:', user.password.substring(0, 20) + '...')
    
    // Test password
    const testPassword = 'admin123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    
    console.log(`\nTest heslo "${testPassword}":`, isValid ? '✅ PLATNÉ' : '❌ NEPLATNÉ')
    
    // Try to create a new hash for comparison
    const newHash = await bcrypt.hash(testPassword, 10)
    console.log('\nNový hash pro porovnání:', newHash.substring(0, 20) + '...')
    
  } catch (error) {
    console.error('❌ Chyba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()
