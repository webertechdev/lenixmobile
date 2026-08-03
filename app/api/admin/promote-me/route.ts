import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { eq, ne } from 'drizzle-orm';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Check if an admin already exists (other than current user)
    const existingAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
    const isOtherAdmin = existingAdmins.some((u: any) => u.supabaseId !== user.id);
    
    if (isOtherAdmin) {
      return NextResponse.json({ 
        error: 'There can only be one Admin. An admin already exists in the system.' 
      }, { status: 400 });
    }

    // Find the user in database
    const dbUser = await db.select().from(users).where(eq(users.supabaseId, user.id));

    if (!dbUser[0]) {
      // Auto-create user as admin since they don't exist yet
      try {
        const [newUser] = await db.insert(users).values({
          supabaseId: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'admin',
        }).returning();
        
        return NextResponse.json({
          message: 'User created and promoted to admin successfully',
          user: newUser,
        });
      } catch (insertErr: any) {
        return NextResponse.json({ 
          error: 'User not found in database and could not auto-create. Please run the SQL setup script in Supabase SQL Editor first.',
          detail: insertErr.message,
        }, { status: 404 });
      }
    }

    // If already admin, return success
    if (dbUser[0].role === 'admin') {
      return NextResponse.json({
        message: 'You are already an admin',
        user: dbUser[0],
      });
    }

    // Promote to admin
    const [updatedUser] = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.supabaseId, user.id))
      .returning();

    return NextResponse.json({
      message: 'Successfully promoted to admin',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error promoting user:', error);
    
    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
      return NextResponse.json({
        error: 'Database schema issue. Run in Supabase SQL Editor:\n\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\nGRANT ALL ON users TO authenticated;',
        code: 'SCHEMA_MISMATCH',
      }, { status: 500 });
    }
    
    if (error?.code === '42501' || error?.message?.includes('permission denied')) {
      return NextResponse.json({
        error: 'Database permission denied. Run in Supabase SQL Editor:\n\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\nGRANT ALL ON users TO authenticated;',
        code: 'RLS_BLOCKED',
      }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to promote user' },
      { status: 500 }
    );
  }
}
