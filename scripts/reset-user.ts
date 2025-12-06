import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetUser() {
  try {
    console.log('🔄 Mažu všechny uživatele...')
    await prisma.user.deleteMany()
    
    console.log('✅ Všichni uživatelé smazáni')
    console.log('👉 Nyní můžete jít na /setup a vytvořit nového uživatele')
    
    // Vytvoříme nového uživatele
    const newPassword = 'admin123' // ZMĚŇTE SI TO!
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    const user = await prisma.user.create({
      data: {
        password: hashedPassword,
      },
    })
    
    console.log('✅ Vytvořen nový uživatel')
    console.log('   Heslo: admin123')
    console.log('⚠️  ZMĚŇTE HESLO PO PŘIHLÁŠENÍ v Nastavení!')
    
  } catch (error) {
    console.error('❌ Chyba:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetUser()
