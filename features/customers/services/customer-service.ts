import { db } from '@/lib/db';
import { customers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function updateCustomer(id: number, data: any) {
  const [updatedCustomer] = await db.update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return updatedCustomer;
}

export async function deleteCustomer(id: number) {
  const [deletedCustomer] = await db.delete(customers)
    .where(eq(customers.id, id))
    .returning();
  return deletedCustomer;
}
