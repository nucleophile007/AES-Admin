# Student Activation Email Flow

## Complete Flow Overview

The activation system allows admins to send activation emails to students/teachers so they can set their passwords and access the platform.

## Step-by-Step Process

### 1. Admin Triggers Activation Email

**Location**: `/admin/students` page

**Action**: Admin clicks "Send Activation" button for a student

**Code**: `src/app/admin/students/page.tsx`
```javascript
async function handleSendActivation(id: number, email: string) {
  const res = await fetch(`/api/admin/students/${id}/send-activation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
}
```

---

### 2. Backend Creates Activation Request

**API Endpoint**: `POST /api/admin/students/[id]/send-activation`

**File**: `src/app/api/admin/students/[id]/send-activation/route.ts`

**What Happens**:

1. **Verify Admin Permission**
   - Checks if user is authenticated
   - Verifies email is in allowed admin list

2. **Find Student**
   - Looks up student by ID in database

3. **Generate Activation Token**
   ```javascript
   const activationToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15) +
                          Date.now().toString(36);
   ```

4. **Create/Update ActivationRequest in Database**
   ```javascript
   await prisma.activationRequest.upsert({
     where: { 
       email_role: { email, role: "STUDENT" }
     },
     update: {
       token: activationToken,
       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
       isUsed: false
     },
     create: {
       email,
       role: "STUDENT",
       token: activationToken,
       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
       userId: student.id
     }
   })
   ```

5. **Call Email Service**
   - Makes internal API call to `/api/jobs/send-activation-email`

---

### 3. Email Service Sends Activation Email

**API Endpoint**: `POST /api/jobs/send-activation-email`

**File**: `src/app/api/jobs/send-activation-email/route.ts`

**Email Providers** (tries in order):

1. **Development Mode** (if no email configured)
   - Logs activation link to console
   - Returns activation link in response
   - **You see the link in terminal output**

2. **Resend** (if `RESEND_API_KEY` is set)
   - Professional email service
   - From: `Acharya Education <noreply@acharyatutoring.com>`

3. **Nodemailer/SMTP** (if SMTP variables are set)
   - Uses configured SMTP server
   - Currently using Gmail SMTP in your case:
     - Host: `smtp.gmail.com`
     - Port: `465` (secure)
     - User: `dkdps3212@gmail.com`
     - From: `"ACHARYA" <dkdps3212@gmail.com>`

**Activation Link Format**:
```
http://localhost:3000/auth/activate?token=abc123xyz789
```

**Email Content**:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2>Welcome to Acharya Education!</h2>
  <p>Hello {name},</p>
  <p>You have been registered as a student. Click the button below to set your password:</p>
  
  <a href="{activationLink}" style="...button styles...">
    Activate Your Account
  </a>
  
  <p>This link will expire in 24 hours.</p>
  <p>If you can't click the button, copy this URL: {activationLink}</p>
</div>
```

---

### 4. Student Receives Email

