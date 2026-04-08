// src/app/api/admin/events/[id]/registrations/export/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

// GET /api/admin/events/:id/registrations/export - Export registrations
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "json"

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: parseInt(id) },
      orderBy: { createdAt: "desc" },
    })

    const event = await prisma.generalEvent.findUnique({
      where: { id: parseInt(id) },
      select: { title: true },
    })

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "ID",
        "Student Name",
        "Student Email",
        "Student Phone",
        "Student Grade",
        "School Name",
        "Parent Name",
        "Parent Email",
        "Parent Phone",
        "Registration Status",
        "Payment Status",
        "Payment Amount",
        "Transaction ID",
        "Checked In",
        "Checked In At",
        "Special Requirements",
        "Registration Date",
      ]

      const rows = registrations.map((reg) => [
        reg.id,
        reg.studentName,
        reg.studentEmail,
        reg.studentPhone || "",
        reg.studentGrade || "",
        reg.schoolName || "",
        reg.parentName,
        reg.parentEmail,
        reg.parentPhone || "",
        reg.registrationStatus,
        reg.paymentStatus || "",
        reg.paymentAmount || "",
        reg.transactionId || "",
        reg.attendanceConfirmed ? "Yes" : "No",
        reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : "",
        reg.specialRequirements || "",
        new Date(reg.createdAt).toLocaleString(),
      ])

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n")

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${event?.title || "event"}-registrations.csv"`,
        },
      })
    }

    // Default: JSON
    return NextResponse.json(registrations)
  } catch (error) {
    console.error("Error exporting registrations:", error)
    return NextResponse.json(
      { error: "Failed to export registrations" },
      { status: 500 }
    )
  }
}
