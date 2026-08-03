import { NextResponse } from 'next/server';
import { importRepairsFromCsv } from '@/features/repairs/services/import-service';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let dbUser = await db.select().from(users).where(eq(users.supabaseId, user.id));
    let userId = dbUser[0]?.id;
    
    if (!userId) {
      try {
        const [newUser] = await db.insert(users).values({
          supabaseId: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'admin',
        }).returning();
        userId = newUser.id;
      } catch (err) {
        console.error('Failed to auto-create user for import:', err);
      }
    }

    const { rows } = await req.json();
    const results = await importRepairsFromCsv(rows, userId);
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
