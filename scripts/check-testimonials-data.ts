import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function checkTestimonials() {
  try {
    console.log('Fetching testimonials from database...\n')
    
    const testimonials = await prisma.testimonial.findMany({
      take: 3,
      orderBy: {
        submittedAt: 'desc'
      }
    })

    if (testimonials.length === 0) {
      console.log('No testimonials found in database!')
      return
    }

    console.log(`Found ${testimonials.length} testimonials (showing first 3):\n`)
    
    testimonials.forEach((t, index) => {
      console.log(`\n=== Testimonial #${index + 1} (ID: ${t.id}) ===`)
      console.log('studentName:', t.studentName)
      console.log('authorName:', t.authorName)
      console.log('authorType:', t.authorType)
      console.log('grade:', t.grade)
      console.log('school:', t.school)
      console.log('programs:', t.programs)
      console.log('rating:', t.rating)
      console.log('content:', t.content?.substring(0, 100) + '...')
      console.log('beforeExpectations:', t.beforeExpectations?.substring(0, 100) + '...')
      console.log('successStory:', t.successStory?.substring(0, 100) + '...')
      console.log('consentToFeature:', t.consentToFeature)
      console.log('submittedAt:', t.submittedAt)
      console.log('isApproved:', t.isApproved)
      console.log('isVisible:', t.isVisible)
    })

    // Get count
    const count = await prisma.testimonial.count()
    console.log(`\n\nTotal testimonials in database: ${count}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTestimonials()
