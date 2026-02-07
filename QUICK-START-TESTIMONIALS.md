# 🚀 Quick Start Guide - Testimonials Sync

## Setup (One-Time)

### 1. Generate Webhook Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to `.env.local`:
```env
TESTIMONIALS_WEBHOOK_SECRET=paste-generated-secret-here
```

### 2. Deploy Your App
Deploy to get your webhook URL: `https://your-domain.com/api/webhooks/testimonials`

### 3. Set Up Google Apps Script
1. Open your Google Form → ⋮ → Script editor
2. Copy code from [scripts/google-apps-script-webhook.js](./scripts/google-apps-script-webhook.js)
3. Update `WEBHOOK_URL` and `WEBHOOK_SECRET` in the script
4. Clock icon → Add Trigger → `onFormSubmit` → From spreadsheet → On form submit
5. Save & authorize

### 4. Import Existing Data (Optional)
```bash
# Install dependencies
npm install googleapis

# Add to .env.local
GOOGLE_SHEET_ID=1ZOXJtQkpkNyG5C22jO6el3GAHTT-q27ZB8DY7HXW2Mk
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-sheets-credentials.json

# Run sync
npm run testimonials:sync
```

---

## 🧪 Testing

### Test Webhook Locally
```bash
# Start your dev server
npm run dev

# In another terminal, test the webhook
npm run testimonials:test-webhook
```

### Test with Real Form
1. Submit your Google Form
2. Check Apps Script logs (View → Logs)
3. Verify in database:
   ```sql
   SELECT * FROM "Testimonial" ORDER BY "createdAt" DESC LIMIT 5;
   ```

---

## 📝 How to Provide Sheet Access

### For Manual Sync (Option A - Easier):
1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google Sheets API
3. Create Service Account → Download JSON credentials
4. Share your Google Sheet with the service account email

### For Viewing Only (Option B):
1. Open your Google Sheet
2. Share → "Anyone with the link" → Viewer
3. Send me the link

---

## 🔄 How Real-Time Sync Works

```
User submits form → Google Sheet updates → Apps Script triggers
→ Sends POST to webhook → Saves to database
```

**Time**: ~1-2 seconds from submission to database

---

## 🛠️ Files Created

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/testimonials/route.ts` | Webhook endpoint that receives data |
| `scripts/google-apps-script-webhook.js` | Script to add to Google Form |
| `scripts/sync-testimonials-from-sheet.ts` | One-time import of existing data |
| `scripts/test-testimonials-webhook.mjs` | Test the webhook locally |
| `TESTIMONIALS-SYNC-GUIDE.md` | Complete documentation |

---

## 🐛 Troubleshooting

**Webhook not working?**
- Check Apps Script execution logs
- Verify webhook secret matches
- Test with: `npm run testimonials:test-webhook`

**Can't import existing data?**
- Verify service account has access to sheet
- Check credentials file path
- Ensure GOOGLE_SHEET_ID is correct

**Field mapping issues?**
- Update mappings in both webhook route and Apps Script
- Check exact column names in your sheet

---

## 📞 Need Help?

See full documentation: [TESTIMONIALS-SYNC-GUIDE.md](./TESTIMONIALS-SYNC-GUIDE.md)
