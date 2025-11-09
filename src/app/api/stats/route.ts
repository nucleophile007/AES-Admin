import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// @ts-ignore - Prisma extension types issue
const db = prisma as any

export async function GET() {
  try {
    // Get counts of various entities in the database
    const teacherCount = await db.teacher.count();
    const studentCount = await db.student.count();
    const sessionCount = await db.sessionApproval.count();
    
    return NextResponse.json({ 
      status: "ok", 
      stats: {
        teachers: teacherCount,
        students: studentCount,
        sessions: sessionCount
      },
      message: "API is working correctly"
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "Failed to fetch database statistics",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}