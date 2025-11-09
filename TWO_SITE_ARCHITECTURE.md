# Two-Site Architecture: Admin Site & User Site

## Overview

Your application is split into **two separate sites** that share the same database:

1. **Admin Site** (this repository - AES-Admin)
   - URL: `http://localhost:3000` (dev) / Your admin domain (production)
   - Purpose: Admin dashboard for managing students, teachers, enrollments, etc.
   - Users: Only authorized admins can access

2. **User Site** (separate repository)
   - URL: `http://localhost:3001` (dev) / Your user domain (production)
   - Purpose: Student/teacher portal for activation, login, and learning
   - Users: Students and teachers

## Database Sharing

Both sites connect to the **same PostgreSQL database** on Supabase:
```
Database: postgres.dqjrtknsfbczrqlkxuab (Supabase)
```

This allows:
- Admin creates students/teachers → stored in database
- Students/teachers activate on user site → updates same database
- Both sites see the same data in real-time

## Activation Flow

### 1. Admin Sends Activation (Admin Site)
- Admin clicks "Send Activation" on student/teacher
- Admin site creates `ActivationRequest` in database
- Generates unique token

### 2. Email Sent with User Site Link
- Email contains activation link pointing to **User Site**
- Example: `http://localhost:3001/auth/activate?token=abc123xyz`
- NOT: ~~`http://localhost:3000/auth/activate`~~ (admin site)

### 3. Student/Teacher Activates (User Site)
- Opens link → goes to user site
- User site reads token from database
- Student sets password on user site
- User site updates database: `isActivated = true`, stores password

### 4. Both Sites Updated
- Admin site: Sees `isActivated = true` status
- User site: Student can now login

## Configuration

### Environment Variables

#### Admin Site (.env)
```env
# Admin Site URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# User Site URL (where activation happens)
USER_SITE_URL=http://localhost:3001

# Shared Database
DATABASE_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:...@aws-1-us-west-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:...@aws-1-us-west-1.pooler.supabase.com:5432/postgres

# Email Configuration (Admin sends emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=dkdps3212@gmail.com
SMTP_PASSWORD=qjpjkizzfwcfdzqy
SMTP_FROM="ACHARYA" <dkdps3212@gmail.com>
```

#### User Site (.env)
```env
# User Site URL
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001

# Shared Database (same as admin)
DATABASE_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:...@aws-1-us-west-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:...@aws-1-us-west-1.pooler.supabase.com:5432/postgres
```

## Updated Files

### Admin Site Changes

#### 1. `.env`
Added:
```env
USER_SITE_URL=http://localhost:3001
```

#### 2. `src/app/api/jobs/send-activation-email/route.ts`
```javascript
// OLD: Used admin site URL
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

// NEW: Uses user site URL
const userSiteUrl = process.env.USER_SITE_URL || 
                    process.env.NEXT_PUBLIC_BASE_URL || 
                    'http://localhost:3000'
const activationLink = `${userSiteUrl}/auth/activate?token=${token}`
```

### User Site Setup (What You Need to Do)

#### 1. Create User Site Project
```bash
# In a separate directory
npx create-next-app@latest aes-user
cd aes-user
```

#### 2. Install Dependencies
```bash
npm install @prisma/client next-auth bcrypt
npm install -D prisma @types/bcrypt
```

#### 3. Copy Prisma Schema
Copy `prisma/schema.prisma` from admin site to user site:
```bash
# From admin site directory
cp prisma/schema.prisma ../aes-user/prisma/
```

#### 4. Copy Activation Files
Copy these files from admin site to user site:

**Authentication Pages:**
- `src/app/auth/activate/page.tsx`
- `src/app/auth/layout.tsx` (if exists)

**API Routes:**
- `src/app/api/auth/activate/route.ts`

**Utility Files:**
- `src/lib/prisma.ts`

#### 5. Configure Environment
Create `.env` in user site:
```env
# User Site URL
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001

# Shared Database (SAME as admin)
DATABASE_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:Aqweds123%40321@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10
DIRECT_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:Aqweds123%40321@aws-1-us-west-1.pooler.supabase.com:5432/postgres

# NextAuth Secret (generate new one)
NEXTAUTH_SECRET=your_secret_here
```

#### 6. Generate Prisma Client
```bash
cd aes-user
npx prisma generate
```

#### 7. Update next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use different port than admin site
  // Run with: npm run dev -- -p 3001
}

module.exports = nextConfig
```

#### 8. Update package.json
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

## Running Both Sites

### Development

**Terminal 1 - Admin Site:**
```bash
cd AES-Admin
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - User Site:**
```bash
cd aes-user
npm run dev
# Runs on http://localhost:3001
```

### Production

**Admin Site:**
```
Domain: admin.acharyatutoring.com (example)
Environment: USER_SITE_URL=https://app.acharyatutoring.com
```

**User Site:**
```
Domain: app.acharyatutoring.com (example)
Environment: NEXT_PUBLIC_BASE_URL=https://app.acharyatutoring.com
```

## Activation Flow Example

### Step-by-Step

1. **Admin creates student**
   - Admin site: `http://localhost:3000/admin/students`
   - Clicks "Add Student", fills form
   - Student saved to database

2. **Admin sends activation**
   - Clicks "Send Activation" button
   - Admin site calls `/api/admin/students/[id]/send-activation`
   - Creates `ActivationRequest` in database with token

3. **Email sent**
   - Admin site calls `/api/jobs/send-activation-email`
   - Email sent with link: `http://localhost:3001/auth/activate?token=abc123`
   - Note: Link points to **port 3001** (user site)

