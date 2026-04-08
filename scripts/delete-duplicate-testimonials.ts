import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function deleteDuplicates() {
  try {
    console.log('🔍 Finding duplicate testimonials...\n')

    // Get all testimonials grouped by studentName and submittedAt
    const allTestimonials = await prisma.testimonial.findMany({
      orderBy: {
        id: 'asc'
      }
    })

    console.log(`Total testimonials: ${allTestimonials.length}`)

    // Group by unique key (studentName + submittedAt)
    const grouped = new Map<string, typeof allTestimonials>()
    
    for (const testimonial of allTestimonials) {
      const key = `${testimonial.studentName}_${testimonial.submittedAt?.toISOString()}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(testimonial)
    }

    // Find duplicates (groups with more than 1 entry)
    let deleteCount = 0
    for (const [key, testimonials] of grouped.entries()) {
      if (testimonials.length > 1) {
        // Keep the first one (lowest ID), delete the rest
        const toKeep = testimonials[0]
        const toDelete = testimonials.slice(1)
        
        console.log(`\n📝 Found ${testimonials.length} duplicates for: ${testimonials[0].studentName}`)
        console.log(`   Keeping ID: ${toKeep.id}`)
        console.log(`   Deleting IDs: ${toDelete.map(t => t.id).join(', ')}`)
        
        for (const testimonial of toDelete) {
          await prisma.testimonial.delete({
            where: { id: testimonial.id }
          })
          deleteCount++
        }
      }
    }

    console.log(`\n✅ Deleted ${deleteCount} duplicate testimonials`)
    console.log(`Remaining testimonials: ${allTestimonials.length - deleteCount}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteDuplicates()
