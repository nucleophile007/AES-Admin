import { checkAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { Client } from '@upstash/qstash'

// @ts-ignore - Prisma extension types
const db = prisma as any;

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

function normalizeUniqueTimes(times: unknown): string[] {
  if (!Array.isArray(times)) return []
  return Array.from(
    new Set(
      times
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b))
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Validate admin authentication
  const authResult = await checkAdminAuth()
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

    const reg = await db.webinarRegistration.findUnique({ where: { id: numId } })
    if (!reg) {
      return Response.json({ error: 'Registration not found' }, { status: 404 })
    }

    const adminEmail = authResult.session!.user!.email!

    // Use transaction to prevent race conditions
    await prisma.$transaction(async (tx: any) => {
      // Check current state of registration
      const currentReg = await tx.webinarRegistration.findUnique({ where: { id: numId } })
      if (!currentReg) {
        throw new Error('Registration not found during transaction')
      }

      // Only update if not already approved by this admin
      if (!currentReg.approved || currentReg.adminEmail !== adminEmail) {
        await tx.webinarRegistration.update({ 
          where: { id: numId }, 
          data: { 
            approved: true,
            adminEmail: adminEmail
          } 
        })
      }
    })

    // Remove the booked slot from availability
    const { date, time } = parsePreferred(reg.preferredTime)
    if (date && time) {
      // Only remove from availability if this registration wasn't already approved by this admin
      if (!reg.approved || reg.adminEmail !== adminEmail) {
        const days = await prisma.availabilityDay.findMany({
          where: {
            date,
            adminEmail
          },
          orderBy: { id: 'asc' }
        })

        if (days.length > 0) {
          const [keep, ...dupes] = days
          const mergedTimes = normalizeUniqueTimes(days.flatMap((d) => d.times as string[]))
          const nextTimes = mergedTimes.filter((t) => t !== time)

          if (nextTimes.length > 0) {
            await prisma.availabilityDay.update({
              where: { id: keep.id },
              data: { times: nextTimes }
            })

            if (dupes.length > 0) {
              await prisma.availabilityDay.deleteMany({
                where: { id: { in: dupes.map((d) => d.id) } }
              })
            }
          } else {
            await prisma.availabilityDay.deleteMany({
              where: {
                date,
                adminEmail
              }
            })
          }
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

    const updated = await db.webinarRegistration.findUnique({ where: { id: numId } })
    return Response.json({ 
      registration: updated,
      message: 'Registration approved successfully and notification email queued' 
    })
  } catch (error) {
    console.error('Error approving registration:', error)
    return Response.json({ error: 'Failed to approve registration' }, { status: 500 })
  }
}
