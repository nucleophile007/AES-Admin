import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// POST /api/admin/teachers/[id]/send-activation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin permissions
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !allowedEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    
    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id }
    })
    
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    
    // Create or find activation token
    const activationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15)
    
    // Create or update activation request
    await prisma.activationRequest.upsert({
      where: { 
        email_role: {
          email,
          role: "TEACHER"
        }
      },
      update: {
        token: activationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        isUsed: false
      },
      create: {
        email,
        role: "TEACHER",
        token: activationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        userId: teacher.id
      }
    })
    
    // Send the email directly via our email API route
    try {
      const emailRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/send-activation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name: teacher.name,
          token: activationToken,
          role: "TEACHER"
        })
      });
      
      if (!emailRes.ok) {
        const emailError = await emailRes.json();
        throw new Error(emailError.error || 'Email service failed');
      }
      
      const emailResult = await emailRes.json();
      return NextResponse.json({ 
        success: true, 
        message: "Activation email sent successfully", 
        emailId: emailResult.messageId 
      }, { status: 200 })
    } catch (emailError) {
      console.error("Failed to send activation email:", emailError);
      return NextResponse.json({ 
        error: "Failed to send activation email", 
        message: "Email service error"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Failed to send activation email:", error)
    return NextResponse.json({ error: "Failed to send activation email" }, { status: 500 })
  }
}