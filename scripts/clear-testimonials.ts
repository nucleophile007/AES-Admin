import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function clearAndCount() {
  try {
    const count = await prisma.testimonial.count()
    console.log(`Current testimonials: ${count}`)
    
    console.log('\n⚠️  Deleting ALL testimonials...')
    const result = await prisma.testimonial.deleteMany({})
    console.log(`✅ Deleted ${result.count} testimonials`)
    
    console.log('\nDatabase is now clean. Run "npm run testimonials:sync" to re-import.')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAndCount()
