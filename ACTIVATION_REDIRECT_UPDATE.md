# Activation Flow Redirect Update

## Overview
Updated the activation flow to redirect teachers and students to `localhost:3001` (the student/teacher portal) after successful account activation, while admins continue to use the existing sign-in flow.

## Changes Made

### File Modified: `/src/app/auth/activate/page.tsx`

**Enhancement**: Role-based redirect after activation

### New Behavior

#### For Teachers & Students:
1. User clicks activation link in email
2. Sets password on activation page
3. After successful activation, sees success message with:
   - **Redirect URL**: `http://localhost:3001`
   - **Button text**: "Go to Portal" (teacher portal or student portal)
   - **URL display**: Shows the localhost:3001 URL
4. Clicking the button takes them to the student/teacher portal

#### For Admins:
1. User clicks activation link in email
2. Sets password on activation page
3. After successful activation:
   - **Redirect URL**: `/auth/signin` (Google OAuth)
   - **Button text**: "Go to Sign In"
   - Proceeds to admin sign-in with Google

### Implementation Details

```typescript
// Determine redirect based on role
const redirectUrl = userData?.role === 'TEACHER' || userData?.role === 'STUDENT' 
  ? 'http://localhost:3001' 
  : '/auth/signin'

// Dynamic message based on role
const roleMessage = userData?.role === 'TEACHER' 
  ? 'teacher portal' 
  : userData?.role === 'STUDENT' 
    ? 'student portal' 
    : 'admin dashboard'
```

### Success Screen Features

1. **Dynamic Button Text**:
   - Teachers/Students: "Go to Portal"
   - Admins: "Go to Sign In"

2. **Role-Specific Messaging**:
   - Teachers: "sign in to the teacher portal"
   - Students: "sign in to the student portal"
   - Admins: "sign in to the admin dashboard"

3. **URL Display** (Teachers/Students only):
   - Shows `http://localhost:3001` so users know where they're going
   - Displayed in monospace font with blue highlight

## User Flow Examples

### Teacher Activation Flow:
```
1. Receive email with activation link
   ↓
2. Click link → Redirected to activation page
   ↓
3. Enter and confirm password
   ↓
4. Click "Activate Account"
   ↓
5. Success screen shows:
   - "Account Activated!"
   - "sign in to the teacher portal"
   - Button: "Go to Portal"
   - URL: http://localhost:3001
   ↓
6. Click button → Redirected to localhost:3001
```

### Student Activation Flow:
```
1. Receive email with activation link
   ↓
2. Click link → Redirected to activation page
   ↓
3. Enter and confirm password
   ↓
4. Click "Activate Account"
   ↓
5. Success screen shows:
   - "Account Activated!"
   - "sign in to the student portal"
   - Button: "Go to Portal"
   - URL: http://localhost:3001
   ↓
6. Click button → Redirected to localhost:3001
```

### Admin Activation Flow:
```
1. Receive email with activation link
   ↓
2. Click link → Redirected to activation page
   ↓
3. Enter and confirm password
   ↓
4. Click "Activate Account"
   ↓
5. Success screen shows:
   - "Account Activated!"
   - "sign in to the admin dashboard"
   - Button: "Go to Sign In"
   ↓
6. Click button → Redirected to /auth/signin (Google OAuth)
```

## Role Detection

The system detects the user role from the activation token data:
- `userData.role === 'TEACHER'` → Redirect to localhost:3001
- `userData.role === 'STUDENT'` → Redirect to localhost:3001
- Other roles (admin) → Redirect to /auth/signin

## Prerequisites

For this to work correctly:
1. ✅ The student/teacher portal must be running on `localhost:3001`
2. ✅ The portal should have a sign-in page that accepts email/password
3. ✅ The portal should handle the newly activated users

## Future Enhancements

Consider implementing:
1. **Automatic Sign-In**: After activation, automatically sign the user in and redirect
2. **Dynamic Port Configuration**: Use environment variable for portal URL instead of hardcoded localhost:3001
3. **Production URLs**: Update to use production URLs in deployed environments
4. **Session Token**: Pass a temporary token to the portal for seamless sign-in

## Testing Checklist

- [x] Teacher activates account → sees teacher portal message
- [x] Teacher clicks button → redirected to localhost:3001
- [x] Student activates account → sees student portal message
- [x] Student clicks button → redirected to localhost:3001
- [ ] Admin activates account → sees admin dashboard message
- [ ] Admin clicks button → redirected to /auth/signin
- [ ] URL display shows correct localhost:3001 for teachers/students
- [ ] URL display not shown for admins

## Configuration

### Development Environment:
```
Admin Portal: localhost:3000
Student/Teacher Portal: localhost:3001
```

### Update for Production:
Replace hardcoded URL with environment variable:
```typescript
const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.yourdomain.com'
```

## Notes

- The activation page uses `userData?.role` from the token verification response
- Role values are expected to be uppercase: 'TEACHER', 'STUDENT'
- The current implementation uses a hardcoded localhost:3001 URL
- Consider using NEXT_PUBLIC_PORTAL_URL environment variable for flexibility
