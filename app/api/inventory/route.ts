import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory } from '@/drizzle/schema';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const items = await db.select().from(inventory);
    return NextResponse.json(items);
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
    const [newItem] = await db.insert(inventory).values({
      ...data,
      quantity: parseInt(data.quantity.toString()),
      minimumStock: parseInt(data.minimumStock.toString()),
    }).returning();
    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
