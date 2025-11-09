import { NextRequest, NextResponse } from "next/server"

// This is a test endpoint to verify the activation email API is working
// GET /api/test-activation-email
export async function GET(request: NextRequest) {
  try {
    // Determine base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (request.headers.get("host") ? 
                    `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}` : 
                    "http://localhost:3000");
    
    // Create test activation data
    const testData = {
      email: "test@example.com",
      name: "Test User",
      token: `test-token-${Date.now()}`,
      role: "STUDENT"
    };
    
    // Call the activation email API
    const emailResponse = await fetch(`${baseUrl}/api/jobs/send-activation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    // Get response as text first to avoid JSON parse errors
    const responseText = await emailResponse.text();
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        success: false,
        status: emailResponse.status,
        error: "Failed to parse response as JSON",
        rawResponse: responseText.substring(0, 1000), // Limit response size
      }, { status: 500 });
    }
    
    // Return test results
    return NextResponse.json({
      success: emailResponse.ok,
      status: emailResponse.status,
      testData,
      response: responseData,
    });
  } catch (error) {
    console.error("Error testing activation email:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}