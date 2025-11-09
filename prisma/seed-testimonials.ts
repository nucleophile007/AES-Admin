import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding testimonials...')

  // First, let's get some existing students
  const students = await prisma.student.findMany({
    take: 5,
  })

  if (students.length === 0) {
    console.log('⚠️  No students found in database. Please add students first.')
    return
  }

  const testimonials = [
    {
      studentId: students[0].id,
      content: "AES has been an incredible experience for my child. The teachers are knowledgeable and supportive, and the curriculum is well-structured. We've seen significant improvement in understanding complex concepts.",
      authorType: "parent",
      authorName: students[0].parentName,
      isApproved: true,
    },
    {
      studentId: students[0].id,
      content: "I love learning with AES! The online classes are interactive and fun. My teacher explains everything clearly and is always ready to help. I've learned so much this year!",
      authorType: "student",
      authorName: students[0].name,
      isApproved: true,
    },
    ...(students.length > 1 ? [{
      studentId: students[1].id,
      content: "As a parent, I'm very impressed with the quality of education AES provides. The personalized attention my child receives has boosted their confidence and academic performance tremendously.",
      authorType: "parent",
      authorName: students[1].parentName,
      isApproved: false,
    }] : []),
    ...(students.length > 1 ? [{
      studentId: students[1].id,
      content: "The assignments are challenging but rewarding. I appreciate how the teachers encourage critical thinking and creativity. AES has helped me develop a genuine love for learning!",
      authorType: "student",
      authorName: students[1].name,
      isApproved: false,
    }] : []),
    ...(students.length > 2 ? [{
      studentId: students[2].id,
      content: "Excellent program! The flexibility of online learning combined with rigorous academic standards makes AES stand out. Our family is very satisfied with the progress we've seen.",
      authorType: "parent",
      authorName: students[2].parentName,
      isApproved: true,
    }] : []),
    ...(students.length > 3 ? [{
      studentId: students[3].id,
      content: "My experience with AES has been amazing. The teachers are passionate about teaching and make complex topics easy to understand. I feel well-prepared for future academic challenges.",
      authorType: "student",
      authorName: students[3].name,
      isApproved: false,
    }] : []),
    ...(students.length > 3 ? [{
      studentId: students[3].id,
      content: "The communication from teachers is prompt and helpful. We always know what our child is working on and how they're progressing. AES has exceeded our expectations!",
      authorType: "parent",
      authorName: students[3].parentName,
      isApproved: true,
    }] : []),
    ...(students.length > 4 ? [{
      studentId: students[4].id,
      content: "I was hesitant about online learning at first, but AES proved me wrong. The interactive sessions, quality resources, and supportive environment have made all the difference.",
      authorType: "parent",
      authorName: students[4].parentName,
      isApproved: false,
    }] : []),
  ]

  for (const testimonial of testimonials) {
    const created = await (prisma as any).testimonial.create({
      data: testimonial,
    })
    console.log(`✅ Created testimonial by ${created.authorName} (${created.authorType})`)
  }

  console.log(`\n🎉 Successfully seeded ${testimonials.length} testimonials!`)
  console.log(`   - Approved: ${testimonials.filter(t => t.isApproved).length}`)
  console.log(`   - Pending approval: ${testimonials.filter(t => !t.isApproved).length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding testimonials:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
