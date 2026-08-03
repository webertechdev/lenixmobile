import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './drizzle/schema';

const connectionString = 'postgresql://lenix:lenix123@localhost:5432/lenix_db';
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding data...');

  // Create a user
  const [user] = await db.insert(schema.users).values({
    supabaseId: 'mock-supabase-id',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  }).returning();

  // Create technicians
  const [tech1] = await db.insert(schema.technicians).values({
    userId: user.id,
    name: 'Fidelis Musyoka Kioko',
    email: 'fidelis@lenix.com',
    phone: '0722508904',
    specialization: 'Hardware & Software',
    role: 'team_lead',
  }).returning();

  const [tech2] = await db.insert(schema.technicians).values({
    userId: user.id,
    name: 'Main Technician',
    email: 'tech@lenix.com',
    phone: '0712345678',
    specialization: 'All repairs',
    role: 'technician',
  }).returning();

  // Create a customer
  const [customer] = await db.insert(schema.customers).values({
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '0987654321',
  }).returning();

  // Create some repairs
  await db.insert(schema.repairs).values([
    {
      repairNumber: 'REP-001',
      customerId: customer.id,
      technicianId: tech1.id,
      deviceModel: 'iPhone 13',
      imei: '123456789012345',
      phoneNumber: '0987654321',
      region: 'North',
      complaint: 'Screen cracked',
      faultType: 'Screen',
      repairType: 'hardware',
      status: 'open',
      financialService: 'cash',
      warrantyStatus: 'out_of_warranty',
      dateReceived: new Date(),
    },
    {
      repairNumber: 'REP-002',
      customerId: customer.id,
      technicianId: tech1.id,
      deviceModel: 'Samsung S22',
      imei: '223456789012345',
      phoneNumber: '0987654321',
      region: 'South',
      complaint: 'Battery draining',
      faultType: 'Battery',
      repairType: 'hardware',
      status: 'completed',
      financialService: 'loan',
      warrantyStatus: 'out_of_warranty',
      dateReceived: new Date(Date.now() - 86400000 * 2),
      dateCompleted: new Date(),
    },
    {
      repairNumber: 'REP-003',
      customerId: customer.id,
      technicianId: tech1.id,
      deviceModel: 'Google Pixel 6',
      imei: '323456789012345',
      phoneNumber: '0987654321',
      region: 'East',
      complaint: 'Charging port issue',
      faultType: 'Charging',
      repairType: 'hardware',
      status: 'waiting_parts',
      financialService: 'cash',
      warrantyStatus: 'in_warranty',
      dateReceived: new Date(Date.now() - 86400000),
    }
  ]);

  // Create inventory
  await db.insert(schema.inventory).values([
    {
      partName: 'iPhone 13 Screen',
      partCode: 'SCR-IP13',
      quantity: 2,
      minimumStock: 5,
      unitPrice: '150.00',
    },
    {
      partName: 'Samsung S22 Battery',
      partCode: 'BAT-S22',
      quantity: 10,
      minimumStock: 3,
      unitPrice: '50.00',
    }
  ]);

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
