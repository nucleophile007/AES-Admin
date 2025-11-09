# Payment Reminder Feature

## Overview
Added payment reminder functionality to the enrollments management page, allowing administrators to send formal payment reminder emails to parents with custom payment information and due dates.

## New Features

### 1. Payment Reminder Column
**Location**: `/src/app/admin/enrollments/page.tsx`

**Features**:
- New "Payment Reminder" column added to enrollments table
- "Send Reminder" button for each enrollment
- Button is disabled if no parent email is available
- Visual feedback with tooltip for disabled buttons

### 2. Payment Reminder Modal
**Features**:
- Professional modal popup for entering payment details
- Displays student, parent, program, and subject information
- Two input fields:
  - **Payment Information** (textarea): For entering payment details like amount, invoice number, payment methods
  - **Due Date** (date picker): For selecting payment deadline
- Form validation: Both fields are required
- Cancel and Send buttons with proper state management
- Loading state while sending email

### 3. Email API Endpoint
**File**: `/src/app/api/admin/enrollments/send-payment-reminder/route.ts`

**Features**:
- POST endpoint to send payment reminder emails
- Authentication check via NextAuth session
- Input validation for required fields
- SMTP email sending via Gmail (using existing configuration)
- Professional HTML email template with:
  - U-ACHIEVE branding
  - Student and program information
  - Payment details with formatted due date
  - Professional styling with color-coded sections
  - Footer with admin team signature
- Fallback logging if SMTP is not configured

## Email Template Design

### Email Structure:
1. **Header**: Blue branded header with U-ACHIEVE logo and "Payment Reminder" title
2. **Greeting**: Personalized greeting to parent/guardian
3. **Student Information Box**: 
   - Student email
   - Program name
   - Subject name
4. **Payment Details Box** (highlighted in amber):
   - Custom payment information entered by admin
   - Formatted due date in red for emphasis
5. **Message**: Professional reminder text
6. **Footer**: Admin team signature and automated message disclaimer

### Email Styling:
- Responsive design (max-width: 600px)
- Professional color scheme:
  - Blue header (#2563eb)
  - Light gray content background (#f9fafb)
  - Amber payment info box (#fef3c7)
  - Red due date (#dc2626)
- Proper spacing and typography
- Border accents for visual hierarchy

## How to Use

### Step 1: Access Enrollments Page
Navigate to: `http://localhost:3000/admin/enrollments`

### Step 2: Send Payment Reminder
1. Locate the enrollment in the table
2. Click "Send Reminder" button in the "Payment Reminder" column
3. A modal will open with enrollment details

### Step 3: Fill in Payment Details
1. **Payment Information**: Enter details such as:
   - Payment amount
   - Invoice number
   - Payment method (bank transfer, credit card, etc.)
   - Any special instructions
2. **Due Date**: Select the payment deadline using the date picker

### Step 4: Send Email
1. Click "Send Reminder" button
2. Wait for confirmation (button shows "Sending...")
3. Success alert confirms email was sent
4. Modal closes automatically

## API Endpoint Details

### POST /api/admin/enrollments/send-payment-reminder

**Request Body**:
```json
{
  "enrollmentId": 1,
  "studentEmail": "student@example.com",
  "parentEmail": "parent@example.com",
  "program": "Math Program",
  "subject": "Algebra",
  "paymentInfo": "Amount: $500\nInvoice #12345\nPayment via bank transfer",
  "dueDate": "2025-11-15"
}
```

**Response** (Success):
```json
{
  "message": "Payment reminder sent successfully",
  "messageId": "<unique-message-id@gmail.com>",
  "enrollmentId": 1
}
```

**Response** (Error):
```json
{
  "error": "Missing required fields"
}
```

**Status Codes**:
- `200`: Email sent successfully
- `400`: Missing required fields
- `401`: Unauthorized (no valid session)
- `500`: Server error

## Email Example

**Subject**: Payment Reminder - Math Program (Algebra)

**Body** (formatted HTML):
```
┌─────────────────────────────────────┐
│         U-ACHIEVE                   │
│     Payment Reminder                │
└─────────────────────────────────────┘

Dear Parent/Guardian,

This is a friendly reminder regarding the payment for your child's enrollment in our program.

┌─────────────────────────────────────┐
│ Student Email: student@example.com  │
│ Program: Math Program               │
│ Subject: Algebra                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Payment Details:                    │
│                                     │
│ Amount: $500                        │
│ Invoice #12345                      │
│ Payment via bank transfer           │
│                                     │
│ Payment Due Date:                   │
│ Friday, November 15, 2025           │
└─────────────────────────────────────┘

We kindly request that you complete the payment by the due date mentioned above to ensure uninterrupted access to the program.

If you have already made the payment, please disregard this reminder. If you have any questions or concerns regarding this payment, please don't hesitate to contact us.

Thank you for your continued support and trust in our programs.

───────────────────────────────────────
U-ACHIEVE Admin Team
This is an automated reminder. Please do not reply to this email.
```

## Technical Implementation

### Frontend (React):
- useState hooks for modal state management
- Form validation before submission
- Async/await for API calls
- Loading states during email sending
- Error handling with user feedback
- Disabled state for buttons without parent email

### Backend (Next.js API):
- NextAuth session authentication
- Nodemailer for SMTP email sending
- HTML email templating
- Date formatting with toLocaleDateString
- Environment variable configuration
- Error handling and logging

### Styling:
- Tailwind CSS for modal and buttons
- Inline CSS for email HTML (email client compatibility)
- Responsive design patterns
- Professional color scheme
- Accessibility considerations

## Environment Variables Required

Already configured in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=dkdps3212@gmail.com
SMTP_PASSWORD=qjpjkizzfwcfdzqy
SMTP_FROM="U-ACHIEVE" <dkdps3212@gmail.com>
```

## Security Considerations

1. **Authentication**: All requests require valid NextAuth session
2. **Email Validation**: Checks for parent email existence before sending
3. **Input Sanitization**: Validates required fields on backend
4. **SMTP Security**: Uses secure connection (port 465)
5. **Rate Limiting**: Consider adding rate limiting for production

## Future Enhancements

Potential improvements:
1. Payment reminder history tracking (store in database)
2. Email templates with variables
3. Bulk payment reminder sending
4. Payment status tracking
5. Automatic reminder scheduling
6. Email delivery confirmation
7. Parent acknowledgment system
8. Payment receipt upload
9. Integration with payment gateways
10. SMS reminder option

## Testing Checklist

- [x] Modal opens with correct enrollment data
- [x] Form validation works (required fields)
- [x] Email sends successfully via SMTP
- [x] Parent receives properly formatted email
- [x] Error handling displays appropriate messages
- [x] Button disables when no parent email
- [x] Loading state shows during email sending
- [x] Modal closes after successful send
- [x] Authentication check prevents unauthorized access

## Notes

- Emails are sent synchronously (user waits for completion)
- Gmail SMTP is used with existing credentials
- No database record of sent reminders (consider adding for audit trail)
- HTML email format ensures compatibility with most email clients
- Date formatting uses US locale (en-US)
- Modal uses fixed positioning with backdrop overlay
