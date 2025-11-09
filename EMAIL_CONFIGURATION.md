# Email Configuration Summary

## Changes Made

### 1. Environment Variables Updated ✅
**File**: `.env`

- Changed `NEXT_PUBLIC_BASE_URL` from `https://admin.acharyaes.com/` to `http://localhost:3000`
- This ensures activation links use localhost during development

### 2. Email Sending Configuration ✅
**File**: `src/app/api/jobs/send-activation-email/route.ts`

Updated to use your existing SMTP credentials:
- `SMTP_HOST`: smtp.gmail.com
- `SMTP_PORT`: 465
- `SMTP_USER`: dkdps3212@gmail.com
- `SMTP_PASSWORD`: qjpjkizzfwcfdzqy
- `SMTP_FROM`: "U-ACHIEVE" <dkdps3212@gmail.com>

### 3. URL Fixes ✅
- Removed double slash issue in activation links
- Fixed Next.js 15 params warning (await params)

## How It Works Now

### When Admin Sends Activation Email:

1. **Admin clicks "Send Activation"** for a student
2. **System creates activation token** and saves it in database
3. **Email is sent via Gmail SMTP** with activation link
4. **Activation link format**: `http://localhost:3000/auth/activate?token=xxx`
5. **Email received** by student with link and instructions

### When Student Activates Account:

1. **Student clicks link** in email
2. **Arrives at activation page** at `/auth/activate?token=xxx`
3. **Sets their password**
4. **Password is hashed** with bcrypt (10 rounds)
5. **Account activated**: `isActivated: true`, password saved
6. **Can now log in** with their email and password

## Test the Complete Flow

1. **Create a new student** in the admin panel
2. **Click "Send Activation"** button
3. **Check the student's email** - they should receive:
   - Subject: "Activate Your Student Account"
   - Blue button: "Activate Your Account"
   - Activation link that goes to: `http://localhost:3000/auth/activate?token=...`
4. **Student clicks the link**
5. **Student sets password** (minimum 8 characters)
6. **Success!** Student can now log in

## Email Template

The activation email includes:
- Welcome message
- Role information (Student/Teacher)
- Activation button (blue, clickable)
- Plain text link (as fallback)
- 24-hour expiration notice
- Professional formatting with Acharya Education branding

## Troubleshooting

### If email doesn't send:
1. Check Gmail SMTP is enabled for the account
2. Verify the app password is correct
3. Check terminal logs for SMTP errors
4. Look for: "Email sent successfully! MessageId: ..."

### If activation link doesn't work:
1. Token expires after 24 hours
2. Token can only be used once
3. Check if token exists in database: `ActivationRequest` table

## Production Ready

When deploying to production:
- Change `NEXT_PUBLIC_BASE_URL` back to `https://admin.acharyaes.com`
- Consider using a professional email service (Resend, SendGrid)
- Keep SMTP as fallback
- Monitor email delivery rates
