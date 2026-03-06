import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const researchId = searchParams.get('researchId')
    const filename = searchParams.get('filename')

    if (!researchId || !filename) {
      return NextResponse.json(
        { error: 'Missing researchId or filename' },
        { status: 400 }
      )
    }

    const storagePath = `${researchId}/${filename}`

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await supabaseServer.storage
      .from('research-slides')
      .createSignedUrl(storagePath, 3600)

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json(
        { error: 'Failed to generate slide URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.signedUrl }, { status: 200 })
  } catch (err) {
    console.error('Slide URL error:', err)
    return NextResponse.json(
      { error: 'Failed to generate slide URL' },
      { status: 500 }
    )
  }
}
