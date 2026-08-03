import { NextResponse } from 'next/server';
import { updateRepair, deleteRepair } from '@/features/repairs/services/repair-service';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users, repairs } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

async function getUserId(supabaseId: string) {
  const dbUser = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
  return dbUser[0]?.id || null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repairId = parseInt(id);
    const [repair] = await db.select().from(repairs).where(eq(repairs.id, repairId));
    
    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    return NextResponse.json(repair);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repairId = parseInt(id);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(user.id);
    const data = await req.json();
    
    const updatedRepair = await updateRepair(repairId, data, userId || 0);
    return NextResponse.json(updatedRepair);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repairId = parseInt(id);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserId(user.id);
    const deletedRepair = await deleteRepair(repairId, userId || 0);
    return NextResponse.json(deletedRepair);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
