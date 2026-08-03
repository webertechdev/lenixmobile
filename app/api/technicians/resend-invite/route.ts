import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { db } from '@/lib/db';
import { users, technicians } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

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
      return NextResponse.json({ error: 'Only admins can resend invitations' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the technician
    const tech = await db.select().from(technicians).where(eq(technicians.email, email));
    if (tech.length === 0) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    const technician = tech[0];

    // Check if SUPABASE_SERVICE_ROLE_KEY is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured on server.',
        hint: 'Invitations require the Service Role Key to be set in environment variables.'
      }, { status: 500 });
    }

    const adminClient = createAdminClient();
    
    // Invite/Resend invite via Supabase Auth
    console.log(`Attempting to invite user: ${email}`);
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: technician.name,
          role: technician.role,
          technician_id: technician.id,
        },
      }
    );

    if (inviteError) {
      console.error('Supabase Invite Error:', inviteError);
      return NextResponse.json({ 
        error: inviteError.message,
        success: false,
        hint: 'Check your Supabase project settings and email provider limits.'
      }, { status: 500 });
    }

    console.log('Invite successful:', inviteData);

    // Update technician with invitation sent timestamp
    await db
      .update(technicians)
      .set({
        invitationSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(technicians.id, technician.id));

    return NextResponse.json({
      message: `Invitation resent to ${email}`,
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
