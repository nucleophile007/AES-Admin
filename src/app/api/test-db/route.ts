import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// @ts-ignore - Prisma extension types issue
const db = prisma as any

// GET /api/test-db
export async function GET() {
  try {
    // Test connection
    console.log("Testing database connection...");
    const testResult = await db.$queryRaw`SELECT 1 as connection_test`;
    console.log("Connection test result:", testResult);

    // Get database stats
    console.log("Getting database stats...");
    const studentCount = await db.student.count();
    const teacherCount = await db.teacher.count();
    const sessionCount = await db.webinarRegistration.count();

    return NextResponse.json({
      status: "success",
      connection: "working",
      database: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "unknown",
      stats: {
        students: studentCount,
        teachers: teacherCount,
        sessions: sessionCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
      database: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "unknown",
    }, { status: 500 });
  }
}