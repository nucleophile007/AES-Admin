import CloudConvert from "cloudconvert"
import fetch from "node-fetch"
import { createClient } from "@supabase/supabase-js"
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"
import "dotenv/config"

const prisma = new PrismaClient()

const cloudConvert = new CloudConvert(
  process.env.CLOUDCONVERT_API_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET_PPT = "research-ppt"
const BUCKET_SLIDES = "research-slides"

async function run(researchId) {
  console.log("🔍 Fetching research:", researchId)

  // 1️⃣ Get research row
  const research = await prisma.research.findUnique({
    where: { id: researchId },
  })

  if (!research || !research.pptPath) {
    throw new Error("Research or PPT not found")
  }

  // 2️⃣ Get PPT public URL (or signed URL)
  const { data: pptUrl } = supabase
    .storage
    .from(BUCKET_PPT)
    .getPublicUrl(research.pptPath)

  console.log("📥 Downloading PPT")

  const pptRes = await fetch(pptUrl.publicUrl)
  const pptBuffer = Buffer.from(await pptRes.arrayBuffer())

  // Save temporarily
  const tempPath = path.join("tmp", `${researchId}.pptx`)
  fs.mkdirSync("tmp", { recursive: true })
  fs.writeFileSync(tempPath, pptBuffer)

  // 3️⃣ Create CloudConvert job
  const job = await cloudConvert.jobs.create({
    tasks: {
      "import-ppt": { operation: "import/upload" },
      "convert-png": {
        operation: "convert",
        input: "import-ppt",
        input_format: "pptx",
        output_format: "png",
      },
      "export-files": {
        operation: "export/url",
        input: "convert-png",
      },
    },
  })

  const uploadTask = job.tasks.find(t => t.name === "import-ppt")

  await cloudConvert.tasks.upload(
    uploadTask,
    fs.createReadStream(tempPath)
  )

  const finishedJob = await cloudConvert.jobs.wait(job.id)

  const exportTask = finishedJob.tasks.find(
    t => t.name === "export-files"
  )

  // 4️⃣ Upload slides + DB insert
  for (let i = 0; i < exportTask.result.files.length; i++) {
    const slideOrder = i + 1
    const file = exportTask.result.files[i]

    const imgRes = await fetch(file.url)
    const buffer = Buffer.from(await imgRes.arrayBuffer())

    const storagePath = `${researchId}/slide-${slideOrder}.png`

    await supabase.storage
      .from(BUCKET_SLIDES)
      .upload(storagePath, buffer, {
        contentType: "image/png",
        upsert: true,
      })

    const { data: url } = supabase
      .storage
      .from(BUCKET_SLIDES)
      .getPublicUrl(storagePath)

    await prisma.slide.create({
      data: {
        researchId,
        imagePath: url.publicUrl,
        order: slideOrder,
      },
    })

    console.log(`✅ Slide ${slideOrder} saved`)
  }

  console.log("🎉 Slides generated successfully")
}

// ---- RUN ----
const researchId = process.argv[2]
if (!researchId) {
  console.error("❌ Please provide researchId")
  process.exit(1)
}

run(researchId).finally(() => prisma.$disconnect())
