import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { users, technicians } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Check if user exists in database
    let existingUser: any[] = [];
    try {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.supabaseId, user.id));
    } catch (err: any) {
      console.error('Error querying users:', err.message);
      return NextResponse.json({
        error: 'Database query failed. Please run the setup SQL script in Supabase SQL Editor first.',
        code: 'DB_ERROR',
        detail: err.message,
      }, { status: 503 });
    }

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        message: 'User already synced',
        user: existingUser[0]
      });
    }

    // User doesn't exist yet - create them
    // Check if this user was invited (has a pre-created technician profile)
    let technicianProfile: any = null;
    let invitedRole = 'viewer';
    
    try {
      const techProfiles = await db
        .select()
        .from(technicians)
        .where(eq(technicians.email, user.email || ''));
      
      if (techProfiles.length > 0) {
        technicianProfile = techProfiles[0];
        invitedRole = technicianProfile.role || 'technician';
      }
    } catch (err: any) {
      console.error('Error checking technician profile:', err.message);
    }

    // Check if this is the first user (only if no technician profile exists)
    let isFirstUser = false;
    if (!technicianProfile) {
      try {
        const allUsers = await db.select().from(users);
        isFirstUser = allUsers.length === 0;
      } catch (err: any) {
        console.error('Error checking existing users:', err.message);
        isFirstUser = true;
      }
    }

    // Determine the role for this user
    const userRole = technicianProfile ? invitedRole : (isFirstUser ? 'admin' : 'viewer');

    try {
      const [newUser] = await db
        .insert(users)
        .values({
          supabaseId: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: userRole,
        })
        .returning();

      // If this user was invited, link them to the technician profile
      if (technicianProfile) {
        try {
          await db
            .update(technicians)
            .set({
              userId: newUser.id,
              invitationStatus: 'accepted',
              updatedAt: new Date(),
            })
            .where(eq(technicians.id, technicianProfile.id));
        } catch (linkErr: any) {
          console.error('Failed to link technician profile:', linkErr.message);
          // Don't fail the sync if linking fails
        }
      }

      return NextResponse.json({
        message: technicianProfile 
          ? `Welcome ${newUser.name}! Your ${invitedRole} account has been activated.`
          : 'User synced successfully' + (isFirstUser ? ' (auto-promoted to admin)' : ''),
        user: newUser,
        isFirstUser,
        isInvited: !!technicianProfile,
        role: userRole,
      });
    } catch (insertErr: any) {
      console.error('Error inserting user:', insertErr.message);
      
      if (insertErr?.code === '42501' || insertErr?.message?.includes('permission denied')) {
        return NextResponse.json({
          error: 'Database permission denied. Please run this in Supabase SQL Editor:\n\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\nGRANT ALL ON users TO authenticated;',
          code: 'RLS_BLOCKED',
        }, { status: 403 });
      }
      
      if (insertErr?.code === '42703' || insertErr?.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Database schema needs updating. Please run the setup SQL script in Supabase SQL Editor.',
          code: 'SCHEMA_MISMATCH',
          detail: insertErr.message,
        }, { status: 500 });
      }
      
      return NextResponse.json({
        error: 'Failed to create user record: ' + (insertErr?.message || 'Unknown error'),
        code: 'INSERT_FAILED',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error syncing user:', error);

    if (error?.code === 'ENOTFOUND') {
      return NextResponse.json({
        error: 'Database server not found. Check DATABASE_URL configuration.',
      }, { status: 503 });
    }

    return NextResponse.json({
      error: error?.message || 'Failed to sync user',
    }, { status: 500 });
  }
}
