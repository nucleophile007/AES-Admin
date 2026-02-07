#!/usr/bin/env node

/**
 * Generate a secure webhook secret
 * Run: node scripts/generate-webhook-secret.mjs
 */

import crypto from 'crypto'

console.log('\n🔐 Generating secure webhook secret...\n')

const secret = crypto.randomBytes(32).toString('hex')

console.log('✅ Your webhook secret:')
console.log('=' .repeat(70))
console.log(secret)
console.log('='.repeat(70))
console.log('\nAdd this to your .env.local file:')
console.log(`TESTIMONIALS_WEBHOOK_SECRET=${secret}`)
console.log('\n⚠️  Keep this secret secure and never commit it to version control!\n')
