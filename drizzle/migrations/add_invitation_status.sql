-- Add invitation status to technicians table
-- This tracks whether a technician has accepted their invitation

-- Step 1: Create enum for invitation status
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'invitation_status'
    ) THEN
        CREATE TYPE "public"."invitation_status" AS ENUM ('pending', 'accepted', 'expired');
    END IF;
END $$;

-- Step 2: Add invitation_status column to technicians table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'invitation_status'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "invitation_status" "invitation_status" DEFAULT 'pending' NOT NULL;
    END IF;
END $$;

-- Step 3: Add invitation_sent_at column to track when invite was sent
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'technicians' AND column_name = 'invitation_sent_at'
    ) THEN
        ALTER TABLE "technicians" ADD COLUMN "invitation_sent_at" timestamp;
    END IF;
END $$;

-- Step 4: Update existing technicians to 'accepted' status if they have a user_id
UPDATE "technicians" SET "invitation_status" = 'accepted' WHERE "user_id" IS NOT NULL;

-- Step 5: Verify the changes
SELECT 'Migration complete!' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'technicians' 
ORDER BY ordinal_position;
