import { NextResponse } from 'next/server';
import { updateTechnician, deleteTechnician } from '@/features/technicians/services/technician-service';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const techId = parseInt(id);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const updatedTech = await updateTechnician(techId, data);
    return NextResponse.json(updatedTech);
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
    const techId = parseInt(id);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedTech = await deleteTechnician(techId);
    return NextResponse.json(deletedTech);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
