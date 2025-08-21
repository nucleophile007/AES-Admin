import { validateAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { Client } from '@upstash/qstash'

const prisma = new PrismaClient()

// Initialize QStash client
const qstash = process.env.QSTASH_TOKEN ? new Client({
  token: process.env.QSTASH_TOKEN,
}) : null

function parsePreferred(preferredTime: string): { date: string | null; time: string | null } {
  if (!preferredTime) return { date: null, time: null }
  const parts = preferredTime.split(' at ')
  if (parts.length !== 2) return { date: null, time: null }
  const [date, time] = parts
  return { date, time }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Validate admin authentication
  const authResult = await validateAdminAuth()
  if (!authResult.success) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.statusCode || 403 }
    )
  }

  try {
    const { id } = await context.params
    const numId = Number(id)
    if (Number.isNaN(numId)) {
      return Response.json({ error: 'Invalid registration ID' }, { status: 400 })
    }

    const reg = await prisma.webinarRegistration.findUnique({ where: { id: numId } })
    if (!reg) {
      return Response.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (!reg.approved) {
      await prisma.webinarRegistration.update({ 
        where: { id: numId }, 
        data: { approved: true } 
      })
    }

    // Remove the booked slot from availability
    const { date, time } = parsePreferred(reg.preferredTime)
    if (date && time && reg.program) {
      const day = await prisma.availabilityDay.findUnique({ 
        where: { 
          date_program: {
            date: date,
            program: reg.program
          }
        } 
      })
      if (day) {
        const currentTimes = (day.times as string[]) || []
        const nextTimes = currentTimes.filter((t) => t !== time)
        if (nextTimes.length > 0) {
          await prisma.availabilityDay.update({ 
            where: { id: day.id }, 
            data: { times: nextTimes } 
          })
        } else {
          await prisma.availabilityDay.delete({ where: { id: day.id } })
        }
      }
    }

    // Send approval email via QStash
    try {
      if (qstash) {
        const emailJobUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-approval-email`
        
        await qstash.publishJSON({
          url: emailJobUrl,
          body: {
            parentEmail: reg.parentEmail,
            parentName: reg.parentName,
            studentName: reg.studentName,
            program: reg.program,
            preferredTime: reg.preferredTime,
          },
        })

        console.log('Approval email job queued successfully for:', reg.parentEmail)
      } else {
        console.log('QStash not configured - skipping email notification')
      }
    } catch (emailError) {
      console.error('Failed to enqueue approval email:', emailError)
      // Don't fail the approval if email fails - log it for admin attention
    }

    const updated = await prisma.webinarRegistration.findUnique({ where: { id: numId } })
    return Response.json({ 
      registration: updated,
      message: 'Registration approved successfully and notification email queued' 
    })
  } catch (error) {
    console.error('Error approving registration:', error)
    return Response.json({ error: 'Failed to approve registration' }, { status: 500 })
  }
}
