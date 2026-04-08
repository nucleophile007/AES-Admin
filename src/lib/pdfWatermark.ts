import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

export async function applyTiledWatermark(pdfDoc: PDFDocument, text = '© Acharyaes.com') {
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()
    const stepX = Math.max(170, width / 3.1)
    const stepY = Math.max(130, height / 3.1)

    for (let y = -stepY; y < height + stepY; y += stepY) {
      for (let x = -stepX; x < width + stepX; x += stepX) {
        page.drawText(text, {
          x,
          y,
          size: 16,
          font: boldFont,
          color: rgb(0.15, 0.15, 0.15),
          opacity: 0.24,
          rotate: degrees(45),
        })

        page.drawText(text, {
          x: x + 2,
          y: y - 2,
          size: 16,
          font: boldFont,
          color: rgb(0.95, 0.95, 0.95),
          opacity: 0.18,
          rotate: degrees(45),
        })
      }
    }
  }
}