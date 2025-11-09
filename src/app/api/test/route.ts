import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Try a simple query to test connection
    const count = await prisma.$queryRaw`SELECT 1 as result`;
    
    return NextResponse.json({ 
      status: "ok", 
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
      result: count
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to connect to database",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}