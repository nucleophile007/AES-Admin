# Two-Site Activation Setup - Complete! ✅

## ✅ What's Done

### Admin Site Changes (Port 3000)
1. **Environment Variable Added**
   ```env
   USER_SITE_URL=http://localhost:3001
   ```

2. **Activation Emails Updated**
   - Now send links to User Site (port 3001)
   - Email subject: "Activate Your Account - User Portal"
   - Clear messaging about user portal

3. **Build Fixed**
   - Fixed all TypeScript errors
   - Fixed ESLint issues
   - Added Suspense boundary to activation page
   - Build completes successfully

4. **Database Schema**
   - Both sites share same Supabase database
   - ActivationRequest table used by both sites

## 🎯 Quick Summary

**Before**: Activation links went to `http://localhost:3000/auth/activate` (Admin Site)
**After**: Activation links go to `http://localhost:3001/auth/activate` (User Site)

## 📋 What You Need to Do Next

### On User Site (Port 3001):

1. **Copy these files from Admin Site**:
   ```
   src/app/api/auth/activate/route.ts  → User Site
   src/app/auth/activate/page.tsx      → User Site  
   src/lib/prisma.ts                   → User Site
   prisma/schema.prisma                → User Site
   ```

2. **Add to User Site `.env`**:
   ```env
   DATABASE_URL=postgresql://... (same as admin site)
   DIRECT_URL=postgresql://...   (same as admin site)
   NEXT_PUBLIC_BASE_URL=http://localhost:3001
   ```

3. **Install dependencies**:
   ```bash
   npm install @prisma/client bcrypt next-auth
   npm install -D @types/bcrypt
   npx prisma generate
   ```

4. **Run User Site on port 3001**:
   ```bash
   # In package.json:
   "dev": "next dev -p 3001"
   
   # Then run:
   npm run dev
   ```

## 🧪 Testing

1. **Start both servers**:
   - Admin: `http://localhost:3000`
   - User: `http://localhost:3001`

2. **Send activation from Admin site**:
   - Go to `/admin/students`
   - Click "Send Activation"
   - Check terminal for link

3. **Verify link points to User site**:
   - Link should be: `http://localhost:3001/auth/activate?token=...`

4. **Test activation**:
   - Open link → User Site opens
   - Set password
   - Should work!

## 📁 Repository Structure

```
AES-Admin/ (Admin Site - Port 3000)
├── src/
│   ├── app/
│   │   ├── admin/          ← Admin manages students
│   │   ├── api/
│   │   │   └── jobs/
│   │   │       └── send-activation-email/  ← Sends to USER_SITE_URL
│   │   └── auth/
│   │       └── activate/   ← Not used anymore
│   └── lib/
│       └── prisma.ts
├── prisma/
│   └── schema.prisma
└── .env                    ← Has USER_SITE_URL=http://localhost:3001

User-Site/ (User Site - Port 3001)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── activate/  ← User sets password here
│   │   └── auth/
│   │       └── activate/      ← Password form UI
│   └── lib/
│       └── prisma.ts
├── prisma/
│   └── schema.prisma      ← Same as admin site
└── .env                   ← Same DATABASE_URL as admin site
```

## 🔗 URLs Reference

| Action | Site | URL |
|--------|------|-----|
| Admin Dashboard | Admin | `http://localhost:3000/admin` |
| Send Activation | Admin | Admin clicks button |
| **Activation Link** | **User** | `http://localhost:3001/auth/activate?token=...` |
| Set Password | User | User fills form |
| Sign In | User | `http://localhost:3001/auth/signin` |

## ✅ Admin Site Status

- ✅ Build successful
- ✅ ESLint errors fixed
- ✅ TypeScript errors fixed
- ✅ Activation emails send to USER_SITE_URL
- ✅ Ready for deployment

## ⏳ User Site Status

- ⏳ Need to create activation page
- ⏳ Need to copy API routes
- ⏳ Need to configure database
- ⏳ Need to test end-to-end

## 🚀 Production URLs

When you deploy, update your environment variables:

**Admin Site**:
```env
NEXT_PUBLIC_BASE_URL=https://admin.yourdomain.com
USER_SITE_URL=https://app.yourdomain.com
```

**User Site**:
```env
NEXT_PUBLIC_BASE_URL=https://app.yourdomain.com
DATABASE_URL=your_production_database
```

Then activation links will be:
```
https://app.yourdomain.com/auth/activate?token=...
```

## 🎉 You're All Set!

The admin site is now configured to send activation links to your user site. Just set up the user site with the activation pages and you're good to go!
