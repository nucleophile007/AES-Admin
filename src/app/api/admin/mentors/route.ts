import { NextRequest } from "next/server"
import { checkAdminAuth } from "@/lib/adminAuth"
import prisma from "@/lib/prisma"
import { uploadToR2 } from "@/lib/r2Upload"

// GET - Fetch all mentors
export async function GET() {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const mentors = await prisma.mentor.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return Response.json({ mentors })
  } catch (error) {
    console.error("Error fetching mentors:", error)
    return Response.json({ error: "Failed to fetch mentors" }, { status: 500 })
  }
}

// POST - Create new mentor
export async function POST(req: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const formData = await req.formData()

    const teacherId = formData.get("teacherId") as string
    const name = formData.get("name") as string
    const role = formData.get("role") as string
    const workplace = formData.get("workplace") as string
    const education = formData.get("education") as string
    const institution = formData.get("institution") as string
    const experience = formData.get("experience") as string
    const bio = formData.get("bio") as string
    const isActive = formData.get("isActive") === "true"
    const department = formData.get("department") as string || "engg-ai"
    const specialties = JSON.parse(formData.get("specialties") as string || "[]")
    const achievements = JSON.parse(formData.get("achievements") as string || "[]")
    const imageFile = formData.get("image") as File

    if (!name || !role || !workplace || !education || !institution || !bio) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!imageFile) {
      return Response.json({ error: "Profile image is required" }, { status: 400 })
    }

    // Upload image to R2
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const timestamp = Date.now()
    const fileName = `mentors/${timestamp}-${imageFile.name.replace(/\s+/g, '-')}`

    const uploadResult = await uploadToR2(imageBuffer, fileName, imageFile.type)

    // Get max display order
    const maxOrder = await prisma.mentor.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    const mentor = await prisma.mentor.create({
      data: {
        teacherId: teacherId ? Number(teacherId) : null,
        name,
        role,
        workplace,
        education,
        institution,
        image: uploadResult.fileUrl,
        experience: experience || null,
        specialties,
        achievements,
        bio,
        isActive,
        department,
        displayOrder: (maxOrder?.displayOrder || 0) + 1
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return Response.json({ mentor }, { status: 201 })
  } catch (error) {
    console.error("Error creating mentor:", error)
    return Response.json({ error: "Failed to create mentor" }, { status: 500 })
  }
}

// PUT - Update mentor
export async function PUT(req: NextRequest) {
  const authResult = await checkAdminAuth()
  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: authResult.statusCode || 403 })
  }

  try {
    const formData = await req.formData()

    const id = Number(formData.get("id"))
    const teacherId = formData.get("teacherId") as string
    const name = formData.get("name") as string
    const role = formData.get("role") as string
    const workplace = formData.get("workplace") as string
    const education = formData.get("education") as string
    const institution = formData.get("institution") as string
    const experience = formData.get("experience") as string
    const bio = formData.get("bio") as string
    const isActive = formData.get("isActive") === "true"
    const department = formData.get("department") as string || "engg-ai"
    const specialties = JSON.parse(formData.get("specialties") as string || "[]")
    const achievements = JSON.parse(formData.get("achievements") as string || "[]")
    const imageFile = formData.get("image") as File | null

    if (!id || !name || !role || !workplace || !education || !institution || !bio) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updateData: any = {
      teacherId: teacherId ? Number(teacherId) : null,
      name,
      role,
      workplace,
      education,
      institution,
      experience: experience || null,
      specialties,
      achievements,
      bio,
      isActive,
      department,
    }

    // Upload new image if provided
    if (imageFile) {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
      const timestamp = Date.now()
      const fileName = `mentors/${timestamp}-${imageFile.name.replace(/\s+/g, '-')}`

      const uploadResult = await uploadToR2(imageBuffer, fileName, imageFile.type)
      updateData.image = uploadResult.fileUrl
    }

    const mentor = await prisma.mentor.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return Response.json({ mentor })
  } catch (error) {
    console.error("Error updating mentor:", error)
    return Response.json({ error: "Failed to update mentor" }, { status: 500 })
  }
}
