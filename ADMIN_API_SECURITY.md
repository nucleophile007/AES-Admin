# Admin API Security Documentation

## Overview
All admin APIs are secured with server-side authentication and authorization. Only users with email addresses in the `ADMIN_ALLOWED_EMAILS` environment variable can access these endpoints.

## Security Implementation

### 1. Authentication Helper (`src/lib/adminAuth.ts`)
```typescript
export async function validateAdminAuth(): Promise<AdminAuthResult>
```
- Validates NextAuth session exists
- Checks user email against allowed admin emails
- Returns structured result with success/error status

### 2. Current Allowed Admin Emails
- `dkdps3212@gmail.com`
- `acharya.folsom@gmail.com`

## Admin Features

### ✅ **Webinar Registration Management**
- **View all registrations** - Fetch and display all webinar registrations
- **Approve registrations** - Mark registrations as approved
- **Unapprove registrations** - Remove approval status (and restore availability)
- **Search and filter** - Find specific registrations by student name, parent name, email, or school
- **Automatic availability management** - When approving, removes time slot from availability; when unapproving, adds it back

### ✅ **Availability Management**
- **View available time slots** - See all available dates and times by program
- **Add time slots** - Create new availability for specific programs
- **Remove time slots** - Delete availability
- **Program-specific availability** - Each program has separate availability slots
- **Automatic updates** - Availability is updated when registrations are approved/unapproved per program

## Available Admin APIs

### 1. Webinar Registrations API
**Endpoint:** `/api/admin/webinar-registrations`
**Method:** `GET`
**Purpose:** Fetch all webinar registrations for admin review
**Security:** 
- Requires valid NextAuth session
- Email must be in allowed admin list
- Returns 401 for unauthenticated users
- Returns 403 for unauthorized users

**Response:**
```json
{
  "registrations": [...],
  "totalCount": 4,
  "pendingCount": 2,
  "approvedCount": 2,
  "adminUser": "admin@example.com"
}
```

### 2. Availability Management API
**Endpoint:** `/api/admin/availability`
**Methods:** `GET`, `POST`
**Purpose:** Manage available time slots for webinars
**Security:** Same as above

**GET Response:**
```json
{
  "days": [
    {
      "id": 1,
      "date": "2025-01-20",
      "times": ["10:00 AM", "2:00 PM"],
      "program": "Mathematics Tutoring"
    }
  ]
}
```

**POST Body:**
```json
{
  "date": "2025-01-20",
  "times": ["10:00 AM", "2:00 PM", "4:00 PM"],
  "program": "Mathematics Tutoring"
}
```

### 3. Registration Approval API
**Endpoint:** `/api/admin/registration/[id]/approve`
**Method:** `POST`
**Purpose:** Approve individual webinar registrations (legacy endpoint)
**Security:** Same as above

**Endpoint:** `/api/admin/registration/[id]`
**Method:** `PATCH`
**Purpose:** Update approval status of webinar registrations (recommended)
**Security:** Same as above

**PATCH Body:**
```json
{
  "approved": true
}
```

**Response:**
```json
{
  "registration": {
    "id": 1,
    "approved": true,
    ...
  },
  "message": "Registration approved successfully"
}
```

## Error Responses

### 401 Unauthorized (Not authenticated)
```json
{
  "error": "Not authenticated - please sign in"
}
```

### 403 Forbidden (Not authorized)
```json
{
  "error": "Not authorized - admin access required. Email user@example.com is not in the allowed list."
}
```

### 404 Not Found
```json
{
  "error": "Registration not found"
}
```

### 500 Server Error
```json
{
  "error": "Failed to fetch registrations"
}
```

## Testing

A test interface is available at `/test-admin-api` for authenticated admin users to verify API functionality.

## Environment Configuration

Add admin emails to `.env.local`:
```bash
ADMIN_ALLOWED_EMAILS=admin1@example.com,admin2@example.com
```

## Security Features

1. ✅ **Server-side validation** - All authentication happens on the server
2. ✅ **Email whitelist** - Only specific emails can access admin functions
3. ✅ **Session verification** - NextAuth session must be valid
4. ✅ **Consistent error handling** - Proper HTTP status codes
5. ✅ **Detailed logging** - Errors are logged for debugging
6. ✅ **Type safety** - Full TypeScript support
7. ✅ **Middleware protection** - Routes are protected at the middleware level
8. ✅ **Mock data ready** - Easy to replace with real database integration

## Next Steps for Production

1. Replace mock data with actual Prisma database calls
2. Add rate limiting for API endpoints
3. Implement proper logging and monitoring
4. Add API versioning
5. Add request validation with Zod or similar
6. Implement audit logging for admin actions
