// import { redirect } from "next/navigation"
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "@/lib/authOptions"
// import { allowedEmails } from "@/lib/adminConfig"
// import prisma from "@/lib/prisma"
// import Link from "next/link"
// import { Upload, FileText, ArrowLeft } from "lucide-react"

// interface Props {
//   params: { id: string }
// }

// export default async function ResearchUploadPage({ params }: Props) {
//   const session = await getServerSession(authOptions)

//   // 🔐 Admin guard
//   if (
//     !session?.user?.email ||
//     !allowedEmails.includes(session.user.email.toLowerCase())
//   ) {
//     redirect("/auth/signin")
//   }

//   // 🔍 Fetch research
//   const research = await prisma.research.findUnique({
//     where: { id: params.id },
//   })

//   if (!research) {
//     redirect("/admin")
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center gap-4 mb-8">
//           <Link
//             href="/admin"
//             className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Dashboard
//           </Link>

//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Upload Research Files
//             </h1>
//             <p className="text-sm text-gray-600">
//               {research.title}
//               {research.author && ` • ${research.author}`}
//             </p>
//           </div>
//         </div>

//         {/* Upload Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* PPT Upload */}
//           <div className="bg-white rounded-xl border shadow-sm p-6">
//             <div className="flex items-center gap-3 mb-4">
//               <Upload className="w-6 h-6 text-blue-600" />
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Upload PPT
//               </h3>
//             </div>

//             <p className="text-sm text-gray-600 mb-4">
//               Upload the PowerPoint file. Slides will be auto-converted later.
//             </p>

//             <form
//               action={`/api/admin/research/${research.id}/upload-ppt`}
//               method="POST"
//               encType="multipart/form-data"
//             >
//               <input
//                 type="file"
//                 name="file"              // ✅ FIXED
//                 accept=".ppt,.pptx"
//                 required
//                 className="block w-full text-sm mb-4"
//               />

//               <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//                 Upload PPT
//               </button>
//             </form>

//             {research.pptPath && (
//               <p className="text-xs text-green-600 mt-3">
//                 ✔ PPT already uploaded
//               </p>
//             )}
//           </div>

//           {/* PDF Upload */}
//           <div className="bg-white rounded-xl border shadow-sm p-6">
//             <div className="flex items-center gap-3 mb-4">
//               <FileText className="w-6 h-6 text-yellow-600" />
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Upload Technical Report (PDF)
//               </h3>
//             </div>

//             <p className="text-sm text-gray-600 mb-4">
//               Optional technical research document for secure access.
//             </p>

//             <form
//               action={`/api/admin/research/${research.id}/upload-pdf`}
//               method="POST"
//               encType="multipart/form-data"
//             >
//               <input
//                 type="file"
//                 name="file"              // ✅ FIXED
//                 accept=".pdf"
//                 className="block w-full text-sm mb-4"
//               />

//               <button className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400">
//                 Upload PDF
//               </button>
//             </form>

//             {research.pdfFilename && (
//               <p className="text-xs text-green-600 mt-3">
//                 ✔ PDF already uploaded
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Footer Note */}
//         <div className="mt-8 text-sm text-gray-500">
//           Next steps after upload:
//           <ul className="list-disc ml-6 mt-2 space-y-1">
//             <li>Convert PPT slides → images</li>
//             <li>Add watermark (acharyaes.com)</li>
//             <li>Enable secure viewer</li>
//           </ul>
//         </div>
//       </div>
//     </div>
//   )
// }
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { allowedEmails } from "@/lib/adminConfig"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Upload, FileText, ArrowLeft, Images } from "lucide-react"

interface Props {
  params: { id: string }
}

export default async function ResearchUploadPage({ params }: Props) {
  const session = await auth()

  // 🔐 Admin guard
  if (
    !session?.user?.email ||
    !allowedEmails.includes(session.user.email.toLowerCase())
  ) {
    redirect("/auth/signin")
  }

  // 🔍 Fetch research
  const research = await prisma.research.findUnique({
    where: { id: params.id },
    include: { slides: true },
  })

  if (!research) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Upload Research Content
            </h1>
            <p className="text-sm text-gray-600">
              {research.title}
              {research.author && ` • ${research.author}`}
            </p>
          </div>
        </div>

        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SLIDE IMAGE UPLOAD */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Images className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Slide Images
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Upload slide images (PNG or JPG).
              <br />
              <span className="font-medium">
                Order matters — images are saved in upload order.
              </span>
            </p>

            <form
              action={`/api/admin/research/${research.id}/upload-slides`}
              method="POST"
              encType="multipart/form-data"
            >
              <input
                type="file"
                name="files"
                accept="image/png,image/jpeg"
                multiple
                required
                className="block w-full text-sm mb-4"
              />

              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload Slides
              </button>
            </form>

            {research.slides.length > 0 && (
              <p className="text-xs text-green-600 mt-3">
                ✔ {research.slides.length} slides already uploaded
              </p>
            )}
          </div>

          {/* PDF Upload */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Technical Report (PDF)
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Optional secure technical document (PDF).
            </p>

            <form
              action={`/api/admin/research/${research.id}/upload-pdf`}
              method="POST"
              encType="multipart/form-data"
            >
              <input
                type="file"
                name="file"
                accept=".pdf"
                className="block w-full text-sm mb-4"
              />

              <button className="w-full px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400">
                Upload PDF
              </button>
            </form>

            {research.pdfFilename && (
              <p className="text-xs text-green-600 mt-3">
                ✔ PDF already uploaded
              </p>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-sm text-gray-500">
          Recommended workflow:
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Export PPT → images (PNG/JPG)</li>
            <li>Upload images in correct order</li>
            <li>Slides are auto-watermarked & secured</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
