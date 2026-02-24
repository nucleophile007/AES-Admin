# ============================================
# Testimonials Sync Setup Guide
# ============================================

## Overview
This guide helps you set up real-time syncing between Google Forms/Sheets and your testimonials database.

## Prerequisites
- Google Form that collects testimonials
- Google Sheet where form responses are stored
- Next.js application deployed (for webhook URL)

---

## 📋 Step 1: Provide Access to Google Sheet

### Option A: Make Sheet Publicly Viewable (Easiest)
1. Open your Google Sheet
2. Click **Share** button (top right)
3. Change "General access" to **"Anyone with the link"** → **Viewer**
4. Copy the link

### Option B: Service Account Access (More Secure - for manual sync)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Sheets API**
4. Create a **Service Account**:
   - IAM & Admin → Service Accounts → Create Service Account
   - Download JSON credentials
5. Share your Google Sheet with the service account email (found in JSON)

---

## 🔄 Step 2: Real-Time Sync Setup (Google Apps Script)

### A. Set Up Webhook Secret
1. Add to your `.env.local` file:
   ```env
   TESTIMONIALS_WEBHOOK_SECRET=your-super-secret-random-string-here
   ```
2. Deploy your Next.js app
3. Your webhook URL will be: `https://your-domain.com/api/webhooks/testimonials`

### B. Add Google Apps Script to Your Form
1. Open your Google Form
2. Click three dots (⋮) → **Script editor**
3. Copy the code from `scripts/google-apps-script-webhook.js`
4. Update these values in the script:
   ```javascript
   const WEBHOOK_URL = 'https://your-domain.com/api/webhooks/testimonials'
   const WEBHOOK_SECRET = 'your-super-secret-random-string-here'
   ```

### C. Update Field Mappings
In the `onFormSubmit` function, map your form questions to database fields:
```javascript
// Example: If your form asks "What is your full name?"
if (question.includes('full name')) {
  data.authorName = answer
}
```

### D. Set Up Trigger
1. In Apps Script editor, click the **clock icon** (Triggers)
2. Click **+ Add Trigger**
3. Configure:
   - Function: `onFormSubmit`
   - Event source: `From spreadsheet`
   - Event type: `On form submit`
4. Click **Save**
5. Authorize the script when prompted

### E. Test the Connection
1. In Apps Script editor, select `testWebhook` function
2. Click **Run** (▶️ button)
3. Check **View** → **Logs** to see results
4. Verify a test testimonial appears in your database

---

## 📥 Step 3: Import Existing Data (One-Time)

### Using Manual Sync Script (Recommended)

#### A. Set Up Google Sheets API Credentials
1. In Google Cloud Console, create a service account (see Step 1, Option B)
2. Download credentials JSON file
3. Save it as `google-sheets-credentials.json` in your project root
4. Add to `.gitignore`:
   ```
   google-sheets-credentials.json
   ```

#### B. Update Environment Variables
Add to `.env.local`:
```env
GOOGLE_SHEET_ID=1ZOXJtQkpkNyG5C22jO6el3GAHTT-q27ZB8DY7HXW2Mk
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-sheets-credentials.json
```

Or use credentials directly:
```env
GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...",...}'
```

#### C. Install Required Package
```bash
npm install googleapis
```

#### D. Run the Sync Script
```bash
npx tsx scripts/sync-testimonials-from-sheet.ts
```

### Using Google Apps Script (Alternative)
1. Open Apps Script editor
2. Select `syncExistingResponses` function
3. Click **Run** (▶️ button)
4. This will send all existing rows to your webhook

---

## 🔐 Step 4: Security Best Practices

### 1. Generate Strong Webhook Secret
```bash
# Use this command to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Add Rate Limiting (Optional)
Install rate limiting package:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Then update the webhook endpoint with rate limiting.

### 3. IP Whitelisting (Advanced)
If using static IP for Google Apps Script, add IP verification to webhook.

---

## 🧪 Testing

### 1. Test Webhook Endpoint
```bash
curl -X GET https://your-domain.com/api/webhooks/testimonials
```

Expected response:
```json
{
  "status": "active",
  "message": "Testimonials webhook endpoint is ready",
  "timestamp": "2026-01-31T..."
}
```

### 2. Test with Sample Data
```bash
curl -X POST https://your-domain.com/api/webhooks/testimonials \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "Test Student",
    "authorName": "Test Parent",
    "authorType": "parent",
    "content": "Great experience!",
    "grade": "10th",
    "rating": 5
  }'
```

### 3. Submit Test Form
1. Fill out your Google Form
2. Check Apps Script logs: View → Logs
3. Verify testimonial appears in database

---

## 📝 Field Mapping Reference

Update these mappings based on your actual form questions:

| Form Question | Database Field | Type |
|--------------|---------------|------|
| "Student Name" | `studentName` | string |
| "Your Name" | `authorName` | string |
| "Are you a Student or Parent?" | `authorType` | string |
| "Share your experience" | `content` | string |
| "Grade" | `grade` | string |
| "School Name" | `school` | string |
| "Program(s)" | `programs` | string[] |
| "Rating (1-5)" | `rating` | number |
| "Video Link (optional)" | `videoLink` | string |
| "Consent to Feature" | `consentToFeature` | boolean |

---

## 🐛 Troubleshooting

### Webhook Not Receiving Data
1. Check Apps Script logs for errors
2. Verify webhook URL is correct and accessible
3. Ensure webhook secret matches in both places
4. Check your Next.js application logs

### Database Not Updating
1. Check database connection in `.env`
2. Verify Prisma schema matches your database
3. Run `npx prisma db push` if schema changed
4. Check API logs for errors

### Field Mapping Issues
1. Check exact spelling of form questions
2. Use Apps Script Logger to see data structure
3. Update mapping logic in both scripts

### Authentication Errors
1. Verify service account has access to sheet
2. Check credentials JSON is valid
3. Ensure API is enabled in Google Cloud Console

---

## 🚀 Production Checklist

- [ ] Webhook secret is strong and stored securely
- [ ] Webhook endpoint is deployed and accessible
- [ ] Google Apps Script trigger is active
- [ ] Field mappings match your form questions
- [ ] Test form submission works end-to-end
- [ ] Existing data has been imported
- [ ] Error logging/notifications are set up
- [ ] Database backups are configured

---

## 📊 Monitoring

### Check Sync Status
```sql
-- Recent testimonials
SELECT id, authorName, authorType, content, submittedAt, isApproved
FROM "Testimonial"
ORDER BY submittedAt DESC
LIMIT 10;

-- Count by approval status
SELECT isApproved, COUNT(*) as count
FROM "Testimonial"
GROUP BY isApproved;
```

### Apps Script Logs
- View → Logs (in Apps Script editor)
- Or set up email notifications for errors

---

## 🔄 How It Works

```
┌─────────────┐
│ Google Form │
└──────┬──────┘
       │ User submits
       ▼
┌─────────────────┐
│  Google Sheet   │
└──────┬──────────┘
       │ Triggers Apps Script
       ▼
┌─────────────────────┐
│  Apps Script        │
│  onFormSubmit()     │
└──────┬──────────────┘
       │ HTTP POST
       ▼
┌───────────────────────────┐
│  Next.js Webhook API      │
│  /api/webhooks/testimonials │
└──────┬────────────────────┘
       │ Validates & saves
       ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  Testimonials   │
└─────────────────┘
```

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Apps Script execution logs
3. Check Next.js application logs
4. Verify database connection
5. Test webhook endpoint manually

---

## 📚 Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Documentation](https://www.prisma.io/docs)
