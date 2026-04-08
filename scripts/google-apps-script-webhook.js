// ============================================
// Google Apps Script - Add this to your Google Form
// ============================================
// 1. Open your Google Form
// 2. Click the three dots (⋮) → Script editor
// 3. Copy and paste this code
// 4. Update WEBHOOK_URL with your deployed app URL
// 5. Update WEBHOOK_SECRET with the value from your .env file
// 6. Set up trigger: Click clock icon → Add Trigger → 
//    Choose: onFormSubmit, From spreadsheet, On form submit
// ============================================

// Configuration - UPDATE THESE VALUES WITH YOUR ACTUAL VALUES
const WEBHOOK_URL = 'https://your-deployed-app-domain.com/api/webhooks/testimonials'
const WEBHOOK_SECRET = 'paste-your-TESTIMONIALS_WEBHOOK_SECRET-from-env-file-here'

/**
 * Trigger function that runs when form is submitted
 * This sends data to your Next.js API endpoint in real-time
 */
function onFormSubmit(e) {
  try {
    // Get the form response
    const formResponse = e.response
    const itemResponses = formResponse.getItemResponses()
    
    // Build the data object
    const data = {
      timestamp: new Date(formResponse.getTimestamp()).toISOString(),
      responseId: formResponse.getId(),
    }
    
    // Map form questions to data fields - Exact mappings for your form
    itemResponses.forEach(function(itemResponse) {
      const question = itemResponse.getItem().getTitle()
      const answer = itemResponse.getResponse()
      
      // Map based on your exact form questions
      if (question === 'Name, Grade and School') {
        data['Name, Grade and School'] = answer
      } else if (question.includes('Program(s) enrolled')) {
        data['Program(s) enrolled (Select all that apply)'] = Array.isArray(answer) ? answer.join(', ') : answer
      } else if (question.includes('How would you describe your experience')) {
        data['How would you describe your experience with your ACHARYA tutor(s)/mentor(s) ?\\nWhat stands out most about their teaching or mentoring style?'] = answer
      } else if (question.includes('clarity, motivation, or customized support')) {
        data['Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) '] = answer
      } else if (question.includes('Before : What were your expectations')) {
        data['Before : What were your expectations when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\\n\\nAfter: What changes did you notice after joining and how has ACHARYA made a difference with your (your child\\'s future plans) ?'] = answer
      } else if (question.includes('specific success story')) {
        data['Please share a specific success story or milestone achieved with the help of ACHARYA.'] = answer
      } else if (question.includes('May we feature your testimonial')) {
        data['May we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? '] = answer
      }
    })
    
    // Send to webhook
    const options = {
      'method': 'POST',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + WEBHOOK_SECRET
      },
      'payload': JSON.stringify(data),
      'muteHttpExceptions': true
    }
    
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options)
    const responseCode = response.getResponseCode()
    const responseBody = response.getContentText()
    
    if (responseCode === 200) {
      Logger.log('✅ Successfully sent testimonial to database')
      Logger.log('Response: ' + responseBody)
    } else {
      Logger.log('❌ Error sending to webhook. Status: ' + responseCode)
      Logger.log('Response: ' + responseBody)
    }
    
  } catch (error) {
    Logger.log('❌ Error in onFormSubmit: ' + error.toString())
    
    // Optional: Send error notification email
    // MailApp.sendEmail('your-email@example.com', 'Testimonial Webhook Error', error.toString())
  }
}

/**
 * Test function - Run this to test your webhook
 * This sends a sample testimonial to verify the connection
 */
function testWebhook() {
  const testData = {
    Timestamp: new Date().toISOString(),
    'Name, Grade and School': 'Test Student, 10th grade, Test High School',
    'Program(s) enrolled (Select all that apply)': 'Tutoring, AES CHAMPIONS Competitions',
    'How would you describe your experience with your ACHARYA tutor(s)/mentor(s) ?\\nWhat stands out most about their teaching or mentoring style?': 'This is a test testimonial. The tutors are excellent and very supportive!',
    'Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) ': '5',
    'Before : What were your expectations when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\\n\\nAfter: What changes did you notice after joining and how has ACHARYA made a difference with your (your child\\'s future plans) ?': 'Before: Expected to improve grades. After: Exceeded all expectations!',
    'Please share a specific success story or milestone achieved with the help of ACHARYA.': 'Improved my math grade from B to A+',
    'May we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? ': 'Yes'
  }
  
  const options = {
    'method': 'POST',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + WEBHOOK_SECRET
    },
    'payload': JSON.stringify(testData),
    'muteHttpExceptions': true
  }
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options)
    Logger.log('Status Code: ' + response.getResponseCode())
    Logger.log('Response: ' + response.getContentText())
  } catch (error) {
    Logger.log('Error: ' + error.toString())
  }
}

/**
 * Sync all existing responses from the sheet
 * Run this once to import all existing testimonials
 */
function syncExistingResponses() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses 1')
  if (!sheet) {
    Logger.log('❌ Could not find "Form Responses 1" sheet')
    return
  }
  
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const rowData = {
      timestamp: new Date(row[0]).toISOString()
    }
    
    // Map columns to fields based on headers - Your exact form structure
    for (let j = 1; j < headers.length; j++) {
      const header = headers[j]
      const value = row[j]
      
      if (value) {
        // Map exact column names from your form
        rowData[header] = value
      }
    }
    
    // Send each row
    const options = {
      'method': 'POST',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + WEBHOOK_SECRET
      },
      'payload': JSON.stringify(rowData),
      'muteHttpExceptions': true
    }
    
    try {
      const response = UrlFetchApp.fetch(WEBHOOK_URL, options)
      if (response.getResponseCode() === 200) {
        Logger.log(`✅ Row ${i} synced successfully`)
      } else {
        Logger.log(`❌ Row ${i} failed: ${response.getContentText()}`)
      }
    } catch (error) {
      Logger.log(`❌ Row ${i} error: ${error.toString()}`)
    }
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(500)
  }
  
  Logger.log('🎉 Sync complete!')
}