4. **Student receives email**
   ```
   Subject: Activate Your Student Account
   
   Click here: http://localhost:3001/auth/activate?token=abc123
   ```

5. **Student clicks link**
   - Opens in browser → goes to user site (port 3001)
   - User site page: `/auth/activate?token=abc123`

6. **User site verifies token**
   - User site calls `GET /api/auth/activate?token=abc123`
   - Reads from shared database
   - Shows password form if valid

7. **Student sets password**
   - Enters password (min 8 chars)
   - User site calls `POST /api/auth/activate`
   - Updates database: `Student.password = hashed`, `isActivated = true`
   - Marks token as used

8. **Activation complete**
   - User site shows success message
   - Student can now login on user site
   - Admin site sees updated status

## API Endpoints

### Admin Site APIs

**Send Activation:**
```
POST /api/admin/students/[id]/send-activation
Auth: Admin only
Purpose: Create activation token and send email
```

**Email Service:**
```
POST /api/jobs/send-activation-email
Purpose: Send activation email with user site link
Uses: USER_SITE_URL from .env
```

### User Site APIs (To Implement)

**Verify Token:**
```
GET /api/auth/activate?token=abc123
Purpose: Validate token and get user info
Returns: { user: { name, email, role } }
```

**Activate Account:**
```
POST /api/auth/activate
Body: { token, password }
Purpose: Set password and mark as activated
Returns: { success: true }
```

## Database Tables Used

### ActivationRequest
```prisma
model ActivationRequest {
  id        Int      @id @default(autoincrement())
  email     String
  role      String   // "STUDENT" or "TEACHER"
  token     String   @unique
  userId    Int
  expiresAt DateTime
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@unique([email, role])
}
```

### Student/Teacher
```prisma
model Student {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  password    String?  // NULL until activated
  isActivated Boolean  @default(false)
  // ... other fields
}
```

## Security Considerations

### Token Security
- **Unique**: Database constraint ensures uniqueness
- **Expiring**: 24-hour expiration
- **Single-use**: Marked as `isUsed` after activation
- **Unpredictable**: Random + timestamp based

### Password Security
- **Hashing**: bcrypt with 10 rounds
- **Minimum length**: 8 characters
- **Never stored plain text**

### Site Separation
- **Admin site**: Protected by admin authentication
- **User site**: Only activation and user login exposed
- **Database**: Shared but accessed with same credentials

## Troubleshooting

### Issue: Activation link goes to wrong site

**Check:**
```bash
# In admin site .env
USER_SITE_URL=http://localhost:3001  # Must be user site URL
```

### Issue: User site can't access database

**Check:**
```bash
# User site .env must have SAME database URL as admin site
DATABASE_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:...
```

### Issue: Token not found on user site

**Verify:**
1. Both sites use same database
2. Prisma schema is identical on both sites
3. Token was created on admin site
4. Token hasn't expired (< 24 hours)

### Issue: Can't run both sites at same time

**Solution:**
```bash
# Admin site runs on 3000
cd AES-Admin && npm run dev

# User site runs on 3001 (different port)
cd aes-user && npm run dev -- -p 3001
```

## Production Deployment

### Option 1: Separate Domains

**Admin Site:**
- Domain: `admin.yourdomain.com`
- Environment: `USER_SITE_URL=https://app.yourdomain.com`

**User Site:**
- Domain: `app.yourdomain.com`
- Environment: `NEXT_PUBLIC_BASE_URL=https://app.yourdomain.com`

### Option 2: Subpaths (Not Recommended)

**Admin Site:**
- URL: `yourdomain.com/admin`

**User Site:**
- URL: `yourdomain.com/app`

### Option 3: Different Ports (Development Only)

**Admin Site:**
- URL: `yourdomain.com:3000`

**User Site:**
- URL: `yourdomain.com:3001`

## Benefits of Two-Site Architecture

1. **Separation of Concerns**
   - Admin features separate from user features
   - Different authentication strategies
   - Independent deployment cycles

2. **Security**
   - Admin panel not exposed to regular users
   - Different security policies per site
   - Easier to secure admin endpoints

3. **Performance**
   - User site can be optimized for students/teachers
   - Admin site can have heavy management features
   - Independent scaling

4. **Flexibility**
   - Can use different UI frameworks
   - Different hosting providers
   - Independent version control

## Next Steps

1. ✅ **Done**: Updated admin site to send activation links to user site
2. 📝 **TODO**: Set up user site project
3. 📝 **TODO**: Copy activation files to user site
4. 📝 **TODO**: Configure user site environment variables
5. 📝 **TODO**: Test activation flow between both sites
6. 📝 **TODO**: Deploy both sites to production with proper domains

## File Checklist for User Site

### Required Files to Copy

- [ ] `prisma/schema.prisma`
- [ ] `src/lib/prisma.ts`
- [ ] `src/app/auth/activate/page.tsx`
- [ ] `src/app/api/auth/activate/route.ts`
- [ ] `.env` (configure with user site URL + shared database)

### Required Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^6.14.0",
    "bcrypt": "^5.1.1",
    "next": "15.4.6",
    "next-auth": "^4.24.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "prisma": "^6.14.0"
  }
}
```

## Summary

Your admin site now sends activation links to `USER_SITE_URL` (http://localhost:3001) instead of the admin site URL. This allows students and teachers to activate their accounts on a separate user-facing portal while sharing the same database with the admin site.

The activation flow is:
1. Admin site → Creates token in shared database
2. Admin site → Sends email with user site activation link
3. User site → Student opens link and sets password
4. Shared database → Updated with password and activation status
5. Both sites → See the updated data
