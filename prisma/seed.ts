import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Check if database is already seeded
  const existingUser = await prisma.user.findFirst()
  if (existingUser) {
    console.log('⚠ Database already seeded, skipping...')
    return
  }

  // Create user
  const hashedPassword = await bcrypt.hash('admin', 10)
  await prisma.user.create({
    data: {
      password: hashedPassword,
    },
  })
  console.log('✓ User created (password: admin)')

  // Create client groups
  const groupAll = await prisma.clientGroup.create({
    data: { name: 'Všichni', isSystem: true, order: 0 },
  })
  const groupVIP = await prisma.clientGroup.create({
    data: { name: 'VIP', isSystem: true, order: 1 },
  })
  const groupNew = await prisma.clientGroup.create({
    data: { name: 'Noví', isSystem: true, order: 2 },
  })
  const groupRegular = await prisma.clientGroup.create({
    data: { name: 'Stálí', isSystem: true, order: 3 },
  })
  console.log('✓ Client groups created')

  // Create material groups
  const groupColors = await prisma.materialGroup.create({
    data: { name: 'Barvy', order: 0 },
  })
  const groupShampoos = await prisma.materialGroup.create({
    data: { name: 'Šampony', order: 1 },
  })
  const groupStyling = await prisma.materialGroup.create({
    data: { name: 'Styling', order: 2 },
  })
  console.log('✓ Material groups created')

  // Create materials
  await prisma.material.createMany({
    data: [
      // L'Oréal Professionnel Barvy
      {
        name: 'L\'Oréal Professionnel INOA 6.0',
        groupId: groupColors.id,
        unit: 'g',
        packageSize: 60,
        stockQuantity: 12,
      },
      {
        name: 'L\'Oréal Professionnel INOA 7.1',
        groupId: groupColors.id,
        unit: 'g',
        packageSize: 60,
        stockQuantity: 10,
      },
      {
        name: 'L\'Oréal Professionnel INOA 8.0',
        groupId: groupColors.id,
        unit: 'g',
        packageSize: 60,
        stockQuantity: 8,
      },
      {
        name: 'L\'Oréal Professionnel INOA 9.1',
        groupId: groupColors.id,
        unit: 'g',
        packageSize: 60,
        stockQuantity: 6,
      },
      {
        name: 'L\'Oréal Professionnel INOA Oxidant 6%',
        groupId: groupColors.id,
        unit: 'ml',
        packageSize: 1000,
        stockQuantity: 8,
      },
      {
        name: 'L\'Oréal Professionnel INOA Oxidant 9%',
        groupId: groupColors.id,
        unit: 'ml',
        packageSize: 1000,
        stockQuantity: 5,
      },
      // L'Oréal Professionnel Šampony
      {
        name: 'L\'Oréal Professionnel Serie Expert Vitamino Color',
        groupId: groupShampoos.id,
        unit: 'ml',
        packageSize: 500,
        stockQuantity: 15,
        isRetailProduct: true,
      },
      {
        name: 'L\'Oréal Professionnel Serie Expert Absolut Repair',
        groupId: groupShampoos.id,
        unit: 'ml',
        packageSize: 500,
        stockQuantity: 12,
        isRetailProduct: true,
      },
      {
        name: 'L\'Oréal Professionnel Serie Expert Silver',
        groupId: groupShampoos.id,
        unit: 'ml',
        packageSize: 500,
        stockQuantity: 8,
        isRetailProduct: true,
      },
      {
        name: 'L\'Oréal Professionnel Serie Expert Curl Expression',
        groupId: groupShampoos.id,
        unit: 'ml',
        packageSize: 500,
        stockQuantity: 10,
      },
      // L'Oréal Professionnel Styling
      {
        name: 'L\'Oréal Professionnel Tecni.Art Fix Max',
        groupId: groupStyling.id,
        unit: 'ml',
        packageSize: 400,
        stockQuantity: 14,
        isRetailProduct: true,
      },
      {
        name: 'L\'Oréal Professionnel Tecni.Art Volume Lift',
        groupId: groupStyling.id,
        unit: 'ml',
        packageSize: 250,
        stockQuantity: 9,
        isRetailProduct: true,
      },
      {
        name: 'L\'Oréal Professionnel Tecni.Art Pli',
        groupId: groupStyling.id,
        unit: 'ml',
        packageSize: 190,
        stockQuantity: 7,
      },
      {
        name: 'L\'Oréal Professionnel Tecni.Art Wild Stylers',
        groupId: groupStyling.id,
        unit: 'ml',
        packageSize: 150,
        stockQuantity: 11,
      },
      // Doplňky
      {
        name: 'Gumičky do vlasů',
        groupId: groupStyling.id,
        unit: 'ks',
        packageSize: 1,
        stockQuantity: 100,
      },
      {
        name: 'Sponky do vlasů',
        groupId: groupStyling.id,
        unit: 'ks',
        packageSize: 1,
        stockQuantity: 80,
      },
    ],
  })
  console.log('✓ Materials created')

  // Create service groups
  const groupHaircuts = await prisma.serviceGroup.create({
    data: { name: 'Stříhání', order: 0 },
  })
  const groupColoring = await prisma.serviceGroup.create({
    data: { name: 'Barvení', order: 1 },
  })
  const groupTreatments = await prisma.serviceGroup.create({
    data: { name: 'Ošetření', order: 2 },
  })
  console.log('✓ Service groups created')

  // Create services
  await prisma.service.createMany({
    data: [
      { name: 'Dámský střih', groupId: groupHaircuts.id, order: 0 },
      { name: 'Pánský střih', groupId: groupHaircuts.id, order: 1 },
      { name: 'Dětský střih', groupId: groupHaircuts.id, order: 2 },
      { name: 'Melír', groupId: groupColoring.id, order: 0 },
      { name: 'Barvení', groupId: groupColoring.id, order: 1 },
      { name: 'Tónování', groupId: groupColoring.id, order: 2 },
      { name: 'Regenerace vlasů', groupId: groupTreatments.id, order: 0 },
      { name: 'Keratinové ošetření', groupId: groupTreatments.id, order: 1 },
      { name: 'Hloubková hydratace', groupId: groupTreatments.id, order: 2 },
    ],
  })
  console.log('✓ Services created')

  // Create sample clients
  await prisma.client.createMany({
    data: [
      {
        firstName: 'Jana',
        lastName: 'Nováková',
        phone: '+420 777 123 456',
        avatar: 'JN',
        groupId: groupVIP.id,
      },
      {
        firstName: 'Petra',
        lastName: 'Svobodová',
        phone: '+420 606 789 012',
        avatar: 'PS',
        groupId: groupRegular.id,
      },
      {
        firstName: 'Eva',
        lastName: 'Dvořáková',
        phone: '+420 724 456 789',
        avatar: 'ED',
        groupId: groupNew.id,
      },
      {
        firstName: 'Marie',
        lastName: 'Procházková',
        phone: '+420 731 234 567',
        avatar: 'MP',
        groupId: groupRegular.id,
      },
      {
        firstName: 'Lucie',
        lastName: 'Černá',
        phone: '+420 608 345 678',
        avatar: 'LČ',
        groupId: groupVIP.id,
      },
    ],
  })
  console.log('✓ Sample clients created')

  // Get first client and some materials for adding sample products
  const firstClient = await prisma.client.findFirst()
  const shampooMaterial = await prisma.material.findFirst({
    where: { name: { contains: 'Oréal' } }
  })
  const stylingMaterial = await prisma.material.findFirst({
    where: { name: { contains: 'Fix Max' } }
  })
  
  if (firstClient && shampooMaterial && stylingMaterial) {
    await prisma.homeProduct.createMany({
      data: [
        {
          clientId: firstClient.id,
          materialId: shampooMaterial.id,
          quantity: 2,
          note: 'Pro barvené vlasy',
        },
        {
          clientId: firstClient.id,
          materialId: stylingMaterial.id,
          quantity: 1,
          note: 'Silná fixace',
        },
      ],
    })
    console.log('✓ Sample home products created')
  }

  console.log('\n🎉 Database seeded successfully!')
  // Create sample orders
  const allMaterials = await prisma.material.findMany()
  
  // Create a pending order with low stock items
  const lowStockMaterials = allMaterials.filter(m => m.stockQuantity < 10)
  if (lowStockMaterials.length > 0) {
    await prisma.order.create({
      data: {
        status: 'pending',
        note: 'Objednávka pro doplnění zásoby',
        totalPrice: 2500,
        items: {
          create: lowStockMaterials.slice(0, 3).map((material) => ({
            materialId: material.id,
            quantity: 5,
            price: material.unit === 'g' ? 150 : material.unit === 'ml' ? 200 : 100,
          })),
        },
      },
    })
  }

  // Create an ordered order
  await prisma.order.create({
    data: {
      status: 'ordered',
      note: 'Dodavatel: Beauty Supply CZ',
      totalPrice: 3800,
      orderedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      items: {
        create: [
          {
            materialId: allMaterials[0].id,
            quantity: 10,
            price: 180,
          },
          {
            materialId: allMaterials[1].id,
            quantity: 8,
            price: 200,
          },
        ],
      },
    },
  })

  // Create a delivered order
  await prisma.order.create({
    data: {
      status: 'delivered',
      note: 'Dodáno dne 1.12.2025',
      totalPrice: 4200,
      orderedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      items: {
        create: [
          {
            materialId: allMaterials[2].id,
            quantity: 15,
            price: 150,
          },
          {
            materialId: allMaterials[3].id,
            quantity: 12,
            price: 175,
          },
        ],
      },
    },
  })

  console.log('✓ Sample orders created')

  console.log('\nLogin credentials:')
  console.log('Password: admin')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
