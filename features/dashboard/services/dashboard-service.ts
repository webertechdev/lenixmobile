import { db } from '@/lib/db';
import { repairs, inventory, technicians } from '@/drizzle/schema';
import { count, eq, sql, and, notInArray, desc } from 'drizzle-orm';

export async function getDashboardStats() {
  const defaultStats = {
    kpis: {
      open: 0,
      completed: 0,
      waitingParts: 0,
      avgTat: "0.0"
    },
    charts: {
      cashVsLoan: [],
      repairsByRegion: [],
      repairsByTechnician: [],
      commonFaults: []
    },
    alerts: {
      lowStock: []
    }
  };

  if (!db) {
    console.error("Database client is not initialized. Check DATABASE_URL.");
    return defaultStats;
  }

  try {
    const openRepairs = await db.select({ count: count() }).from(repairs).where(eq(repairs.status, 'open'));
    const completedRepairs = await db.select({ count: count() }).from(repairs).where(eq(repairs.status, 'completed'));
    const waitingParts = await db.select({ count: count() }).from(repairs).where(eq(repairs.status, 'waiting_parts'));
    
    // Average Turnaround Time (TAT) in days
    const tatResult = await db.execute(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (date_completed - date_received)) / 86400) as avg_tat 
      FROM repairs 
      WHERE status = 'completed' AND date_completed IS NOT NULL
    `);
    
    const cashVsLoan = await db.select({
      service: repairs.financialService,
      count: count()
    }).from(repairs).groupBy(repairs.financialService);
    
    const repairsByRegion = await db.select({
      region: repairs.region,
      count: count()
    }).from(repairs).groupBy(repairs.region);
    
    const repairsByTechnician = await db.select({
      techName: technicians.name,
      count: count()
    }).from(repairs)
      .leftJoin(technicians, eq(repairs.technicianId, technicians.id))
      .groupBy(technicians.name);
      
    const commonFaults = await db.select({
      fault: repairs.faultType,
      count: count()
    }).from(repairs)
      .groupBy(repairs.faultType)
      .orderBy(desc(count()))
      .limit(5);
      
    const lowStockAlerts = await db.select({
      partName: inventory.partName,
      quantity: inventory.quantity,
      minStock: inventory.minimumStock
    }).from(inventory).where(sql`${inventory.quantity} <= ${inventory.minimumStock}`);

    return {
      kpis: {
        open: openRepairs[0]?.count || 0,
        completed: completedRepairs[0]?.count || 0,
        waitingParts: waitingParts[0]?.count || 0,
        avgTat: Number(tatResult[0]?.avg_tat || 0).toFixed(1)
      },
      charts: {
        cashVsLoan,
        repairsByRegion,
        repairsByTechnician,
        commonFaults
      },
      alerts: {
        lowStock: lowStockAlerts
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    
    // If DB is connected but query fails, it might be a schema issue
    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
      console.error("Schema mismatch detected. Ensure schema is pushed to Supabase.");
    }
    
    return defaultStats;
  }
}
