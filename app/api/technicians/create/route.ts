import { NextResponse } from 'next/server';
import { createTechnician } from '@/features/technicians/services/technician-service';
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

    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 });
    }

    // Find the current user in database and get their role
    let dbUser = await db.select().from(users).where(eq(users.supabaseId, user.id));
    
    if (dbUser.length === 0) {
      return NextResponse.json({ 
        error: 'Your user profile not found. Please log out and log back in.' 
      }, { status: 404 });
    }

    const currentUserRole = dbUser[0].role;

    // RESTORED: Only admin can create team members
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Only the Admin can add team members.' 
      }, { status: 403 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.phone || !data.email) {
      return NextResponse.json({ 
        error: 'Name, email, and phone are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 });
    }

    // Enforce Hierarchy: 1 Admin, 1 Team Lead, Many Technicians
    if (data.role === 'admin') {
      const existingAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
      const existingAdminTechs = await db.select().from(technicians).where(eq(technicians.role, 'admin'));
      
      if (existingAdmins.length > 0 || existingAdminTechs.length > 0) {
        return NextResponse.json({ 
          error: 'There can only be one Admin in the system. An Admin already exists.' 
        }, { status: 400 });
      }
    }

    if (data.role === 'team_lead') {
      const existingLeads = await db.select().from(users).where(eq(users.role, 'team_lead'));
      const existingLeadTechs = await db.select().from(technicians).where(eq(technicians.role, 'team_lead'));
      
      if (existingLeads.length > 0 || existingLeadTechs.length > 0) {
        return NextResponse.json({ 
          error: 'There can only be one Team Lead in the system. A Team Lead already exists.' 
        }, { status: 400 });
      }
    }

    // Check if technician with this email already exists
    const existingTech = await db.select().from(technicians).where(eq(technicians.email, data.email));
    if (existingTech.length > 0) {
      return NextResponse.json({ 
        error: `A team member with email ${data.email} already exists.` 
      }, { status: 400 });
    }

    // Create technician record FIRST (before inviting)
    // userId is intentionally null - will be linked when user verifies email
    // invitationStatus is 'pending' - will change to 'accepted' when user logs in
    const newTechnician = await createTechnician({
      name: data.name,
      email: data.email,
      phone: data.phone,
      specialization: data.specialization || null,
      role: data.role || 'technician',
      userId: null, // IMPORTANT: This will be linked when user verifies email
    });

    // Now invite the user via Supabase Auth
    let invitationSent = false;
    let invitationError = null;

    try {
      // Check if SUPABASE_SERVICE_ROLE_KEY is available
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not set. Invitations cannot be sent.');
        invitationError = 'Service Role Key not configured on server. Email invitations cannot be sent.';
      } else {
        const adminClient = createAdminClient();
        
        // Check if user already exists in Supabase Auth
        const { data: existingUsers, error: searchError } = await adminClient.auth.admin.listUsers();
        
        const userExists = existingUsers?.users?.some((u: any) => u.email === data.email);

        if (!userExists) {
          // Invite new user
          const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
            data.email,
            {
              data: {
                full_name: data.name,
                role: data.role || 'technician',
                technician_id: newTechnician.id,
              },
            }
          );

          if (inviteError) {
            console.error('Invite error:', inviteError);
            invitationError = inviteError.message;
          } else {
            invitationSent = true;
            // Update technician with invitation sent timestamp
            await db
              .update(technicians)
              .set({
                invitationSentAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(technicians.id, newTechnician.id));
          }
        } else {
          console.log('User already exists in Supabase Auth');
          invitationSent = false;
        }
      }
    } catch (inviteErr: any) {
      console.error('Failed to invite user:', inviteErr);
      invitationError = inviteErr.message;
    }

    const roleLabel = data.role === 'admin' ? 'Admin' : data.role === 'team_lead' ? 'Team Lead' : 'Technician';

    if (invitationSent) {
      return NextResponse.json({
        message: `${roleLabel} created and invitation sent to ${data.email}`,
        technician: newTechnician,
        invited: true,
        invitationSent: true,
      });
    } else if (invitationError) {
      return NextResponse.json({
        message: `${roleLabel} profile created but invitation failed to send.`,
        technician: newTechnician,
        invited: false,
        invitationSent: false,
        error: invitationError,
        hint: 'Make sure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.',
      }, { status: 200 });
    } else {
      return NextResponse.json({
        message: `${roleLabel} created. User already exists in system.`,
        technician: newTechnician,
        invited: false,
        invitationSent: false,
      });
    }
  } catch (error: any) {
    console.error('Error creating technician:', error);
    
    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Database schema needs updating. Please run the add_invitation_status.sql script in Supabase SQL Editor.',
        code: 'SCHEMA_MISMATCH',
        detail: error.message,
      }, { status: 500 });
    }

    if (error?.code === '23502' || error?.message?.includes('not-null constraint')) {
      return NextResponse.json({ 
        error: 'Database constraint error. Please run the add_invitation_status.sql script in Supabase SQL Editor.',
        code: 'CONSTRAINT_ERROR',
        detail: error.message,
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create technician' 
    }, { status: 500 });
  }
}
