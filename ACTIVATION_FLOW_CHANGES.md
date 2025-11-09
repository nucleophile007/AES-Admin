# Activation Flow Simplification

## Summary
Simplified the student/teacher activation flow to make it straightforward:

1. **Admin adds student/teacher** → `password: null`, `isActivated: false`
2. **Admin sends activation email** → Student/teacher receives link
3. **Student/teacher clicks link** → Sets password (bcrypted) → `isActivated: true`

## Changes Made

### 1. Prisma Schema Updates ✅
**File**: `prisma/schema.prisma`

- Changed `password` field from `String @default("temp123")` to `String?` (nullable) for both:
  - `Teacher` model (line 42)
  - `Student` model (line 57)
- Removed default password values
- Kept `isActivated Boolean @default(false)` as is

### 2. Student Creation API ✅
**File**: `src/app/api/admin/students/route.ts`

- Updated POST endpoint to NOT set a password when creating student
- Password is now `null` by default
- `isActivated` defaults to `false` (from schema)

### 3. Teacher Creation API ✅
**File**: `src/app/api/admin/teachers/route.ts`

- Updated POST endpoint to NOT set a password when creating teacher
- Password is now `null` by default
- `isActivated` defaults to `false` (from schema)

### 4. Student UI Updates ✅
**File**: `src/app/admin/students/page.tsx`

- Removed `isActive` field from Student interface (was incorrect, only `isActivated` exists)
- Removed `toggleStudentStatus()` function - no manual activation/deactivation
- Simplified status display to only show "Activated" or "Pending Activation"
- Only action available is "Send Activation" email for non-activated students

### 5. Activation Route (Already Correct!) ✅
**File**: `src/app/api/auth/activate/route.ts`

This file already implements the correct flow:
- Verifies activation token
- Accepts password from user
- Hashes password with bcrypt (10 rounds)
- Updates user record with hashed password
- Sets `isActivated: true`
- Marks token as used

## Database Migration Required ⚠️

You need to run this SQL on your database to update existing data:

```sql
-- Make password fields nullable
ALTER TABLE "Teacher" ALTER COLUMN "password" DROP DEFAULT;
ALTER TABLE "Teacher" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "Student" ALTER COLUMN "password" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "password" DROP NOT NULL;

-- Clear existing temp passwords (optional, but recommended)
UPDATE "Teacher" SET "password" = NULL WHERE "password" = 'temp123';
UPDATE "Student" SET "password" = NULL WHERE "password" = 'temp123';
```

**Note**: The migration couldn't be run automatically due to database connection issues. Please run it manually in your Supabase SQL editor or when the database is accessible.

Alternatively, when your database is accessible, run:
```bash
npm run db:push
```

## Flow Verification

### For New Students/Teachers:
1. ✅ Admin creates student via UI → password is `null`, `isActivated: false`
2. ✅ Admin clicks "Send Activation" → Activation email sent
3. ✅ Student clicks link → Sets password → bcrypt hashes it → `isActivated: true`

### For Existing Students/Teachers:
After running the migration:
- Existing users with `password: "temp123"` will have `password: null`
- They'll need to use the activation flow to set a real password
- `isActivated` will remain at their current value

## Files Changed
- ✅ `prisma/schema.prisma` - Made password nullable for Teacher and Student
- ✅ `src/app/api/admin/students/route.ts` - Remove default password on creation
- ✅ `src/app/api/admin/teachers/route.ts` - Remove default password on creation  
- ✅ `src/app/admin/students/page.tsx` - Simplified UI, removed toggle button
- ✅ `src/app/api/auth/activate/route.ts` - Already correct (no changes needed)

## Next Steps
1. Run the database migration when connection is available
2. Test the complete flow:
   - Create a new student
   - Send activation email
   - Click link and set password
   - Verify login works with new password