**Email Contains**:
- Welcome message with student's name
- Blue "Activate Your Account" button
- Activation link (clickable)
- Plain text version of link (in case button doesn't work)
- Expiration notice (24 hours)

**What Student Sees**:
```
Subject: Activate Your Student Account

Welcome to Acharya Education!

Hello [Student Name],

You have been registered as a student in our system. 
To complete your registration and set your password, 
please click the button below:

[Activate Your Account Button]

This link will expire in 24 hours.

If you can't click the button, copy and paste this URL:
http://localhost:3000/auth/activate?token=...
```

---

### 5. Student Clicks Activation Link

**Page**: `http://localhost:3000/auth/activate?token=abc123xyz789`

**File**: `src/app/auth/activate/page.tsx`

**What Happens**:

1. **Token Verification** (GET request)
   - Calls `GET /api/auth/activate?token=...`
   - Validates token exists and hasn't expired
   - Returns student info (name, email)

2. **Password Form Displayed**
   ```
   Welcome back, [Student Name]!
   Email: [student@email.com]
   
   Create Your Password:
   [Password Input]
   [Confirm Password Input]
   
   [Activate Account Button]
   ```

3. **Password Validation**
   - Must be at least 8 characters
   - Password and confirm password must match

---

### 6. Student Submits Password

**API Call**: `POST /api/auth/activate`

**File**: `src/app/api/auth/activate/route.ts`

**What Happens**:

1. **Validate Token Again**
   - Checks token exists
   - Verifies not already used
   - Confirms not expired

2. **Hash Password**
   ```javascript
   const hashedPassword = await bcrypt.hash(password, 10)
   ```

3. **Update Student Record**
   ```javascript
   await prisma.student.update({
     where: { id: activationRequest.userId },
     data: {
       password: hashedPassword,
       isActivated: true
     }
   })
   ```

4. **Mark Token as Used**
   ```javascript
   await prisma.activationRequest.update({
     where: { id: activationRequest.id },
     data: { isUsed: true }
   })
   ```

5. **Success Response**
   - Shows success message
   - Provides redirect to sign-in page

---

### 7. Success State

**What Student Sees**:
```
✓ Account Activated Successfully!

Your account has been activated. You can now sign in with your credentials.

[Go to Sign In]
```

**Database State**:
- Student record: `password` set (hashed), `isActivated = true`
- ActivationRequest: `isUsed = true`

---

## Database Schema

### ActivationRequest Model
```prisma
model ActivationRequest {
  id        Int      @id @default(autoincrement())
  email     String
  role      String   // "STUDENT", "TEACHER", or "ADMIN"
  token     String   @unique
  userId    Int
  expiresAt DateTime
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@unique([email, role])
}
```

### Student Model (relevant fields)
```prisma
model Student {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  password    String?  // NULL until activated
  isActivated Boolean  @default(false)
  // ... other fields
}
```

---

## Environment Variables Used

### Required for Email Sending

**SMTP Configuration** (Currently Active):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=dkdps3212@gmail.com
SMTP_PASSWORD=qjpjkizzfwcfdzqy
SMTP_FROM="ACHARYA" <dkdps3212@gmail.com>
```

**Application URL**:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Optional Email Providers

**Resend** (Professional service):
```env
RESEND_API_KEY=your_api_key
```

**Alternative SMTP Variables**:
```env
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=password
EMAIL_FROM=noreply@example.com
```

---

## Token Security

### Token Generation
- **Format**: Random alphanumeric string + timestamp
- **Length**: ~40-50 characters
- **Uniqueness**: Guaranteed by database constraint
- **Example**: `abc123xyz789def456uvw012ghi789jkl3451730123456`

### Token Properties
- **Expiration**: 24 hours from creation
- **Single Use**: Marked as `isUsed` after activation
- **Secure Storage**: Stored in database, not in URL after use

### Validation Checks
1. Token exists in database
2. Token hasn't been used (`isUsed = false`)
3. Token hasn't expired (`expiresAt > now()`)
4. Associated user exists

---

## Error Handling

### Common Errors and Messages

**Invalid Token**:
```
"Invalid activation token"
```
**Causes**:
- Token doesn't exist
- Typo in URL
- Token was deleted

**Expired Token**:
```
"This activation link has expired"
```
**Causes**:
- More than 24 hours have passed
- Student took too long to activate

**Already Used**:
```
"This activation link has already been used"
```
**Causes**:
- Student already activated account
- Trying to use same link twice

**Password Too Short**:
```
"Password must be at least 8 characters"
```

**Passwords Don't Match**:
```
"Passwords do not match"
```

---

## Development Mode

When running locally without email configuration, the system logs activation links to the console:

```
========== ACTIVATION EMAIL (DEV MODE) ==========
To: student@example.com (John Doe)
Role: STUDENT
Token: abc123xyz789def456...
Activation Link: http://localhost:3000/auth/activate?token=abc123xyz789...
===============================================
```

**How to Use in Dev Mode**:
1. Admin clicks "Send Activation"
2. Check terminal output for activation link
3. Copy the link
4. Open in browser or send to student manually

---

## API Endpoints Summary

### 1. Send Activation Email
```
POST /api/admin/students/[id]/send-activation
Auth: Required (Admin only)
Body: { email: string }
Returns: { success: true, activationLink?: string }
```

### 2. Email Service
```
POST /api/jobs/send-activation-email
Body: { email, name, token, role }
Returns: { success: true, provider: "smtp"|"resend"|"dev" }
```

### 3. Verify Token (GET)
```
GET /api/auth/activate?token=...
Returns: { user: { name, email, role, expiresAt } }
```

### 4. Activate Account (POST)
```
POST /api/auth/activate
Body: { token, password }
Returns: { success: true }
```

---

## Testing the Flow

### Manual Test Steps

1. **Create a student** (if not exists)
   - Go to `/admin/students`
   - Click "Add Student"
   - Fill in details
   - Save

2. **Send activation email**
   - Find student in list
   - Click "Send Activation" button
   - Check terminal for activation link (dev mode)

3. **Check email** (if SMTP configured)
   - Student receives email
   - Click activation link in email

4. **Activate account**
   - Opens activation page
   - Enter password (min 8 characters)
   - Confirm password
   - Click "Activate Account"

5. **Verify activation**
   - Success message appears
   - Go to sign-in page
   - Try logging in with new credentials
   - Check database: `isActivated = true`

---

## Current Configuration

Based on your `.env` file:

✅ **Email Sending**: ENABLED via Gmail SMTP
- Host: smtp.gmail.com
- Port: 465 (secure)
- From: "ACHARYA" <dkdps3212@gmail.com>

✅ **Base URL**: http://localhost:3000

✅ **Activation Links**: Will be sent via email to students

---

## Troubleshooting

### Email Not Received

**Check**:
1. SMTP credentials are correct
2. Gmail allows "less secure apps" or use App Password
3. Check spam/junk folder
4. Look at terminal logs for errors

**Solution**: Use dev mode activation link from terminal

### Token Expired

**Solution**: Admin must send new activation email

### Can't Set Password

**Check**:
1. Password is at least 8 characters
2. Passwords match
3. Token hasn't been used already

### Database Errors

**Check**:
1. Student exists in database
2. ActivationRequest was created
3. Database connection is working

---

## Future Improvements

1. **Email Templates**: Use React Email or MJML for better designs
2. **Token Refresh**: Allow resending activation emails
3. **Password Requirements**: Add complexity requirements (uppercase, numbers, symbols)
4. **Email Queue**: Use background jobs for email sending
5. **Email Tracking**: Track open rates and clicks
6. **Internationalization**: Multi-language support for emails
7. **Custom Domains**: Use custom email domain instead of Gmail
