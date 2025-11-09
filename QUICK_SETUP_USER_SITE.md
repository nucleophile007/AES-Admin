# Quick Setup Guide: User Site Activation

## What Changed in Admin Site

### 1. Environment Variable Added
**File**: `.env`
```env
# Add this line
USER_SITE_URL=http://localhost:3001
```

### 2. Activation Email Updated
**File**: `src/app/api/jobs/send-activation-email/route.ts`

**Change**: Activation links now point to `USER_SITE_URL` instead of admin site.

```javascript
// Before: http://localhost:3000/auth/activate?token=...
// After:  http://localhost:3001/auth/activate?token=...
```

## What You Need to Do Next

### Step 1: Update .env File
Already done! ✅

Your admin site will now send activation links to:
- **Dev**: `http://localhost:3001/auth/activate?token=...`
- **Production**: Update `USER_SITE_URL` to your user site domain

### Step 2: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Restart to load new USER_SITE_URL
npm run dev
```

### Step 3: Set Up User Site
You mentioned you'll create the activation code on the user site. Here's what you need:

#### Files to Create on User Site:

**1. Activation Page**: `src/app/auth/activate/page.tsx`
- You can copy from admin site: `/Users/mac/AES-Admin/src/app/auth/activate/page.tsx`
- Or write your own implementation

**2. Activation API**: `src/app/api/auth/activate/route.ts`
- You can copy from admin site: `/Users/mac/AES-Admin/src/app/api/auth/activate/route.ts`
- Or write your own implementation

**3. Prisma Setup**: 
- Copy `prisma/schema.prisma` from admin site
- Configure same DATABASE_URL in user site `.env`
- Run `npx prisma generate`

#### User Site .env Configuration:
```env
# User Site URL
NEXT_PUBLIC_BASE_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001

# SAME database as admin site
DATABASE_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:Aqweds123%40321@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=10
DIRECT_URL=postgresql://postgres.dqjrtknsfbczrqlkxuab:Aqweds123%40321@aws-1-us-west-1.pooler.supabase.com:5432/postgres

# NextAuth Secret (generate a new one)
NEXTAUTH_SECRET=your_new_secret_here
```

## Testing the Flow

### Current Behavior (After Changes):

1. **Admin sends activation** (Admin Site - port 3000)
   ```
   Go to: http://localhost:3000/admin/students
   Click: "Send Activation" for any student
   ```

2. **Check email or terminal**
   - Email will contain link to: `http://localhost:3001/auth/activate?token=...`
   - Terminal (dev mode) shows: `User Site: http://localhost:3001`

3. **Student clicks link**
   - Opens: `http://localhost:3001/auth/activate?token=...`
   - Goes to USER SITE (not admin site)

4. **User site handles activation**
   - Your user site code will show password form
   - Student sets password
   - Database updated (shared with admin site)

5. **Both sites see changes**
   - Admin site: Student status shows "Activated"
   - User site: Student can login

## Production Configuration

When you deploy to production:

### Admin Site .env
```env
USER_SITE_URL=https://app.yourdomain.com
# or
USER_SITE_URL=https://student.acharyatutoring.com
```

### Example URLs

**If your domains are:**
- Admin: `https://admin.acharyatutoring.com`
- User: `https://app.acharyatutoring.com`

**Then set:**
```env
# In admin site .env
USER_SITE_URL=https://app.acharyatutoring.com
```

**Activation email will contain:**
```
https://app.acharyatutoring.com/auth/activate?token=abc123xyz
```

## Quick Reference

### Admin Site (This Project)
- **Purpose**: Management dashboard for admins
- **Port**: 3000 (dev)
- **Sends**: Activation emails with user site links
- **Database**: Supabase PostgreSQL

### User Site (Your Other Project)
- **Purpose**: Student/teacher portal
- **Port**: 3001 (dev)
- **Handles**: Activation, login, learning features
- **Database**: SAME Supabase PostgreSQL

### Shared Resources
- ✅ Same database
- ✅ Same Prisma schema
- ✅ Same ActivationRequest table
- ✅ Same Student/Teacher tables

## What Works Now

✅ Admin can send activation emails
✅ Emails contain user site activation link
✅ Token is stored in shared database
✅ User site can read token from database

## What You Need to Implement

📝 User site activation page (`/auth/activate`)
📝 User site activation API (`/api/auth/activate`)
📝 User site login functionality
📝 User site dashboard/features

## Files You Can Copy (If Needed)

From admin site to user site:

```
/Users/mac/AES-Admin/src/app/auth/activate/page.tsx
  → Copy to user site

/Users/mac/AES-Admin/src/app/api/auth/activate/route.ts
  → Copy to user site

/Users/mac/AES-Admin/prisma/schema.prisma
  → Copy to user site

/Users/mac/AES-Admin/src/lib/prisma.ts
  → Copy to user site
```

## Summary

✅ **Admin site changes complete**
- Activation emails now point to USER_SITE_URL
- Default: http://localhost:3001
- Configurable via .env

📝 **Your next task**
- Set up user site with activation code
- Use same database as admin site
- Implement `/auth/activate` page and API

🔗 **The connection**
- Admin creates token → Stored in shared DB
- Email sent → Points to user site
- User activates → Updates shared DB
- Both sites see the data
