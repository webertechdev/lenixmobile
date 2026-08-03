DO $$ BEGIN
 CREATE TYPE "public"."financial_service" AS ENUM('cash', 'loan');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."repair_type" AS ENUM('software', 'hardware', 'both');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('admin', 'technician', 'team_lead', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."status" AS ENUM('open', 'in_progress', 'waiting_parts', 'quality_check', 'completed', 'returned', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."warranty_status" AS ENUM('in_warranty', 'out_of_warranty');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" integer NOT NULL,
	"user_id" integer,
	"action" varchar(20) NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(320),
	"city" varchar(100),
	"region" varchar(100),
	"address" text,
	"photo_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"part_code" varchar(100),
	"quantity" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer DEFAULT 5 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"photo_url" text,
	"supplier" varchar(255),
	"category" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_part_code_unique" UNIQUE("part_code")
);

CREATE TABLE IF NOT EXISTS "repair_parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"repair_id" integer NOT NULL,
	"part_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "repairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"repair_number" varchar(50) NOT NULL,
	"customer_id" integer NOT NULL,
	"technician_id" integer,
	"device_model" varchar(255) NOT NULL,
	"imei" varchar(50) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"city" varchar(100),
	"region" varchar(100),
	"complaint" text NOT NULL,
	"fault_type" varchar(255),
	"repair_type" "repair_type" NOT NULL,
	"financial_service" "financial_service" NOT NULL,
	"warranty_status" "warranty_status" NOT NULL,
	"status" "status" DEFAULT 'open' NOT NULL,
	"solution" text,
	"cost" numeric(10, 2),
	"remarks" text,
	"photo_front" text,
	"photo_back" text,
	"photo_repair" text,
	"photo_final_qa" text,
	"date_received" timestamp NOT NULL,
	"date_completed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repairs_repair_number_unique" UNIQUE("repair_number"),
	CONSTRAINT "repairs_imei_unique" UNIQUE("imei")
);

CREATE TABLE IF NOT EXISTS "status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"repair_id" integer NOT NULL,
	"previous_status" "status",
	"new_status" "status" NOT NULL,
	"changed_by" integer NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "technicians" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(20),
	"specialization" varchar(255),
	"role" "role" DEFAULT 'technician' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"supabase_id" varchar(255) NOT NULL,
	"name" text,
	"email" varchar(320),
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabase_id_unique" UNIQUE("supabase_id")
);

DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repair_parts" ADD CONSTRAINT "repair_parts_part_id_inventory_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repairs" ADD CONSTRAINT "repairs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "repairs" ADD CONSTRAINT "repairs_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "status_history" ADD CONSTRAINT "status_history_repair_id_repairs_id_fk" FOREIGN KEY ("repair_id") REFERENCES "public"."repairs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Disable RLS for app to work
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE technicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON technicians TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON repairs TO authenticated;
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON repair_parts TO authenticated;
GRANT ALL ON status_history TO authenticated;
GRANT ALL ON audit_log TO authenticated;
