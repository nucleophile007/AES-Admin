import { checkAdminAuth } from '@/lib/adminAuth'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { Client } from '@upstash/qstash'

const prisma = new PrismaClient()
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

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
    const existingReg = await prisma.webinarRegistration.findUnique({ where: { id: numId } })
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
    const transactionResult = await prisma.$transaction(async (tx) => {
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
    if (approved && !existingReg.approved && existingReg.preferredTime && existingReg.program) {
      const parts = existingReg.preferredTime.split(' at ')
      if (parts.length === 2) {
        const [date, time] = parts
        
        const day = await prisma.availabilityDay.findUnique({ 
          where: { 
            date_program_adminEmail: {
              date: date,
              program: existingReg.program,
              adminEmail: adminEmail
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
    }

    // If un-approving and it was approved before, add the time slot back to availability
    if (!approved && existingReg.approved && existingReg.preferredTime && existingReg.program && existingReg.adminEmail) {
      const parts = existingReg.preferredTime.split(' at ')
      if (parts.length === 2) {
        const [date, time] = parts
        // Use the admin email from the existing registration (who originally approved it)
        const originalAdminEmail = existingReg.adminEmail
        
        const day = await prisma.availabilityDay.findUnique({ 
          where: { 
            date_program_adminEmail: {
              date: date,
              program: existingReg.program,
              adminEmail: originalAdminEmail
            }
          } 
        })
        if (day) {
          const currentTimes = (day.times as string[]) || []
          if (!currentTimes.includes(time)) {
            await prisma.availabilityDay.update({ 
              where: { id: day.id }, 
              data: { times: [...currentTimes, time].sort() } 
            })
          }
        } else {
          // Use upsert to handle potential race conditions when creating availability
          await prisma.availabilityDay.upsert({
            where: {
              date_program_adminEmail: {
                date,
                program: existingReg.program,
                adminEmail: originalAdminEmail
              }
            },
            update: {
              times: [time]
            },
            create: { 
              date, 
              times: [time], 
              program: existingReg.program,
              adminEmail: originalAdminEmail
            }
          })
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
