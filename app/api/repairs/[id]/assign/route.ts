import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { repairs, users, technicians, statusHistory, auditLog } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Get current user's role
    const dbUser = await db.select().from(users).where(eq(users.supabaseId, user.id));
    if (!dbUser.length) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    const currentUserRole = dbUser[0].role;

    // Only admin and team_lead can assign technicians
    if (currentUserRole !== 'admin' && currentUserRole !== 'team_lead') {
      return NextResponse.json({ 
        error: 'Only Admins and Team Leads can assign technicians to repairs.' 
      }, { status: 403 });
    }

    const { id } = await params;
    const repairId = parseInt(id);
    const { technicianId } = await req.json();

    if (!technicianId) {
      return NextResponse.json({ error: 'Technician ID is required' }, { status: 400 });
    }

    // Verify technician exists
    const technician = await db.select().from(technicians).where(eq(technicians.id, technicianId));
    if (!technician.length) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Get current repair to check status
    const currentRepair = await db.select().from(repairs).where(eq(repairs.id, repairId));
    if (!currentRepair.length) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    // Update repair with assigned technician
    const [updated] = await db.update(repairs)
      .set({
        technicianId: technicianId,
        status: currentRepair[0].status === 'open' ? 'in_progress' : currentRepair[0].status,
        updatedAt: new Date(),
      })
      .where(eq(repairs.id, repairId))
      .returning();

    // Log status history
    try {
      await db.insert(statusHistory).values({
        repairId,
        previousStatus: currentRepair[0].status,
        newStatus: updated.status,
        changedBy: dbUser[0].id,
        reason: `Assigned to ${technician[0].name}`,
      });

      // Log audit
      await db.insert(auditLog).values({
        tableName: 'repairs',
        recordId: repairId,
        userId: dbUser[0].id,
        action: 'UPDATE',
        oldData: JSON.stringify({ technicianId: currentRepair[0].technicianId, status: currentRepair[0].status }),
        newData: JSON.stringify({ technicianId, status: updated.status }),
      });
    } catch (logErr) {
      console.error('Failed to log assignment:', logErr);
      // Don't fail the assignment if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      repair: updated,
      technician: technician[0],
    });
  } catch (error: any) {
    console.error('Error assigning technician:', error);
    return NextResponse.json({ error: error.message || 'Failed to assign technician' }, { status: 500 });
  }
}
