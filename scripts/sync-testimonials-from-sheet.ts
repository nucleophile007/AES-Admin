import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

/**
 * Manual sync script to import testimonials from Google Sheets
 * Run this once to import existing data, then use webhook for real-time updates
 * 
 * Setup:
 * 1. Enable Google Sheets API in Google Cloud Console
 * 2. Create a service account and download credentials JSON
 * 3. Share your sheet with the service account email
 * 4. Set GOOGLE_SHEETS_CREDENTIALS_PATH in .env
 * 5. Set GOOGLE_SHEET_ID in .env (from sheet URL)
 * 
 * Usage:
 * npx tsx scripts/sync-testimonials-from-sheet.ts
 */

// Configuration - reads from .env file
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = 'Form responses 1' // Exact name from your sheet
const RANGE = `${SHEET_NAME}!A:Z` // Adjust range as needed

if (!SHEET_ID) {
  console.error('❌ GOOGLE_SHEET_ID not found in .env file')
  process.exit(1)
}

interface SheetRow {
  timestamp: string
  [key: string]: any
}

async function getGoogleSheetsClient() {
  try {
    // Option 1: Using service account credentials file
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH
    if (credentialsPath) {
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
      return google.sheets({ version: 'v4', auth })
    }

    // Option 2: Using credentials JSON from environment variable
    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS
    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
      return google.sheets({ version: 'v4', auth })
    }

    throw new Error('No Google Sheets credentials found. Set GOOGLE_SHEETS_CREDENTIALS_PATH or GOOGLE_SHEETS_CREDENTIALS in .env')
  } catch (error) {
    console.error('❌ Error setting up Google Sheets client:', error)
    throw error
  }
}

async function fetchSheetData() {
  try {
    const sheets = await getGoogleSheetsClient()
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet.')
      return []
    }

    const headers = rows[0].map(h => h.toString().trim())
    const dataRows = rows.slice(1)

    console.log(`📊 Found ${dataRows.length} rows in sheet`)
    console.log(`📋 Headers (${headers.length} columns):`)
    headers.forEach((h, i) => console.log(`  ${i + 1}. "${h}"`))

    return dataRows.map((row, index) => {
      const obj: SheetRow = { timestamp: '' }
      headers.forEach((header, index) => {
        obj[header] = row[index] || null
      })
      return obj
    })
  } catch (error) {
    console.error('❌ Error fetching sheet data:', error)
    throw error
  }
}

function mapSheetRowToTestimonial(row: SheetRow, rowIndex: number) {
  // Parse "Name, Grade and School" field
  const parseNameGradeSchool = (text: string) => {
    const parts = text.split(',').map(s => s.trim())
    return {
      name: parts[0] || null,
      grade: parts[1] || null,
      school: parts[2] || null,
    }
  }

  const nameGradeSchool = row['Name, Grade and School'] 
    ? parseNameGradeSchool(row['Name, Grade and School'])
    : { name: null, grade: null, school: null }

  // Parse programs
  const programsField = row['Program(s) enrolled (Select all that apply)']
  const programs = programsField 
    ? (typeof programsField === 'string' 
        ? programsField.split(',').map(p => p.trim()) 
        : [programsField.toString()])
    : []

  // Get rating - try multiple possible column names
  let ratingField = row['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) ']
  
  // If not found, try without trailing space
  if (!ratingField) {
    ratingField = row['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well)']
  }
  
  const rating = ratingField ? parseInt(ratingField.toString().trim()) : null
  
  // Debug logging for first few rows
  if (rowIndex <= 3) {
    console.log(`\n📝 Row ${rowIndex} - ${nameGradeSchool.name}:`)
    console.log(`  Rating field value: "${ratingField}"`)
    console.log(`  Parsed rating: ${rating}`)
    console.log(`  Programs: ${programs.join(', ')}`)
  }

  return {
    studentName: nameGradeSchool.name,
    authorName: nameGradeSchool.name,
    authorType: 'student', // Default to student
    content: row['How would you describe your experience with your ACHARYA tutor(s)/mentor(s) ?\nWhat stands out most about their teaching or mentoring style?'] || null,
    grade: nameGradeSchool.grade,
    school: nameGradeSchool.school,
    programs,
    rating,
    videoLink: null,
    beforeAfterExpectations: row['Before : What were your expectations when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\n\nAfter: What changes did you notice after joining and how has ACHARYA made a difference with your (your child\'s future plans) ?'] || null,
    experienceDescription: null,
    successStory: row['Please share a specific success story or milestone achieved with the help of ACHARYA.'] || null,
    consentToFeature: row['May we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? '] === 'Yes',
    submittedAt: (() => {
      const timestamp = row.Timestamp || row.timestamp
      if (!timestamp) return new Date()
      // Handle Google Sheets date object
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? new Date() : date
    })(),
    isApproved: false,
    isVisible: true,
    updatedAt: new Date(),
  }
}

