import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { google } from 'googleapis'
import prisma from '@/lib/prisma'

// Configuration - reads from .env file
const SHEET_ID = process.env.PARENT_FEEDBACK_SHEET_ID
const SHEET_NAME = 'Testimonial'
const RANGE = `${SHEET_NAME}!A:O`

interface SheetRow {
  timestamp: string
  [key: string]: any
}

async function getGoogleSheetsClient() {
  try {
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH
    if (credentialsPath) {
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
      return google.sheets({ version: 'v4', auth })
    }

    const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS
    if (credentialsJson) {
      const credentials = JSON.parse(credentialsJson)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })
      return google.sheets({ version: 'v4', auth })
    }

    throw new Error('No Google Sheets credentials found')
  } catch (error) {
    console.error('Error setting up Google Sheets client:', error)
    throw error
  }
}

async function fetchSheetData() {
  const sheets = await getGoogleSheetsClient()
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  })

  const rows = response.data.values
  if (!rows || rows.length === 0) {
    return []
  }

  const headers = rows[0].map(h => h.toString().trim())
  const dataRows = rows.slice(1)

  return dataRows.map((row) => {
    const obj: SheetRow = { timestamp: '' }
    headers.forEach((header, index) => {
      obj[header] = row[index] || null
    })
    return obj
  })
}

// function mapSheetRowToFeedback(row: SheetRow) {
//   // Parse student name, grade, and school from combined field
//   const parseNameGradeSchool = (text: string) => {
//     if (!text) return { name: null, grade: null, school: null }
//     const parts = text.split(',').map(s => s.trim())
//     return {
//       name: parts[0] || null,
//       grade: parts[1] || null,
//       school: parts[2] || null,
//     }
//   }

//   // Get student info from the parent feedback form
//   const studentInfo = row["STUDENT's:\nName, Grade and School"] 
//     ? parseNameGradeSchool(row["STUDENT's:\nName, Grade and School"])
//     : { name: null, grade: null, school: null }

//   // Get parent name
//   const parentName = row["Parent's Name"] || null
  
//   const programsField = row['Program(s) your child enrolled (Select all that apply) in:']
//   const programs = programsField 
//     ? (typeof programsField === 'string' 
//         ? programsField.split(',').map(p => p.trim()) 
//         : [programsField.toString()])
//     : []

//   // Get rating - column 9
//   const ratingField = row["For STUDENTS:\nDid the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) "]
//   const studentRating = ratingField ? parseInt(ratingField.toString().trim()) : null

//   // Get scheduling rating - column 10
//   const schedulingRatingField = row["Was it easy to schedule sessions, get updates, or ask questions? (Scale: 1- Not well ;; 5 - Exceptionally prompt)"]
//   const schedulingRating = schedulingRatingField ? parseInt(schedulingRatingField.toString().trim()) : null

