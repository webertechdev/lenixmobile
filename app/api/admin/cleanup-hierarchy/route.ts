import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users, technicians } from '@/drizzle/schema';
import { eq, and, ne, notInArray } from 'drizzle-orm';

export async function POST(req: Request) {
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

    const currentAdminId = dbUser[0].id;
    const currentAdminEmail = dbUser[0].email;

    // 1. CLEAN UP USERS TABLE
    // Keep only the current admin as admin, demote others to technician
    await db
      .update(users)
      .set({ role: 'technician' })
      .where(and(eq(users.role, 'admin'), ne(users.id, currentAdminId)));
    
    // Keep only the first team lead found in users, demote others
    const teamLeads = await db.select().from(users).where(eq(users.role, 'team_lead'));
    if (teamLeads.length > 1) {
      const firstLeadId = teamLeads[0].id;
      await db
        .update(users)
        .set({ role: 'technician' })
        .where(and(eq(users.role, 'team_lead'), ne(users.id, firstLeadId)));
    }

    // 2. CLEAN UP TECHNICIANS TABLE
    // Keep only the current admin's technician profile as admin (if linked), demote others
    await db
      .update(technicians)
      .set({ role: 'technician' })
      .where(and(eq(technicians.role, 'admin'), ne(technicians.email, currentAdminEmail)));

    // Keep only the first team lead found in technicians, demote others
    const techTeamLeads = await db.select().from(technicians).where(eq(technicians.role, 'team_lead'));
    if (techTeamLeads.length > 1) {
      const firstTechLeadId = techTeamLeads[0].id;
      await db
        .update(technicians)
        .set({ role: 'technician' })
        .where(and(eq(technicians.role, 'team_lead'), ne(technicians.id, firstTechLeadId)));
    }

    return NextResponse.json({
      message: 'Hierarchy cleaned up successfully. Duplicate roles in both Users and Technicians tables have been demoted.',
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
