import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { google } from 'googleapis'
import prisma from '@/lib/prisma'

// Configuration - reads from .env file
const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = 'Form responses 1'
const RANGE = `${SHEET_NAME}!A:Z`

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

function mapSheetRowToTestimonial(row: SheetRow) {
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

  const programsField = row['Program(s) enrolled (Select all that apply)']
  const programs = programsField 
    ? (typeof programsField === 'string' 
        ? programsField.split(',').map(p => p.trim()) 
        : [programsField.toString()])
    : []

  let ratingField = row['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) ']
  if (!ratingField) {
    ratingField = row['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well)']
  }
  const rating = ratingField ? parseInt(ratingField.toString().trim()) : null

  return {
    studentName: nameGradeSchool.name,
    authorName: nameGradeSchool.name,
    authorType: 'student',
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
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? new Date() : date
    })(),
    isApproved: false,
    isVisible: true,
    updatedAt: new Date(),
  }
}

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!SHEET_ID) {
      return NextResponse.json({ error: 'Google Sheets not configured' }, { status: 500 })
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
        const testimonialData = mapSheetRowToTestimonial(row)

        if (!testimonialData.content) {
          skipCount++
          continue
        }

        // Check if testimonial already exists - using better duplicate detection
        // Check by content and student name (timestamps can vary slightly)
        const existing = await prisma.testimonial.findFirst({
          where: {
            studentName: testimonialData.studentName,
            content: testimonialData.content,
          }
        })
        
        if (existing) {
          skipCount++
          continue
        }

        // Create testimonial using Prisma's create method
        await prisma.testimonial.create({
          data: testimonialData as any
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
    console.error('Error syncing testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to sync testimonials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
