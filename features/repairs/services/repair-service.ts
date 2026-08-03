import { db } from '@/lib/db';
import { repairs, customers, repairParts, inventory } from '@/drizzle/schema';
import { logAction } from '@/features/audit/services/audit-service';
import { count, eq, sql, and } from 'drizzle-orm';

export async function generateRepairNumber() {
  const year = new Date().getFullYear();
  const prefix = `LNX-${year}-`;
  
  const result = await db
    .select({ count: count() })
    .from(repairs)
    .where(sql`${repairs.repairNumber} LIKE ${prefix + '%'}`);
    
  const nextNum = (result[0]?.count || 0) + 1;
  return `${prefix}${nextNum.toString().padStart(6, '0')}`;
}

export async function createRepair(data: any, userId: number | null) {
  const repairNumber = await generateRepairNumber();
  
  let customerId = data.customerId;
  
  // If customerId is missing but customerName is provided, create a new customer
  if (!customerId && data.customerName) {
    const [newCustomer] = await db.insert(customers).values({
      name: data.customerName,
      phone: data.phoneNumber,
      city: data.city,
      region: data.region,
    }).returning();
    customerId = newCustomer.id;
  }

  // Remove customerName from data before inserting into repairs table
  const { customerName, ...repairData } = data;

  if (!customerId) {
    throw new Error("Customer is required. Please provide a Customer Name or select an existing customer.");
  }

  const [newRepair] = await db.insert(repairs).values({
    ...repairData,
    customerId: typeof customerId === 'string' ? parseInt(customerId) : customerId,
    technicianId: repairData.technicianId ? parseInt(repairData.technicianId) : null,
    repairNumber,
    dateReceived: repairData.dateReceived ? new Date(repairData.dateReceived) : new Date(),
  }).returning();
  
  await logAction('repairs', newRepair.id, userId, 'INSERT', null, newRepair);
  return newRepair;
}

export async function updateRepair(id: number, data: any, userId: number) {
  const [oldRepair] = await db.select().from(repairs).where(eq(repairs.id, id));
  const [updatedRepair] = await db.update(repairs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(repairs.id, id))
    .returning();
    
  await logAction('repairs', id, userId, 'UPDATE', oldRepair, updatedRepair);
  return updatedRepair;
}

export async function checkImeiExists(imei: string) {
  const result = await db.select({ count: count() }).from(repairs).where(eq(repairs.imei, imei));
  return (result[0]?.count || 0) > 0;
}

export async function addPartToRepair(repairId: number, partId: number, quantity: number, userId: number) {
  const [part] = await db.select().from(inventory).where(eq(inventory.id, partId));
  if (!part) throw new Error('Part not found');
  
  const [newRepairPart] = await db.insert(repairParts).values({
    repairId,
    partId,
    quantity,
    unitPrice: part.unitPrice,
  }).returning();

  // Update inventory quantity
  await db.update(inventory)
    .set({ quantity: sql`${inventory.quantity} - ${quantity}` })
    .where(eq(inventory.id, partId));
    
  await logAction('repair_parts', newRepairPart.id, userId, 'INSERT', null, newRepairPart);
  return newRepairPart;
}

export async function deleteRepair(id: number, userId: number) {
  const [oldRepair] = await db.select().from(repairs).where(eq(repairs.id, id));
  if (!oldRepair) throw new Error('Repair not found');
  
  // Also delete related repair parts
  await db.delete(repairParts).where(eq(repairParts.repairId, id));
  
  const [deletedRepair] = await db.delete(repairs)
    .where(eq(repairs.id, id))
    .returning();
    
  await logAction('repairs', id, userId, 'DELETE', oldRepair, null);
  return deletedRepair;
}

export async function getRepairParts(repairId: number) {
  return await db.select({
    id: repairParts.id,
    partName: inventory.partName,
    partCode: inventory.partCode,
    quantity: repairParts.quantity,
    unitPrice: repairParts.unitPrice,
  })
  .from(repairParts)
  .leftJoin(inventory, eq(repairParts.partId, inventory.id))
  .where(eq(repairParts.repairId, repairId));
}
