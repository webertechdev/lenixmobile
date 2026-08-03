import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users, technicians } from '@/drizzle/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await db.select().from(users).where(eq(users.supabaseId, user.id));
    if (dbUser.length === 0 || dbUser[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const diagnostics = {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        DATABASE_URL: !!process.env.DATABASE_URL,
      },
      hierarchy: {
        users: {
          admins: 0,
          teamLeads: 0,
          technicians: 0,
        },
        technicians: {
          admins: 0,
          teamLeads: 0,
          technicians: 0,
        }
      },
      database: {
        connected: false,
        error: null as string | null,
      }
    };

    // Check hierarchy in users table
    try {
      const userAdminCount = await db.select({ value: count() }).from(users).where(eq(users.role, 'admin'));
      const userLeadCount = await db.select({ value: count() }).from(users).where(eq(users.role, 'team_lead'));
      const userTechCount = await db.select({ value: count() }).from(users).where(eq(users.role, 'technician'));

      diagnostics.hierarchy.users.admins = Number(userAdminCount[0].value);
      diagnostics.hierarchy.users.teamLeads = Number(userLeadCount[0].value);
      diagnostics.hierarchy.users.technicians = Number(userTechCount[0].value);

      // Check hierarchy in technicians table
      const techAdminCount = await db.select({ value: count() }).from(technicians).where(eq(technicians.role, 'admin'));
      const techLeadCount = await db.select({ value: count() }).from(technicians).where(eq(technicians.role, 'team_lead'));
      const techTechCount = await db.select({ value: count() }).from(technicians).where(eq(technicians.role, 'technician'));

      diagnostics.hierarchy.technicians.admins = Number(techAdminCount[0].value);
      diagnostics.hierarchy.technicians.teamLeads = Number(techLeadCount[0].value);
      diagnostics.hierarchy.technicians.technicians = Number(techTechCount[0].value);
      
      diagnostics.database.connected = true;
    } catch (err: any) {
      diagnostics.database.error = err.message;
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
