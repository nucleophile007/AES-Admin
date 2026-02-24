import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { PrismaClient } from '../generated/prisma'

dotenv.config()

const prisma = new PrismaClient()

const PARENT_SHEET_ID = '1brcz1Cq7Y2x8cJvscrdkDE1XnIMWFDLfW6PY-ETi4b4'
const SHEET_NAME = 'Form responses 1'

interface SheetRow {
  [key: string]: any
}

async function fetchSheetData(): Promise<SheetRow[]> {
  try {
    // Option 1: Using service account credentials file
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH
    let auth
    
    if (credentialsPath) {
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Service account file not found at: ${credentialsPath}`)
      }
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
    } 
    // Option 2: Using credentials JSON from environment variable
    else if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS)
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
    } else {
      throw new Error('No Google Sheets credentials found. Set GOOGLE_SHEETS_CREDENTIALS_PATH or GOOGLE_SHEETS_CREDENTIALS in .env')
    }

    const sheets = google.sheets({ version: 'v4', auth })

    console.log(`📋 Fetching data from parent testimonials sheet...`)
    console.log(`Sheet ID: ${PARENT_SHEET_ID}`)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PARENT_SHEET_ID,
      range: 'A:Z', // Use first/active sheet
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

function mapSheetRowToFeedback(row: SheetRow, rowIndex: number) {
  // Parse "STUDENT's: Name, Grade and School" field
  const parseStudentInfo = (text: string) => {
    const parts = text.split(',').map(s => s.trim())
    return {
      studentName: parts[0] || null,
      grade: parts[1] || null,
      school: parts[2] || null,
    }
  }

  const studentInfo = row['STUDENT\'s:\nName, Grade and School'] 
    ? parseStudentInfo(row['STUDENT\'s:\nName, Grade and School'])
    : { studentName: null, grade: null, school: null }

  // Parse programs
  const programsField = row['Program(s) your child enrolled (Select all that apply) in:']
  const programs = programsField 
    ? (typeof programsField === 'string' 
        ? programsField.split(',').map(p => p.trim()) 
        : [programsField.toString()])
    : []

  // Get student rating
  let studentRatingField = row['For STUDENTS:\nDid the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) ']
  const studentRating = studentRatingField ? parseInt(studentRatingField.toString().trim()) : null
  
  // Get scheduling rating
  let schedulingRatingField = row['Was it easy to schedule sessions, get updates, or ask questions? (Scale: 1- Not well ;; 5 - Exceptionally prompt)']
  const schedulingRating = schedulingRatingField ? parseInt(schedulingRatingField.toString().trim()) : null
  
  // Debug logging for first few rows
  if (rowIndex <= 3) {
    console.log(`\n📝 Row ${rowIndex} - ${row['Parent\'s Name']}:`)
    console.log(`  Student: ${studentInfo.studentName}`)
    console.log(`  Student Rating: ${studentRating}`)
    console.log(`  Scheduling Rating: ${schedulingRating}`)
    console.log(`  Programs: ${programs.join(', ')}`)
  }

  return {
    parentName: row['Parent\'s Name'] || null,
    studentName: studentInfo.studentName,
    grade: studentInfo.grade,
    school: studentInfo.school,
    programs,
    heardAbout: row['How did you first hear about ACHARYA ?'] || null,
    beforeAfterExpectations: row['Before : What were your expectations for your child when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\n\nAfter: What changes did you notice in your child after joining and how has ACHARYA made a difference ?'] || null,
    childExperience: row['In your words, how would you describe your child\'s experience with your ACHARYA tutor(s)/mentor(s) ?\nWhat stands out most about their teaching or mentoring style?'] || null,
    successStory: row['Please share a specific success story or milestone your student achieved with the help of ACHARYA.'] || null,
    overallExperience: row['1. How was your overall experience with ACHARYA\'s organization with respect to your child\'s progress?\n-------------------------------------------------------------------------------------\n2. What is your favorite thing about ACHARYA compared to/that sets apart from other organizations (if you have tried any)?'] || null,
    studentRating,
    schedulingRating,
    wouldRecommend: row['Would you recommend ACHARYA to others? '] || null,
    consentToFeature: row['PARENTS, \nMay we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? '] === 'Yes',
    favoriteThingToShare: row['What is your favorite thing about ACHARYA you want to share in your recommendation with others ?'] || null,
    suggestions: row['If you have any recommendations or suggestions,\nACHARYA would love to know !!'] || null,
    submittedAt: (() => {
      const timestamp = row.Timestamp || row.timestamp
      if (!timestamp) return new Date()
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? new Date() : date
    })(),
    status: 'new',
    isApproved: false,
    isVisible: true,
    updatedAt: new Date(),
    beforeAfterApproved: false,
    childExperienceApproved: false,
    successStoryApproved: false,
    overallExperienceApproved: false,
    programsApproved: false,
    studentRatingApproved: false,
    schedulingRatingApproved: false,
  }
}

async function syncParentTestimonials() {
  try {
    console.log('🚀 Starting PARENT testimonials sync to Feedback table from Google Sheets...\n')

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
        const feedbackData = mapSheetRowToFeedback(row, index + 1)

        // Skip if no child experience content
        if (!feedbackData.childExperience) {
          console.log(`⏭️  Row ${index + 2}: Skipping (no child experience content)`)
          skipCount++
          continue
        }

        // Check if feedback already exists
        const existing = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM "Feedback"
          WHERE "studentName" = ${feedbackData.studentName}
          AND "childExperience" = ${feedbackData.childExperience}
          AND ABS(EXTRACT(EPOCH FROM ("submittedAt" - ${feedbackData.submittedAt}::timestamp))) < 5
        `
        
        if (existing && existing[0] && Number(existing[0].count) > 0) {
          console.log(`⏭️  Row ${index + 2}: Already exists (${feedbackData.parentName})`)
          skipCount++
          continue
        }

        // Create feedback using raw SQL
        await prisma.$executeRaw`
          INSERT INTO "Feedback" (
            "parentName", "studentName", "grade", "school", "programs",
            "heardAbout", "beforeAfterExpectations", "childExperience", "successStory",
            "overallExperience", "studentRating", "schedulingRating", "wouldRecommend",
            "consentToFeature", "favoriteThingToShare", "suggestions",
            "submittedAt", "status", "isApproved", "isVisible", "createdAt", "updatedAt",
            "beforeAfterApproved", "childExperienceApproved", "successStoryApproved",
            "overallExperienceApproved", "programsApproved", "studentRatingApproved",
            "schedulingRatingApproved"
          ) VALUES (
            ${feedbackData.parentName}, ${feedbackData.studentName}, ${feedbackData.grade},
            ${feedbackData.school}, ${feedbackData.programs}::text[], ${feedbackData.heardAbout},
            ${feedbackData.beforeAfterExpectations}, ${feedbackData.childExperience},
            ${feedbackData.successStory}, ${feedbackData.overallExperience},
            ${feedbackData.studentRating}, ${feedbackData.schedulingRating},
            ${feedbackData.wouldRecommend}, ${feedbackData.consentToFeature},
            ${feedbackData.favoriteThingToShare}, ${feedbackData.suggestions},
            ${feedbackData.submittedAt}, ${feedbackData.status}, ${feedbackData.isApproved},
            ${feedbackData.isVisible}, NOW(), NOW(),
            ${feedbackData.beforeAfterApproved}, ${feedbackData.childExperienceApproved},
            ${feedbackData.successStoryApproved}, ${feedbackData.overallExperienceApproved},
            ${feedbackData.programsApproved}, ${feedbackData.studentRatingApproved},
            ${feedbackData.schedulingRatingApproved}
          )
        `

        console.log(`✅ Row ${index + 2}: Created feedback by ${feedbackData.parentName}`)
        successCount++
      } catch (error) {
        console.error(`❌ Row ${index + 2}: Error -`, error instanceof Error ? error.message : error)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('🎉 Parent Testimonials Sync Complete!')
    console.log('='.repeat(50))
    console.log(`✅ Successfully imported: ${successCount}`)
    console.log(`⏭️  Skipped: ${skipCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Sync failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

syncParentTestimonials()
