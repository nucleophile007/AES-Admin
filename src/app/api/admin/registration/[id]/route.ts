import { checkAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { Client } from '@upstash/qstash'

// @ts-ignore - Prisma extension types
const db = prisma as any;

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

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

export async function PATCH(
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

    const body = await req.json()
    const { approved } = body

    if (typeof approved !== 'boolean') {
      return Response.json({ error: 'approved field must be a boolean' }, { status: 400 })
    }

    // Check if registration exists
    const existingReg = await db.webinarRegistration.findUnique({ where: { id: numId } })
    if (!existingReg) {
      return Response.json({ error: 'Registration not found' }, { status: 404 })
    }

    const adminEmail = authResult.session!.user!.email!

    // Authorization check: Only the admin who approved can un-approve
    if (!approved && existingReg.approved && existingReg.adminEmail !== adminEmail) {
      return Response.json({ 
        error: 'Only the admin who approved this registration can remove the approval' 
      }, { status: 403 })
    }

    // Use transaction to prevent race conditions
    const transactionResult = await prisma.$transaction(async (tx: any) => {
      // Check if registration still exists and hasn't been modified
      const currentReg = await tx.webinarRegistration.findUnique({ where: { id: numId } })
      if (!currentReg) {
        throw new Error('Registration not found during transaction')
      }

      // Update the registration
      const updated = await tx.webinarRegistration.update({
        where: { id: numId },
        data: { 
          approved,
          adminEmail: approved ? adminEmail : null
        }
      })

      return updated
    })

    const updatedReg = transactionResult

    // If approving and it wasn't approved before, remove the time slot from availability
    if (approved && !existingReg.approved && existingReg.preferredTime) {
      const parts = existingReg.preferredTime.split(' at ')
      if (parts.length === 2) {
        const [date, time] = parts
        
        const days = await prisma.availabilityDay.findMany({
          where: {
            date: date,
            adminEmail: adminEmail
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

    // If un-approving and it was approved before, add the time slot back to availability
    if (!approved && existingReg.approved && existingReg.preferredTime && existingReg.adminEmail) {
      const parts = existingReg.preferredTime.split(' at ')
      if (parts.length === 2) {
        const [date, time] = parts
        // Use the admin email from the existing registration (who originally approved it)
        const originalAdminEmail = existingReg.adminEmail
        
        const days = await prisma.availabilityDay.findMany({
          where: {
            date: date,
            adminEmail: originalAdminEmail
          },
          orderBy: { id: 'asc' }
        })

        if (days.length === 0) {
          await prisma.availabilityDay.create({
            data: {
              date,
              times: [time],
              adminEmail: originalAdminEmail
            }
          })
        } else {
          const [keep, ...dupes] = days
          const mergedTimes = normalizeUniqueTimes([
            ...days.flatMap((d) => d.times as string[]),
            time
          ])

          await prisma.availabilityDay.update({
            where: { id: keep.id },
            data: { times: mergedTimes }
          })

          if (dupes.length > 0) {
            await prisma.availabilityDay.deleteMany({
              where: { id: { in: dupes.map((d) => d.id) } }
            })
          }
        }
      }
    }

    // If approving for the first time, send approval email via QStash
    if (approved && !existingReg.approved) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await qstash.publishJSON({
          url: `${baseUrl}/api/jobs/send-approval-email`,
          body: {
            parentEmail: updatedReg.parentEmail,
            parentName: updatedReg.parentName,
            studentName: updatedReg.studentName,
            program: updatedReg.program,
            preferredTime: updatedReg.preferredTime,
          },
        })
        console.log('Approval email queued for:', updatedReg.parentEmail)
      } catch (emailError) {
        console.error('Failed to queue approval email:', emailError)
        // Don't fail the approval if email fails
      }
    }

    return Response.json({ 
      registration: updatedReg,
      message: approved 
        ? (existingReg.approved ? 'Registration approved successfully' : 'Registration approved successfully and notification email queued')
        : 'Registration approval removed'
    })
  } catch (error) {
    console.error('Error updating registration:', error)
    return Response.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}
