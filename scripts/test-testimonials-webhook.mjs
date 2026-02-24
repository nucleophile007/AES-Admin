#!/usr/bin/env node

/**
 * Quick test script for the testimonials webhook
 * 
 * Usage:
 * node scripts/test-testimonials-webhook.mjs
 */

import https from 'https'
import http from 'http'

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/testimonials'
const WEBHOOK_SECRET = process.env.TESTIMONIALS_WEBHOOK_SECRET || 'your-secret-key-here'

const testData = {
  Timestamp: new Date().toISOString(),
  'Name, Grade and School': 'John Doe, 10th grade, Test High School',
  'Program(s) enrolled (Select all that apply)': 'Tutoring, AES CHAMPIONS Competitions',
  'How would you describe your experience with your ACHARYA tutor(s)/mentor(s) ?\nWhat stands out most about their teaching or mentoring style?': 'This is a test testimonial. AES has been wonderful for our family!',
  'Did the tutor/mentor provide clarity, motivation, or customized support (1 - being not well  ;; 5 - exceptionally well) ': '5',
  'Before : What were your expectations when you first joined ACHARYA with respect to specific goals, grades, confidence and programs ?\n\nAfter: What changes did you notice after joining and how has ACHARYA made a difference with your (your child\'s future plans) ?': 'Before: Expected basic tutoring. After: Exceeded all expectations with personalized support!',
  'Please share a specific success story or milestone achieved with the help of ACHARYA.': 'Improved math grade from B to A+ and gained confidence.',
  'May we feature your testimonial on our website and other marketing materials (flyers, posters, social media)? ': 'Yes'
}

console.log('🧪 Testing Testimonials Webhook')
console.log('================================')
console.log('URL:', WEBHOOK_URL)
console.log('Data:', JSON.stringify(testData, null, 2))
console.log('================================\n')

const url = new URL(WEBHOOK_URL)
const isHttps = url.protocol === 'https:'
const client = isHttps ? https : http

const postData = JSON.stringify(testData)

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${WEBHOOK_SECRET}`
  }
}

const req = client.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`)
  console.log('Headers:', JSON.stringify(res.headers, null, 2))
  console.log('\nResponse:')
  
  let data = ''
  
  res.on('data', (chunk) => {
    data += chunk
  })
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data)
      console.log(JSON.stringify(parsed, null, 2))
      
      if (res.statusCode === 200) {
        console.log('\n✅ Test passed! Testimonial webhook is working.')
      } else {
        console.log('\n❌ Test failed. Check the error message above.')
      }
    } catch (e) {
      console.log(data)
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Error:', error.message)
  console.log('\nMake sure your Next.js server is running and the webhook URL is correct.')
})

req.write(postData)
req.end()
