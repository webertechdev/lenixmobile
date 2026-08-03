import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/drizzle/schema';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const allCustomers = await db.select().from(customers);
    return NextResponse.json(allCustomers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const [newCustomer] = await db.insert(customers).values(data).returning();
    return NextResponse.json(newCustomer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
