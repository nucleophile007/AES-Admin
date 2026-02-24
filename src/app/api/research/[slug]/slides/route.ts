import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { supabaseServer } from "@/lib/supabase-server"

// GET /api/research/[slug]/slides?slideNumber=1
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const slideNumber = parseInt(searchParams.get("slideNumber") || "1")

    // Find research by slug
    const research = await prisma.research.findUnique({
      where: { slug, published: true },
      include: {
        Slide: {
          where: { order: slideNumber },
        },
      },
    })

    if (!research || !research.Slide.length) {
      return NextResponse.json(
        { error: "Slide not found" },
        { status: 404 }
      )
    }

    // TODO: Add your access verification logic here
    // For example: Check if user has AccessRequest approved
    // const hasAccess = await prisma.accessRequest.findFirst({
    //   where: {
    //     researchId: research.id,
    //     email: userEmail,
    //     approved: true,
    //   },
    // })
    // if (!hasAccess) {
    //   return NextResponse.json({ error: "Access denied" }, { status: 403 })
    // }

    const slide = research.Slide[0]
    const storagePath = `${research.id}/${slide.imageFilename}`

    // Generate signed URL (expires in 1 hour)
    const { data, error } = await supabaseServer.storage
      .from("research-slides")
      .createSignedUrl(storagePath, 3600) // 1 hour

    if (error || !data) {
      console.error("Error creating signed URL:", error)
      return NextResponse.json(
        { error: "Failed to generate access URL" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: data.signedUrl,
      slideNumber,
      totalSlides: await prisma.slide.count({
        where: { researchId: research.id },
      }),
    })
  } catch (error) {
    console.error("Error fetching slide:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
