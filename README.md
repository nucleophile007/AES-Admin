# Acharya Education System - Admin Portal

This admin portal allows administrators to manage students, teachers, webinar registrations, and program availability for the Acharya Education System.

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/AES-Admin.git
   cd AES-Admin
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   Make sure to configure your database connection strings correctly (see Database Setup section).

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open the application**

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Database Setup

This project uses [Prisma](https://www.prisma.io/) with PostgreSQL hosted on [Supabase](https://supabase.com/).

### Connection Strings

For Supabase with pgBouncer connection pooling, you need two URLs in your `.env` file:

```
DATABASE_URL="postgres://postgres:[password]@db.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgres://postgres:[password]@db.supabase.co:5432/postgres"
```

**Important**: If your password contains special characters like `@`, you must URL encode them (`%40`).

### Test Your Database Connection

Run the database connection test script:

```bash
npm run db:test
```

This will verify both pooled and direct connections to your database.

### Database Schema Management

To sync your Prisma schema with the database:

```bash
# Pull the current schema from database
npm run db:pull

# Generate Prisma client
npm run db:generate

# Push schema changes to database (use with caution)
npm run db:push
```

## 🔍 Diagnostics Pages

The application includes built-in diagnostic pages to help troubleshoot issues:

- **/test-db** - Test database connection and display database stats
- **/admin/diagnostics** - Admin dashboard for system diagnostics

## 🔐 Authentication

This project uses [NextAuth.js](https://next-auth.js.org/) for authentication. Admin access is restricted to specific email addresses configured in `src/lib/adminConfig.ts`.

To add a new administrator:

1. Open `src/lib/adminConfig.ts`
2. Add the email address to the `allowedEmails` array

## 🧩 Key Features

- **Admin Dashboard**: Manage students, teachers, and program availability
- **User Registration**: Process and approve registration requests
- **Webinar Management**: Track webinar registrations
- **Authorization**: Role-based access control for administrators
- **Database Diagnostics**: Built-in tools for troubleshooting database connectivity

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify your `.env` file contains correct connection strings
2. Ensure special characters in passwords are properly URL encoded
3. For Supabase, make sure you're using both DATABASE_URL and DIRECT_URL
4. Check if your IP is whitelisted in Supabase dashboard
5. Verify the database exists and has the expected schema

### Schema Mismatches

If you encounter errors about missing columns or tables:

1. Run `npx prisma db pull` to update your schema to match the database
2. Run `npx prisma generate` to regenerate the client
3. Restart your development server

### NextAuth Issues

1. Check that NEXTAUTH_SECRET and NEXTAUTH_URL are properly set
2. Verify the allowed admin emails in `src/lib/adminConfig.ts`

## 🏗️ Project Structure

```
/
├── prisma/                # Prisma schema and migrations
├── public/                # Static assets
├── scripts/               # Utility scripts
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── api/           # API routes
│   │   └── auth/          # Authentication pages
│   ├── components/        # React components
│   ├── lib/               # Shared utilities
│   └── types/             # TypeScript type definitions
├── .env.example           # Example environment variables
├── .env.local             # Local environment variables (not committed)
├── next.config.ts         # Next.js configuration
└── package.json           # Project dependencies
```

## 📦 Technologies

- [Next.js 15](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Supabase](https://supabase.com/) - Database hosting

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Supabase Documentation](https://supabase.com/docs)
