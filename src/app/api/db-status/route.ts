import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// @ts-ignore - Prisma extension types issue
const db = prisma as any

// GET /api/db-status
export async function GET(request: NextRequest) {
  try {
    // Try to execute a simple query to check if the database is connected
    const adminCount = await db.admin.count();
    const sessionApprovalsCount = await db.sessionApproval.count();
    
    // Try to check if our new models exist by querying them
    let teachersStatus = "N/A";
    let studentsStatus = "N/A";
    
    try {
      await db.teacher.count();
      teachersStatus = "Available";
    } catch (error) {
      teachersStatus = "Not Available";
    }
    
    try {
      await db.student.count();
      studentsStatus = "Available";
    } catch (error) {
      studentsStatus = "Not Available";
    }
    
    return NextResponse.json({
      status: "Connected",
      models: {
        admin: `Available (${adminCount} records)`,
        sessionApproval: `Available (${sessionApprovalsCount} records)`,
        teacher: teachersStatus,
        student: studentsStatus,
      },
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      status: "Error",
      message: "Failed to connect to database",
      error: String(error),
    }, { status: 500 });
  }
}