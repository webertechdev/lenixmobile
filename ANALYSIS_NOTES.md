# Key Findings

## 1. Schema Mismatch: role enum
- Migration SQL has: `role AS ENUM('admin', 'technician', 'viewer')`
- TypeScript schema.ts has: `pgEnum("role", ["admin", "technician", "team_lead", "viewer"])`
- The database does NOT have 'team_lead' in the enum!
- This means technician creation with role='team_lead' will FAIL at DB level

## 2. Schema Mismatch: technicians.user_id
- Migration SQL: `user_id integer NOT NULL`
- TypeScript schema.ts: `userId: integer("user_id").references(() => users.id)` (nullable!)
- The technician-service.ts createTechnician does NOT include userId in the insert
- This will FAIL because user_id is NOT NULL in the DB

## 3. Schema Mismatch: technicians.role column
- Migration SQL does NOT have a `role` column on technicians table
- TypeScript schema.ts DOES have `role: roleEnum("role").default("technician")`
- This means the `role` column doesn't exist in the actual DB schema

## 4. RLS Policies blocking sync-user
- supabase_setup.sql has RLS enabled on users table
- SELECT policy: "Users can view their own profile" = `auth.uid()::text = supabase_id`
- SELECT policy: "Admins can view all users" = EXISTS check for admin role
- NO INSERT policy on users table!
- This means `/api/auth/sync-user` CANNOT insert the first user row
- RLS blocks all writes until disable_rls.sql is run

## 5. The flow for first login:
1. Setup page calls /api/auth/signup → creates Supabase auth user (server-side, has service role)
2. User is redirected to /login
3. User signs in → calls /api/auth/sync-user → TRIES to insert into users table
4. RLS blocks the INSERT → user row never created → user is never admin
5. Settings "Make Me Admin" calls /api/admin/promote-me → looks for user in DB → NOT FOUND → error
6. Everything breaks because there's no user record

## FIXES NEEDED:
1. Add INSERT policy on users table for authenticated users
2. OR use disable_rls.sql (simpler for dev)
3. Fix the role enum to include 'team_lead'
4. Fix technicians table: make user_id nullable, add role column
5. Fix technician-service.ts to include userId when creating technicians
6. Make settings page auto-promote first user to admin
7. Show user role in sidebar header
8. Admin sees all activities on audit log
