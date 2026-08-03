import { db } from '@/lib/db';
import { technicians, repairs } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function getAllTechnicians() {
  const result = await db.select().from(technicians).orderBy(desc(technicians.createdAt));
  return result;
}

export async function getTechnicianById(id: number) {
  const result = await db.select().from(technicians).where(eq(technicians.id, id));
  return result[0];
}

export async function createTechnician(data: any) {
  const { name, email, phone, specialization, role = 'technician', userId = null } = data;
  
  const [newTechnician] = await db.insert(technicians).values({
    name,
    email,
    phone,
    specialization,
    role,
    userId,
  }).returning();
  
  return newTechnician;
}

export async function updateTechnician(id: number, data: any) {
  const { name, email, phone, specialization, role, isActive } = data;
  
  const [updatedTechnician] = await db
    .update(technicians)
    .set({
      name,
      email,
      phone,
      specialization,
      role,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(technicians.id, id))
    .returning();
  
  return updatedTechnician;
}

export async function deleteTechnician(id: number) {
  // First, unassign all repairs assigned to this technician
  await db
    .update(repairs)
    .set({ technicianId: null })
    .where(eq(repairs.technicianId, id));

  // Then delete the technician
  const [deletedTechnician] = await db
    .delete(technicians)
    .where(eq(technicians.id, id))
    .returning();
  
  return deletedTechnician;
}
