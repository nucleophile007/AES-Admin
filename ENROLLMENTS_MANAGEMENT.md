# Enrollments Management Feature

## Overview
This feature adds comprehensive enrollment management capabilities, allowing administrators to view all student enrollments and control access to programs.

## Database Changes

### Enrollment Model Enhancement
Added `access` field to the Enrollment model:
- **Field**: `access String @default("unblocked")`
- **Values**: "blocked" or "unblocked"
- **Purpose**: Control student access to specific program enrollments

## New Files Created

### 1. Admin Enrollments Page
**File**: `/src/app/admin/enrollments/page.tsx`

**Features**:
- Display all student enrollments in a comprehensive table
- Columns: Student Email, Parent Email, Program, Subject, Teacher, Access Status, Actions
- Real-time access status indicators (green for unblocked, red for blocked)
- Block/Unblock toggle buttons for each enrollment
- Authentication and authorization checks
- Loading states and error handling

### 2. Enrollments API Endpoint
**File**: `/src/app/api/admin/enrollments/route.ts`

**Features**:
- GET endpoint to fetch all enrollments with related data
- Includes student information (email, parent email)
- Includes assigned teacher information via TeacherStudent links
- Filters teachers by matching program
- Ordered by enrollment start date (descending)
- Returns formatted data matching UI requirements

### 3. Toggle Access API Endpoint
**File**: `/src/app/api/admin/enrollments/[id]/toggle-access/route.ts`

**Features**:
- PATCH endpoint to toggle enrollment access status
- Validates access values ("blocked" or "unblocked")
- Updates single enrollment by ID
- Returns updated enrollment data
- Authentication and authorization checks
- Next.js 15 compatible (awaits params)

## Database Migration Required

### Steps to Apply Changes:

1. **Push schema to database**:
   ```bash
   npm run db:push
   ```
   OR with direct URL:
   ```bash
   DIRECT_URL="postgresql://postgres.dqjrtknsfbczrqlkxuab:Aqweds123%40321@aws-1-us-west-1.pooler.supabase.com:5432/postgres" npx prisma db push --accept-data-loss
   ```

2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Restart development server**:
   ```bash
   npm run dev
   ```

## Usage

### Accessing the Page
Navigate to: `http://localhost:3000/admin/enrollments`

### Block/Unblock Workflow
1. View all enrollments in the table
2. Locate the enrollment to modify
3. Click "Block" to restrict access or "Unblock" to restore access
4. Status updates immediately with visual feedback
5. Changes are persisted in the database

### Access Control Logic
- **Unblocked**: Student has full access to the program/subject enrollment
- **Blocked**: Student access is restricted for this specific enrollment
- Each enrollment can be independently controlled
- Students may have multiple enrollments with different access states

## API Endpoints

### GET /api/admin/enrollments
Fetches all enrollments with student and teacher information.

**Response**:
```json
{
  "enrollments": [
    {
      "id": 1,
      "studentId": 78,
      "program": "Math Program",
      "subject": "Algebra",
      "access": "unblocked",
      "student": {
        "email": "student@example.com",
        "parentEmail": "parent@example.com"
      },
      "teacherStudents": [
        {
          "teacher": {
            "name": "Mr. Smith"
          }
        }
      ]
    }
  ],
  "count": 1
}
```

### PATCH /api/admin/enrollments/[id]/toggle-access
Updates the access status of a specific enrollment.

**Request Body**:
```json
{
  "access": "blocked"  // or "unblocked"
}
```

**Response**:
```json
{
  "message": "Enrollment blocked successfully",
  "enrollment": {
    "id": 1,
    "access": "blocked",
    "student": {
      "email": "student@example.com"
    }
  }
}
```

## Integration with Existing Features

### Student Creation
- New students are created with default "unblocked" access
- Initial enrollment is created during student creation flow
- Access can be modified after creation via enrollments page

### Add Enrollment Feature
- Additional enrollments for existing students default to "unblocked"
- Admins can block/unblock any enrollment independently
- Multiple enrollments per student are supported

## Security
- All endpoints require NextAuth session authentication
- Admin email validation via allowedEmails whitelist
- Student/parent data is properly scoped to authenticated admins only

## Next Steps
1. Add navigation link to enrollments page in admin layout
2. Consider adding bulk block/unblock operations
3. Add filtering and search capabilities for large enrollment lists
4. Implement enrollment history/audit log
5. Add notification system for blocked students

## Technical Notes
- Uses Next.js 15 App Router with Server Components
- Client-side state management with React hooks
- Prisma ORM for database operations
- TypeScript for type safety
- Tailwind CSS for styling
- NextAuth for authentication
