CREATE TABLE IF NOT EXISTS "services" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "code" varchar(100),
  "category" varchar(100),
  "description" text,
  "fee" numeric(10, 2) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "services_code_unique" UNIQUE("code")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "repair_services" (
  "id" serial PRIMARY KEY NOT NULL,
  "repair_id" integer NOT NULL,
  "service_id" integer,
  "service_name" varchar(255) NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_fee" numeric(10, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "repair_services"
    ADD CONSTRAINT "repair_services_repair_id_repairs_id_fk"
    FOREIGN KEY ("repair_id")
    REFERENCES "public"."repairs"("id")
    ON DELETE no action
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "repair_services"
    ADD CONSTRAINT "repair_services_service_id_services_id_fk"
    FOREIGN KEY ("service_id")
    REFERENCES "public"."services"("id")
    ON DELETE no action
    ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;