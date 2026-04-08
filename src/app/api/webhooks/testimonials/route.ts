import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Webhook secret for security - reads from .env file
const WEBHOOK_SECRET = process.env.TESTIMONIALS_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify the webhook secret
    if (!WEBHOOK_SECRET) {
      console.error('❌ TESTIMONIALS_WEBHOOK_SECRET not configured in .env')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Parse "Name, Grade and School" field (e.g., "John Doe, 8th grade, Example School")
    const parseNameGradeSchool = (text: string) => {
      const parts = text.split(',').map(s => s.trim())
      return {
        name: parts[0] || null,
        grade: parts[1] || null,
        school: parts[2] || null,
      }
    }

    const nameGradeSchool = data['Name, Grade and School'] 
      ? parseNameGradeSchool(data['Name, Grade and School'])
      : { name: null, grade: null, school: null }

    // Map Google Form fields to database fields
    const testimonialData = {
      studentName: nameGradeSchool.name,
      authorName: nameGradeSchool.name, // Same as student name since form doesn't separate
      authorType: 'student', // Can be updated based on content analysis
      content: data['How would you describe your experience with your ACHARYA tutor(s)/mentor(s) ?\nWhat stands out most about their teaching or mentoring style?'] || null,
      grade: nameGradeSchool.grade,
      school: nameGradeSchool.school,
      programs: (() => {
        const programField = data['Program(s) enrolled (Select all that apply)']
        if (!programField) return []
        if (Array.isArray(programField)) return programField
        return programField.split(',').map((p: string) => p.trim())
      })(),
      rating: data['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) '] 
        ? parseInt(data['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) '])
        : null,
      beforeAfterExpectations: data['Before : What were your expectations when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\n\nAfter: What changes did you notice after joining and how has ACHARYA made a difference with your (your child\'s future plans) ?'] || null,
      successStory: data['Please share a specific success story or milestone achieved with the help of ACHARYA.'] || null,
      consentToFeature: data['May we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? '] === 'Yes',
      experienceDescription: null,
      videoLink: null,
      isApproved: false, // New testimonials need approval
      isVisible: true,
      updatedAt: new Date(),
      submittedAt: data.Timestamp ? new Date(data.Timestamp) : new Date(),
    }

    // Try to find student by name if provided
    if (nameGradeSchool.name) {
      const student = await prisma.student.findFirst({
        where: { 
          name: { contains: nameGradeSchool.name, mode: 'insensitive' }
        },
      })
      if (student) {
        ;(testimonialData as any).studentId = student.id
      }
    }

    // Create the testimonial
    const testimonial = await prisma.testimonial.create({
      data: testimonialData,
    })

    console.log('✅ Testimonial created:', testimonial.id)

    return NextResponse.json({
      success: true,
      testimonialId: testimonial.id,
      message: 'Testimonial saved successfully',
    })
  } catch (error) {
    console.error('❌ Error saving testimonial:', error)
    return NextResponse.json(
      { error: 'Failed to save testimonial', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify the webhook is working
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    message: 'Testimonials webhook endpoint is ready',
    timestamp: new Date().toISOString(),
  })
}
