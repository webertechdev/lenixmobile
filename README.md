# Lenix Aftersales Management System

A standalone, production-ready phone repair shop management system built with Next.js 15 and Supabase.

> 📚 **[Database Setup Guide](./DATABASE_SETUP.md)** - Start here if you're seeing database connection errors or need help configuring your DATABASE_URL!

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase Project
- A Vercel Account

### Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=your-postgresql-connection-string
```

**Need help with DATABASE_URL?** See the [Database Setup Guide](./DATABASE_SETUP.md) for detailed instructions.

### Setup Database

1. Run the Drizzle push command to sync the schema:
   ```bash
   npm run db:push
   ```
2. Run the SQL setup script in your Supabase SQL Editor:
   - `drizzle/supabase_setup.sql` (Enables RLS and creates Storage buckets)

### Development

```bash
pnpm install
pnpm run dev
```

The application will be available at `http://localhost:3000`.

### Verify Database Connection

Once running, go to **Settings** → **Database Connection** to test your database connection and get detailed error messages if needed.

## Deployment to Vercel

1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Add the environment variables listed above.
4. Deploy!

## License

MIT
