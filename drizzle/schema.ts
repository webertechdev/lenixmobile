import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  jsonb,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "technician", "team_lead", "viewer"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "expired"]);
export const repairTypeEnum = pgEnum("repair_type", ["software", "hardware", "both"]);
export const financialServiceEnum = pgEnum("financial_service", ["cash", "loan"]);
export const warrantyStatusEnum = pgEnum("warranty_status", ["in_warranty", "out_of_warranty"]);
export const statusEnum = pgEnum("status", [
  "open",
  "in_progress",
  "waiting_parts",
  "quality_check",
  "completed",
  "returned",
  "cancelled",
]);

/**
 * Core user table linked to Supabase Auth
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: varchar("supabase_id", { length: 255 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Customers table
 */
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  address: text("address"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Technicians table
 */
export const technicians = pgTable("technicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  specialization: varchar("specialization", { length: 255 }),
  role: roleEnum("role").default("technician").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  invitationStatus: invitationStatusEnum("invitation_status").default("pending").notNull(),
  invitationSentAt: timestamp("invitation_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Repairs table
 */
export const repairs = pgTable("repairs", {
  id: serial("id").primaryKey(),
  repairNumber: varchar("repair_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  technicianId: integer("technician_id").references(() => technicians.id),
  deviceModel: varchar("device_model", { length: 255 }).notNull(),
  imei: varchar("imei", { length: 50 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  complaint: text("complaint").notNull(),
  faultType: varchar("fault_type", { length: 255 }),
  repairType: repairTypeEnum("repair_type").notNull(),
  financialService: financialServiceEnum("financial_service").notNull(),
  warrantyStatus: warrantyStatusEnum("warranty_status").notNull(),
  status: statusEnum("status").default("open").notNull(),
  solution: text("solution"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  remarks: text("remarks"),
  photoFront: text("photo_front"),
  photoBack: text("photo_back"),
  photoRepair: text("photo_repair"),
  photoFinalQA: text("photo_final_qa"),
  dateReceived: timestamp("date_received").notNull(),
  dateCompleted: timestamp("date_completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Inventory table
 */
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  partName: varchar("part_name", { length: 255 }).notNull(),
  partCode: varchar("part_code", { length: 100 }).unique(),
  quantity: integer("quantity").default(0).notNull(),
  minimumStock: integer("minimum_stock").default(5).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  photoUrl: text("photo_url"),
  supplier: varchar("supplier", { length: 255 }),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Repair Parts junction table
 */
export const repairParts = pgTable("repair_parts", {
  id: serial("id").primaryKey(),
  repairId: integer("repair_id").references(() => repairs.id).notNull(),
  partId: integer("part_id").references(() => inventory.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Status History table
 */
export const statusHistory = pgTable("status_history", {
  id: serial("id").primaryKey(),
  repairId: integer("repair_id").references(() => repairs.id).notNull(),
  previousStatus: statusEnum("previous_status"),
  newStatus: statusEnum("new_status").notNull(),
  changedBy: integer("changed_by").references(() => users.id).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Audit Log table
 */
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 100 }).notNull(),
  recordId: integer("record_id").notNull(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 20 }).notNull(), // INSERT, UPDATE, DELETE
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
