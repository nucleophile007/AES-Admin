# Payment Reminder Feature with File Upload

## Summary
Successfully implemented payment reminder feature with file upload support using Cloudflare R2. All payment records are now stored in the database for future parent dashboard access.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
- **Added Payment Model** with the following fields:
  - `id`, `enrollmentId`, `studentId`
  - Student details: `studentEmail`, `studentName`
  - Parent details: `parentName`, `parentEmail`, `parentPhone`
  - Payment info: `program`, `subject`, `paymentInfo`, `amount`, `dueDate`
  - File storage: `fileUrl`, `fileName`, `fileSize`
  - Status tracking: `status` (pending/paid/overdue)
  - Timestamps: `sentAt`, `paidAt`, `createdAt`, `updatedAt`
  - Relations: `enrollment`, `student`
- **Updated Enrollment Model**: Added `payments Payment[]` relation
- **Updated Student Model**: Added `payments Payment[]` relation
- **Migration Applied**: `npx prisma db push` completed successfully

### 2. File Upload Infrastructure

#### R2 Upload Utility (`src/lib/r2Upload.ts`)
- Created S3-compatible client for Cloudflare R2
- `uploadToR2()` function handles file uploads
- Generates unique filenames with timestamps
- Returns file URL, name, and size
- Uses environment variables: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

#### AWS SDK Installation
- Installed `@aws-sdk/client-s3` for S3-compatible uploads to R2

### 3. API Endpoints

#### Payment API (`src/app/api/admin/payments/route.ts`)
- **GET**: Fetch all payment records with filters
  - Query params: `status` (pending/paid/overdue/all), `studentId`
  - Includes student and enrollment details
  - Ordered by creation date (newest first)
- **PATCH**: Update payment status
  - Marks payment as paid/overdue
  - Auto-sets `paidAt` timestamp when status = 'paid'

#### Updated Payment Reminder API (`src/app/api/admin/enrollments/send-payment-reminder/route.ts`)
- **Changed from JSON to FormData** to support file uploads
- **File Upload Process**:
  1. Receives file from FormData
  2. Converts to Buffer
  3. Uploads to R2 using `uploadToR2()`
  4. Stores file URL in Payment record
- **Creates Payment Record** with all enrollment and student details
- **Enhanced Email** with:
  - Student and parent names
  - Amount field (highlighted in green)
  - File attachment link (if file provided)
  - Personalized greeting
- **Returns**: `messageId`, `paymentId`, `enrollmentId`

### 4. UI Updates (`src/app/admin/enrollments/page.tsx`)

#### New State Variables
- `amount`: Payment amount
- `paymentFile`: Selected file for upload

#### Updated Modal
- **Added Amount Field**: Required text input for payment amount
- **Added File Upload Field**: 
  - Accepts: `.pdf`, `.csv`, `.jpg`, `.jpeg`, `.png`
  - Shows selected file name and size
  - Optional field
  - Styled file input with custom button
- **Updated Payment Info**: Reduced from 4 rows to 3 (amount moved to separate field)

#### Updated Submission
- Changed from JSON to FormData
- Includes all enrollment and student details
- Appends file if selected
- Removes Content-Type header (auto-set for multipart)

## File Structure
```
src/
├── app/
│   ├── admin/
│   │   └── enrollments/
│   │       └── page.tsx (Updated: file upload UI)
│   └── api/
│       └── admin/
│           ├── payments/
│           │   └── route.ts (New: GET/PATCH payment records)
│           └── enrollments/
│               └── send-payment-reminder/
│                   └── route.ts (Updated: file upload + Payment creation)
├── lib/
│   └── r2Upload.ts (New: R2 file upload utility)
└── prisma/
    └── schema.prisma (Updated: Payment model)
```

## Environment Variables Required
```
R2_ACCESS_KEY_ID=44f8010012627b42829052805d85b697
R2_SECRET_ACCESS_KEY=c043ba798ef661ec402b908f0ef8887b82dcefabbc339b973701aafe1ca02dc4
R2_ENDPOINT=https://e6159c1af11ad8675b988602868e4ca3.r2.cloudflarestorage.com
R2_BUCKET_NAME=aes-student-files
R2_PUBLIC_URL=https://pub-6860df273959446786e5c3556348f4b4.r2.dev
```

## How It Works

### Sending Payment Reminder with File
1. Admin opens payment reminder modal from enrollments page
2. Fills in: Payment Info, Amount, Due Date
3. (Optional) Attaches invoice/receipt file
4. Clicks "Send Reminder"
5. **Backend Process**:
   - Validates all required fields
   - If file exists: Uploads to R2 and gets URL
   - Creates Payment record in database
   - Sends email to parent with payment details and file link
   - Returns success with payment ID
6. Payment record stored for future parent dashboard

### Payment Record Storage
All payment reminders are now tracked in the database with:
- Complete student and parent information
- Enrollment details (program, subject)
- Payment details (amount, due date, status)
- File attachment (if uploaded)
- Sent timestamp
- Paid timestamp (when marked as paid)

### Future Parent Dashboard
When you create the parent dashboard, you can:
- Fetch all payments for a parent using `/api/admin/payments?studentId=X`
- Display payment history with status
- Show attached invoices/receipts with download links
- Allow parents to mark payments as completed
- Show overdue payments

## API Usage Examples

### Fetch All Payments
```javascript
GET /api/admin/payments
GET /api/admin/payments?status=pending
GET /api/admin/payments?status=paid
GET /api/admin/payments?studentId=123
```

### Update Payment Status
```javascript
PATCH /api/admin/payments
Body: {
  paymentId: 1,
  status: "paid"  // or "pending" or "overdue"
}
```

### Send Payment Reminder
```javascript
POST /api/admin/enrollments/send-payment-reminder
Body: FormData {
  enrollmentId, studentId, studentEmail, parentEmail,
  program, subject, paymentInfo, amount, dueDate,
  file: File (optional)
}
```

## Testing Steps
1. Go to Enrollments page
2. Click "Send Payment Reminder" for any enrollment
3. Fill in payment details and amount
4. (Optional) Attach a PDF or CSV file
5. Click "Send Reminder"
6. Check email for payment reminder with file link
7. Check database: Payment record should be created with all details
8. File should be accessible at the R2 public URL

## Notes
- Files are stored in R2 bucket under `payment-receipts/` folder
- File names are prefixed with timestamp for uniqueness
- Payment status can be: `pending`, `paid`, or `overdue`
- `paidAt` timestamp is auto-set when status changes to `paid`
- All payment data is preserved for parent dashboard integration
