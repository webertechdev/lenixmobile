import { NextResponse } from 'next/server';
import { getAllTechnicians } from '@/features/technicians/services/technician-service';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ 
        error: 'Database not configured. Please set DATABASE_URL environment variable.' 
      }, { status: 503 });
    }

    const techs = await getAllTechnicians();
    return NextResponse.json(techs);
  } catch (error: any) {
    console.error('Error fetching technicians:', error);
    
    if (error?.code === 'ENOTFOUND') {
      return NextResponse.json({ 
        error: 'Database server not found. Check your DATABASE_URL is correct.' 
      }, { status: 503 });
    }

    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database schema needs updating. Please run the fix_schema.sql script in Supabase SQL Editor.',
        code: 'SCHEMA_MISMATCH',
      }, { status: 500 });
    }

    if (error?.code === '42501' || error?.message?.includes('permission denied')) {
      return NextResponse.json({ 
        error: 'Database permission denied. Run the fix_schema.sql script in Supabase SQL Editor.',
        code: 'RLS_BLOCKED',
      }, { status: 403 });
    }
    
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
