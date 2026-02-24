import { google } from 'googleapis'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1ZOXJtQkpkNyG5C22jO6el3GAHTT-q27ZB8DY7HXW2Mk'
const SHEET_NAME = 'Form responses 1'

async function checkRatingColumn() {
  try {
    console.log('🔍 Checking rating column in Google Sheet...\n')

    const credentialsPath = path.join(process.cwd(), 'aes-admin-service-account.json')
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Service account file not found at: ${credentialsPath}`)
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${SHEET_NAME}'!A1:Z1000`,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      console.log('No data found.')
      return
    }

    const headers = rows[0].map(h => h.toString().trim())
    
    console.log('=== ALL COLUMN HEADERS ===')
    headers.forEach((header, index) => {
      console.log(`Column ${index}: "${header}"`)
    })

    console.log('\n=== LOOKING FOR RATING COLUMN ===')
    const ratingColumnIndex = headers.findIndex(h => 
      h.toLowerCase().includes('clarity') || 
      h.toLowerCase().includes('provide') ||
      h.toLowerCase().includes('tutor') ||
      h.toLowerCase().includes('mentor')
    )

    if (ratingColumnIndex !== -1) {
      console.log(`\nFound potential rating column at index ${ratingColumnIndex}:`)
      console.log(`Header: "${headers[ratingColumnIndex]}"`)
      
      console.log('\nSample values from this column:')
      for (let i = 1; i <= Math.min(5, rows.length - 1); i++) {
        const value = rows[i][ratingColumnIndex]
        console.log(`Row ${i}: "${value}" (type: ${typeof value})`)
      }
    } else {
      console.log('\n❌ No rating column found!')
    }

    // Check all columns in first data row
    console.log('\n=== FIRST DATA ROW (Row 2) ===')
    if (rows.length > 1) {
      headers.forEach((header, index) => {
        const value = rows[1][index]
        if (value) {
          console.log(`${header}: "${value}"`)
        }
      })
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkRatingColumn()
