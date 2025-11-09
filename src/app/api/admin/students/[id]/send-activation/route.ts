import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"

// POST /api/admin/students/[id]/send-activation
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
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id }
    })
    
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }
    
    // Create a secure activation token
    const activationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15) +
                           Date.now().toString(36);
    
    // Create or update activation request
    try {
      const activationRequest = await prisma.activationRequest.upsert({
        where: { 
          email_role: {
            email,
            role: "STUDENT"
          }
        },
        update: {
          token: activationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          isUsed: false
        },
        create: {
          email,
          role: "STUDENT",
          token: activationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          userId: student.id
        }
      });
      
      console.log("Created activation request:", activationRequest.id);
    } catch (dbError) {
      console.error("Failed to create activation request:", dbError);
      return NextResponse.json({ 
        error: "Database error creating activation request", 
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }
    
    // Determine the base URL for API calls - prefer request host for internal calls
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3001";
    
    console.log("Sending activation email via:", `${baseUrl}/api/jobs/send-activation-email`);
    
    // Send the email via our email API route
    try {
      const emailRes = await fetch(`${baseUrl}/api/jobs/send-activation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          name: student.name,
          token: activationToken,
          role: "STUDENT"
        })
      });
      
      // Safe response handling
      let emailResult;
      if (!emailRes.ok) {
        try {
          const errorText = await emailRes.text();
          emailResult = errorText ? JSON.parse(errorText) : { error: `Email service failed with status: ${emailRes.status}` };
        } catch (parseError) {
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          throw new Error(`Email service failed with status: ${emailRes.status}. Response parsing error: ${errorMessage}`);
        }
        
        throw new Error(emailResult.error || emailResult.details || `Email service failed with status: ${emailRes.status}`);
      }
      
      try {
        const responseText = await emailRes.text();
        emailResult = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        console.warn("Warning: Could not parse email service response as JSON:", errorMessage);
        emailResult = { 
          success: true, 
          warning: "Response could not be parsed as JSON",
          dev: process.env.NODE_ENV !== 'production'
        };
      }
      
      // Update student's activation status
      await prisma.student.update({
        where: { id },
        data: { isActivated: false } // Mark as pending activation
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Activation email sent successfully", 
        emailId: emailResult.messageId,
        devMode: emailResult.dev === true,
        activationLink: emailResult.dev ? emailResult.activationLink : undefined
      }, { status: 200 });
    } catch (emailError) {
      console.error("Failed to send activation email:", emailError);
      return NextResponse.json({ 
        error: "Failed to send activation email", 
        details: emailError instanceof Error ? emailError.message : String(emailError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Failed to process activation request:", error);
    return NextResponse.json({ 
      error: "Failed to process activation request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}