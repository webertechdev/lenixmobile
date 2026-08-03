# Row Level Security (RLS) Setup Guide

## What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows users can access based on policies. In Supabase, RLS is enabled by default for security.

## The Issue

If your app shows "Database connection" errors but the database is actually working, the issue is likely **RLS policies blocking queries**.

## Quick Fix: Disable RLS (Development Only)

**⚠️ WARNING: Only do this for development/testing. For production, set up proper RLS policies.**

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `drizzle/disable_rls.sql`
5. Click **Run**

This will disable RLS on all tables and allow your app to work.

## Proper RLS Setup (Production)

For production, you should set up policies that:
- Allow authenticated users to read/write their own data
- Prevent users from accessing other users' sensitive data
- Allow admins to access everything

### Example RLS Policies

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own record
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  USING (auth.uid()::text = supabase_id);

-- Allow admins to read all records
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING ((SELECT role FROM users WHERE supabase_id = auth.uid()::text) = 'admin');

-- Similar policies for other tables...
```

## Checking RLS Status

To see which tables have RLS enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

If `rowsecurity` is `t` (true), RLS is enabled. If `f` (false), RLS is disabled.

## Troubleshooting

### "permission denied for schema public"
- RLS is enabled but no policies allow access
- Solution: Disable RLS temporarily or add proper policies

### "new row violates row-level security policy"
- You're trying to insert data that violates RLS policies
- Solution: Check the policies or disable RLS

### "relation does not exist"
- The table doesn't exist or RLS policies are preventing access
- Solution: Check table names and RLS status

## Next Steps

1. **For Development**: Use `drizzle/disable_rls.sql` to disable RLS
2. **For Production**: Set up proper RLS policies (see examples above)
3. **Test**: Use the **Settings → Database Connection** page to verify

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
