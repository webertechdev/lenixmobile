import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { technicians } from '@/drizzle/schema';
import { count, desc, ilike, or, sql } from 'drizzle-orm';

export async function GET(req: Request) {
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

    const url = new URL(req.url);
    const requestedPage = Number(url.searchParams.get('page'));
    const requestedPageSize = Number(url.searchParams.get('pageSize'));
    const hasPagination = url.searchParams.has('page') || url.searchParams.has('pageSize');
    const searchQuery = url.searchParams.get('q')?.trim() || '';
    const searchCondition = searchQuery
      ? or(
          ilike(technicians.name, `%${searchQuery}%`),
          ilike(technicians.email, `%${searchQuery}%`),
          ilike(technicians.phone, `%${searchQuery}%`),
          ilike(technicians.specialization, `%${searchQuery}%`),
          sql`cast(${technicians.role} as text) ilike ${`%${searchQuery}%`}`,
          sql`cast(${technicians.invitationStatus} as text) ilike ${`%${searchQuery}%`}`,
        )
      : undefined;
    const pageSize = [5, 50, 100].includes(requestedPageSize) ? requestedPageSize : 5;
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const totalRows = await db.select({ count: count() }).from(technicians).where(searchCondition);
    const totalItems = Number(totalRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const query = db.select().from(technicians)
      .where(searchCondition)
      .orderBy(desc(technicians.createdAt));
    const techs = hasPagination
      ? await query.limit(pageSize).offset((safePage - 1) * pageSize)
      : await query;

    return NextResponse.json(techs, {
      headers: { 'X-Total-Count': String(totalItems) },
    });
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
