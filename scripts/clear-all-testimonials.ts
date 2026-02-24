import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllTestimonials() {
  try {
    console.log('🗑️  Clearing all testimonials...')
    
    const result = await prisma.testimonial.deleteMany({})
    
    console.log(`✅ Successfully deleted ${result.count} testimonials`)
  } catch (error) {
    console.error('❌ Error clearing testimonials:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearAllTestimonials()
  .then(() => {
    console.log('✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
