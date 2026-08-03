# Database Setup Guide for Lenix Mobile

## Overview
Lenix Mobile uses PostgreSQL (via Supabase) as its database. To get the application working, you need to configure the `DATABASE_URL` environment variable with your Supabase connection string.

## The Error You're Seeing
```
getaddrinfo ENOTFOUND db.cbzkmefioqkzfhilkfla.supabase.co
```

This error means the application cannot find the database server. This typically happens because:
1. The `DATABASE_URL` is not set in your environment
2. The connection string is incorrect or incomplete
3. The Supabase project reference (the random string) is wrong

## Step-by-Step Setup

### 1. Get Your Supabase Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **Database**
4. Look for the **Connection string** section
5. **Important**: Select **Connection Mode: Transaction** (this uses the pooler, which is more reliable)

### 2. Copy the Connection String

You should see a string that looks like:
```
postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Replace:**
- `[YOUR-PROJECT-REF]` - Your unique Supabase project reference
- `[YOUR-PASSWORD]` - Your database password
- `[REGION]` - Your database region (e.g., us-east-1)

### 3. Set the Environment Variable

#### For Local Development:
Create a `.env.local` file in the project root:
```
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your connection string from Supabase
4. Click **Save**
5. Redeploy your project

### 4. Verify the Connection

Once you've set the `DATABASE_URL`:

1. Go to **Settings** page in your Lenix Mobile app
2. Scroll to **Database Connection** section
3. Click **Test Connection**
4. You should see a green "Connected" status

If it still fails, check:
- The connection string is copied exactly (no extra spaces)
- You're using the **Transaction** mode connection string (port 6543)
- Your Supabase project is active and not paused
- Your IP address is allowed (Supabase allows all IPs by default)

## Database Schema

The schema is automatically created when you first connect. It includes:
- **users** - User accounts linked to Supabase Auth
- **technicians** - Repair team members with roles (Admin, Technician, Team Lead)
- **customers** - Customer information
- **repairs** - Repair job records
- **inventory** - Spare parts and stock levels
- **repair_parts** - Junction table linking repairs to parts used
- **audit_log** - System activity tracking

## Running Migrations

If you need to update the schema:

```bash
pnpm run db:push
```

This will push any schema changes to your Supabase database.

## Seeding Sample Data

To populate your database with sample technicians and repairs:

```bash
pnpm run seed
```

Note: The seed script uses a local PostgreSQL connection. For Supabase, you'll need to update the connection string in `seed.ts`.

## Troubleshooting

### "ENOTFOUND" Error
- Double-check your connection string
- Verify you're using the **Transaction** mode URL (not the direct connection)
- Check that the project reference in the URL matches your Supabase project

### "Connection refused" Error
- Verify your database password is correct
- Check that your Supabase project is not paused
- Ensure you're using port 6543 (for pooler) or 5432 (for direct connection)

### "Authentication failed" Error
- Verify the username is `postgres.[YOUR-PROJECT-REF]`
- Check your database password is correct

### Still Having Issues?
1. Go to **Settings** → **Database Connection**
2. Click **Test Connection**
3. Read the suggestions provided
4. Check the Supabase logs: https://app.supabase.com/project/[YOUR-PROJECT-REF]/logs

## Need Help?
- Supabase Documentation: https://supabase.com/docs
- Lenix Mobile Issues: Check GitHub discussions