//   return {
//     studentName: studentInfo.name,
//     parentName: parentName,
//     grade: studentInfo.grade,
//     school: studentInfo.school,
//     programs,
//     studentRating,
//     schedulingRating,
//     heardAbout: row['How did you first hear about ACHARYA ?'] || null,
//     beforeAfterExpectations: row["Before : What were your expectations for your child when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\n\nAfter: What changes did you notice in your child after joining and how has ACHARYA made a difference ?"] || null,
//     childExperience: row["In your words, how would you describe your child's experience with your ACHARYA tutor(s)/mentor(s) ?\nWhat stands out most about their teaching or mentoring style?"] || null,
//     overallExperience: row["1. How was your overall experience with ACHARYA's organization with respect to your child's progress? -------------------------------------------------------------------------------------2. What is your favorite thing about ACHARYA compared to/that sets apart from other organizations (if you have tried any)?"] || null,
//     successStory: row['Please share a specific success story or milestone your student achieved with the help of ACHARYA.'] || null,
//     wouldRecommend: row['Would you recommend ACHARYA to others? '] || null,
//     consentToFeature: row["PARENTS, \nMay we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? "]?.toString().toLowerCase().includes('yes') || false,
//     favoriteThingToShare: row['What is your favorite thing about ACHARYA you want to share in your recommendation with others ?'] || null,
//     suggestions: row['If you have any recommendations or suggestions,\nACHARYA would love to know !!'] || null,
//     submittedAt: (() => {
//       const timestamp = row.Timestamp
//       if (!timestamp) return new Date()
//       const date = new Date(timestamp)
//       return isNaN(date.getTime()) ? new Date() : date
//     })(),
//     isApproved: false,
//     isVisible: true,
//   }
// }
function mapSheetRowToFeedback(row: SheetRow) {
  /* ------------------------------------------------ */
  /* STUDENT: Name, Grade, School (variable length) */
  /* ------------------------------------------------ */

  const studentRaw =
  row["STUDENT's:\nName, Grade and School"] ?? null

let studentName: string | null = null
let grade: string | null = null
let school: string | null = null

if (typeof studentRaw === "string") {
  const parts = studentRaw
    .split(",")
    .map(p => p.trim())
    .filter(Boolean)

  // Grade = part containing any digit (8th, 10, Grade 9, etc.)
  grade =
    parts.find(p => /\d/.test(p)) ?? null

  // Student name = first non-grade part
  studentName =
    parts.find(p => p !== grade) ?? null

  // School = remaining part (if exists)
  school =
    parts.find(
      p => p !== grade && p !== studentName
    ) ?? null
}

  /* ------------------------------------------------ */
  /* PARENT NAME (EXACT MATCH – FIXED) */
  /* ------------------------------------------------ */

  const parentName =
    row["Parent's Name"] ??
    null

  /* ------------------------------------------------ */
  /* PROGRAMS (STRING → STRING[]) */
  /* ------------------------------------------------ */

  const programsField =
    row["Program(s) your child enrolled (Select all that apply) in:"] ?? null

  const programs: string[] =
    typeof programsField === "string"
      ? programsField
          .split(",")
          .map(p => p.trim())
          .filter(Boolean)
      : []

  /* ------------------------------------------------ */
  /* RATINGS */
  /* ------------------------------------------------ */

  const studentRatingRaw =
    row[
      "For STUDENTS:\nDid the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) "
    ]

  const schedulingRatingRaw =
    row[
      "Was it easy to schedule sessions, get updates, or ask questions? (Scale: 1- Not well ;; 5 - Exceptionally prompt)"
    ]

  const studentRating =
    studentRatingRaw ? parseInt(studentRatingRaw.toString(), 10) : null

  const schedulingRating =
    schedulingRatingRaw ? parseInt(schedulingRatingRaw.toString(), 10) : null

  /* ------------------------------------------------ */
  /* TEXT FIELDS (EXACT HEADERS) */
  /* ------------------------------------------------ */

  const heardAbout =
    row["How did you first hear about ACHARYA ?"] ?? null

  const beforeAfterExpectations =
    row[
      "Before : What were your expectations for your child when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\n\nAfter: What changes did you notice in your child after joining and how has ACHARYA made a difference ?"
    ] ?? null

  const childExperience =
    row[
      "In your words, how would you describe your child's experience with your ACHARYA tutor(s)/mentor(s) ?\nWhat stands out most about their teaching or mentoring style?"
    ] ?? null

  const successStory =
    row[
      "Please share a specific success story or milestone your student achieved with the help of ACHARYA."
    ] ?? null

  const overallExperience =
    row[
      "1. How was your overall experience with ACHARYA’s organization with respect to your child's progress?\n-------------------------------------------------------------------------------------\n2. What is your favorite thing about ACHARYA compared to/that sets apart from other organizations (if you have tried any)?"
    ] ?? null

  const favoriteThingToShare =
    row[
      "What is your favorite thing about ACHARYA you want to share in your recommendation with others ?"
    ] ?? null

  const suggestions =
    row[
      "If you have any recommendations or suggestions,\nACHARYA would love to know !!"
    ] ?? null

  /* ------------------------------------------------ */
  /* CONSENT (EXACT HEADER, BOOLEAN SAFE) */
  /* ------------------------------------------------ */

  const consentRaw =
    row[
      "PARENTS, \nMay we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? "
    ]

  const consentToFeature =
    typeof consentRaw === "string" &&
    consentRaw.toLowerCase().includes("yes")

  /* ------------------------------------------------ */
  /* TIMESTAMP */
  /* ------------------------------------------------ */

  const submittedAt = (() => {
    const ts = row["Timestamp"]
    if (!ts) return new Date()
    const d = new Date(ts)
    return isNaN(d.getTime()) ? new Date() : d
  })()

  /* ------------------------------------------------ */
  /* FINAL OBJECT */
  /* ------------------------------------------------ */

  return {
    studentName,
    parentName,
    grade,
    school,
    programs,
    studentRating,
    schedulingRating,
    heardAbout,
    beforeAfterExpectations,
    childExperience,
    successStory,
    overallExperience,
    favoriteThingToShare,
    suggestions,
    consentToFeature,
    submittedAt,
    isApproved: false,
    isVisible: true,
  }
}


export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SHEET_ID) {
      return NextResponse.json({ error: 'Parent feedback Google Sheet not configured' }, { status: 500 })
    }

    const sheetData = await fetchSheetData()

    if (sheetData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data to sync',
        stats: { imported: 0, skipped: 0, errors: 0 }
      })
    }

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const row of sheetData) {
      try {
        const feedbackData = mapSheetRowToFeedback(row)

        if (!feedbackData.childExperience && !feedbackData.successStory) {
          skipCount++
          continue
        }

        // Check if feedback already exists - better duplicate detection
        // Check by student name, parent name, and submitted timestamp (date only)
        const existing = await prisma.feedback.findFirst({
          where: {
            studentName: feedbackData.studentName,
            parentName: feedbackData.parentName,
          }
        })
        
        if (existing) {
          console.log(`Skipping duplicate: ${feedbackData.parentName} - ${feedbackData.studentName}`)
          skipCount++
          continue
        }

        // Create feedback using Prisma's create method
        await prisma.feedback.create({
          data: feedbackData as any
        })

        successCount++
      } catch (error) {
        console.error('Error syncing row:', error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      stats: {
        imported: successCount,
        skipped: skipCount,
        errors: errorCount
      }
    })
  } catch (error) {
    console.error('Error syncing parent testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to sync parent testimonials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