async function syncTestimonials() {
  try {
    console.log('🚀 Starting testimonials sync from Google Sheets...\n')

    // Fetch data from sheet
    const sheetData = await fetchSheetData()

    if (sheetData.length === 0) {
      console.log('⚠️  No data to sync')
      return
    }

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const [index, row] of sheetData.entries()) {
      try {
        const testimonialData = mapSheetRowToTestimonial(row, index + 1)

        // Skip if no content
        if (!testimonialData.content) {
          console.log(`⏭️  Row ${index + 2}: Skipping (no content)`)
          skipCount++
          continue
        }

        // Check if testimonial already exists (by studentName, content, and submittedAt)
        const existing = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM "Testimonial"
          WHERE "studentName" = ${testimonialData.studentName}
          AND "content" = ${testimonialData.content}
          AND ABS(EXTRACT(EPOCH FROM ("submittedAt" - ${testimonialData.submittedAt}::timestamp))) < 5
        `
        
        if (existing && existing[0] && Number(existing[0].count) > 0) {
          console.log(`⏭️  Row ${index + 2}: Already exists (${testimonialData.studentName})`)
          skipCount++
          continue
        }

        // Create testimonial without student link (can be linked later via admin panel)
        const dataToInsert = testimonialData as any

        // Create testimonial using $executeRaw to bypass Prisma validation
        const testimonial = await prisma.$queryRaw`
          INSERT INTO "Testimonial" (
            "studentName", "authorName", "authorType", "content", "grade", "school",
            "programs", "rating", "videoLink", "beforeAfterExpectations",
            "experienceDescription", "successStory", "consentToFeature",
            "submittedAt", "isApproved", "isVisible", "updatedAt"
          ) VALUES (
            ${dataToInsert.studentName}, ${dataToInsert.authorName}, ${dataToInsert.authorType},
            ${dataToInsert.content}, ${dataToInsert.grade}, ${dataToInsert.school},
            ${dataToInsert.programs}::text[], ${dataToInsert.rating}, ${dataToInsert.videoLink},
            ${dataToInsert.beforeAfterExpectations}, ${dataToInsert.experienceDescription},
            ${dataToInsert.successStory}, ${dataToInsert.consentToFeature},
            ${dataToInsert.submittedAt}, ${dataToInsert.isApproved}, ${dataToInsert.isVisible},
            ${dataToInsert.updatedAt}
          ) RETURNING id
        `

        console.log(`✅ Row ${index + 2}: Created testimonial by ${testimonialData.authorName}`)
        successCount++
      } catch (error) {
        console.error(`❌ Row ${index + 2}: Error -`, error instanceof Error ? error.message : error)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('🎉 Sync Complete!')
    console.log('='.repeat(50))
    console.log(`✅ Successfully imported: ${successCount}`)
    console.log(`⏭️  Skipped: ${skipCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ Fatal error during sync:', error)
    throw error
  }
}

// Run the sync
syncTestimonials()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('❌ Script failed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
