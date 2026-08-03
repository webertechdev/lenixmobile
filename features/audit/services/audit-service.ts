import { db } from '@/lib/db';
import { auditLog } from '@/drizzle/schema';

export async function logAction(
  tableName: string,
  recordId: number,
  userId: number | null,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  oldData?: any,
  newData?: any
) {
  try {
    await db.insert(auditLog).values({
      tableName,
      recordId,
      userId,
      action,
      oldData,
      newData,
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
}
