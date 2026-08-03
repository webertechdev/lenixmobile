import { db } from '@/lib/db';
import { inventory } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function updateInventory(id: number, data: any) {
  const [updatedItem] = await db.update(inventory)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(inventory.id, id))
    .returning();
  return updatedItem;
}

export async function deleteInventory(id: number) {
  const [deletedItem] = await db.delete(inventory)
    .where(eq(inventory.id, id))
    .returning();
  return deletedItem;
}
