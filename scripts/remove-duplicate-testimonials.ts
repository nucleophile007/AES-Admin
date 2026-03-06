import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

/**
 * Script to remove duplicate testimonials
 * Keeps the oldest entry for each unique (studentName + content) combination
 */

async function removeDuplicates() {
  try {
    console.log('🔍 Finding duplicate testimonials...\n')

    // Get all testimonials
    const allTestimonials = await prisma.testimonial.findMany({
      orderBy: { id: 'asc' }, // Keep oldest entries
    })

    console.log(`📊 Total testimonials: ${allTestimonials.length}`)

    // Group by studentName + content
    const groups = new Map<string, typeof allTestimonials>()
    
    for (const testimonial of allTestimonials) {
      const key = `${testimonial.studentName}|||${testimonial.content}`
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(testimonial)
    }

    // Find duplicates
    let duplicateCount = 0
    const idsToDelete: number[] = []

    for (const [key, group] of groups.entries()) {
      if (group.length > 1) {
        const [studentName] = key.split('|||')
        console.log(`\n🔄 Found ${group.length} copies of testimonial by ${studentName}`)
        
        // Keep the first one (oldest), delete the rest
        const [keep, ...remove] = group
        
        console.log(`   ✅ Keeping ID ${keep.id} (created: ${keep.createdAt})`)
        
        for (const duplicate of remove) {
          console.log(`   ❌ Will delete ID ${duplicate.id} (created: ${duplicate.createdAt})`)
          idsToDelete.push(duplicate.id)
          duplicateCount++
        }
      }
    }

    if (idsToDelete.length === 0) {
      console.log('\n✨ No duplicates found!')
      return
    }

    console.log(`\n⚠️  Found ${duplicateCount} duplicate(s) to remove`)
    console.log(`📝 Unique testimonials: ${groups.size}`)
    
    // Delete duplicates
    const result = await prisma.testimonial.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    })

    console.log(`\n✅ Deleted ${result.count} duplicate testimonials`)
    console.log(`📊 Remaining testimonials: ${allTestimonials.length - result.count}`)
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error)
    throw error
  }
}

// Run the cleanup
removeDuplicates()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Script failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
